-- Run this in the Supabase SQL editor. It creates or upgrades the complete data model.
-- Journal contents are protected by row-level security: users can only access their own data.

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 10 and 3000),
  word_count integer not null default 0 check (word_count >= 0),
  check_in jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null unique references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  dominant_emotion text,
  emotion_scores jsonb not null default '{}'::jsonb,
  stress_level text,
  stress_score numeric,
  risk_level text,
  risk_score numeric,
  confidence integer,
  summary text,
  insights jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  themes jsonb not null default '[]'::jsonb,
  reflection_question text,
  experiment text,
  crisis_detected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analysis_emotion_check check (dominant_emotion is null or dominant_emotion in ('Happy', 'Sad', 'Angry', 'Fear', 'Neutral')),
  constraint analysis_stress_check check (stress_level is null or stress_level in ('Low', 'Medium', 'High')),
  constraint analysis_risk_check check (risk_level is null or risk_level in ('Low', 'Moderate', 'High')),
  constraint analysis_score_check check ((stress_score is null or stress_score between 0 and 100) and (risk_score is null or risk_score between 0 and 100) and (confidence is null or confidence between 0 and 100))
);

create table if not exists public.quick_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('Great', 'Good', 'Okay', 'Low', 'Rough')),
  energy integer not null check (energy between 1 and 5),
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now()
);

-- Upgrade quick check-ins created by earlier versions of the app.
alter table public.quick_checkins add column if not exists mood text;
alter table public.quick_checkins add column if not exists energy integer;
alter table public.quick_checkins add column if not exists note text;
alter table public.quick_checkins add column if not exists created_at timestamptz not null default now();

-- Upgrade databases created by earlier versions of the app.
alter table public.journal_entries add column if not exists word_count integer not null default 0;
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();
alter table public.journal_entries add column if not exists check_in jsonb not null default '{}'::jsonb;
alter table public.analysis_results add column if not exists dominant_emotion text;
alter table public.analysis_results add column if not exists emotion_scores jsonb not null default '{}'::jsonb;
alter table public.analysis_results add column if not exists stress_level text;
alter table public.analysis_results add column if not exists stress_score numeric;
alter table public.analysis_results add column if not exists risk_level text;
alter table public.analysis_results add column if not exists risk_score numeric;
alter table public.analysis_results add column if not exists confidence integer;
alter table public.analysis_results add column if not exists summary text;
alter table public.analysis_results add column if not exists insights jsonb not null default '[]'::jsonb;
alter table public.analysis_results add column if not exists recommendations jsonb not null default '[]'::jsonb;
alter table public.analysis_results add column if not exists themes jsonb not null default '[]'::jsonb;
alter table public.analysis_results add column if not exists reflection_question text;
alter table public.analysis_results add column if not exists experiment text;
alter table public.analysis_results add column if not exists crisis_detected boolean not null default false;
alter table public.analysis_results add column if not exists created_at timestamptz not null default now();
alter table public.analysis_results add column if not exists updated_at timestamptz not null default now();

create index if not exists quick_checkins_user_created_idx on public.quick_checkins(user_id, created_at desc);

-- Earlier prototypes may have model-specific required columns. They must not
-- prevent current analysis records from being written.
do $$
declare column_record record;
begin
  for column_record in
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'analysis_results'
      and is_nullable = 'NO' and column_name not in ('id', 'journal_id', 'user_id')
  loop
    execute format('alter table public.analysis_results alter column %I drop not null', column_record.column_name);
  end loop;
end $$;

-- The old API could create repeated analyses for the same entry. Preserve the
-- newest record before enforcing the one-analysis-per-entry invariant.
delete from public.analysis_results
where id in (
  select id from (
    select id, row_number() over (partition by journal_id order by created_at desc, id desc) as row_number
    from public.analysis_results
  ) duplicates where row_number > 1
);

create unique index if not exists analysis_results_journal_id_key on public.analysis_results(journal_id);
create index if not exists journal_entries_user_created_idx on public.journal_entries(user_id, created_at desc);
create index if not exists analysis_results_user_idx on public.analysis_results(user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at before update on public.journal_entries for each row execute function public.set_updated_at();
drop trigger if exists analysis_results_set_updated_at on public.analysis_results;
create trigger analysis_results_set_updated_at before update on public.analysis_results for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;
alter table public.analysis_results enable row level security;
alter table public.quick_checkins enable row level security;
drop policy if exists "Users manage their own journal entries" on public.journal_entries;
create policy "Users manage their own journal entries" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own analysis" on public.analysis_results;
create policy "Users manage their own analysis" on public.analysis_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their own quick check-ins" on public.quick_checkins;
create policy "Users manage their own quick check-ins" on public.quick_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
