-- Run this once in Supabase SQL Editor.
-- It is safe to run more than once.

alter table public.journal_entries
  add column if not exists word_count integer;

alter table public.analysis_results
  add column if not exists dominant_emotion text,
  add column if not exists emotion_scores jsonb,
  add column if not exists stress_level text,
  add column if not exists stress_score numeric,
  add column if not exists risk_level text,
  add column if not exists risk_score numeric,
  add column if not exists summary text,
  add column if not exists insights jsonb,
  add column if not exists recommendations jsonb,
  add column if not exists crisis_detected boolean default false,
  add column if not exists created_at timestamptz default now();

-- Older versions of the app may have added required columns such as
-- emotion, depression_risk, or other model-specific fields. They must not
-- block inserts from the current analysis format.
do $$
declare
  column_record record;
begin
  for column_record in
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analysis_results'
      and is_nullable = 'NO'
      and column_name not in ('id', 'journal_id', 'user_id')
  loop
    execute format(
      'alter table public.analysis_results alter column %I drop not null',
      column_record.column_name
    );
  end loop;
end $$;

update public.analysis_results
set
  emotion_scores = coalesce(emotion_scores, '{}'::jsonb),
  insights = coalesce(insights, '[]'::jsonb),
  recommendations = coalesce(recommendations, '[]'::jsonb),
  crisis_detected = coalesce(crisis_detected, false),
  created_at = coalesce(created_at, now())
where emotion_scores is null
   or insights is null
   or recommendations is null
   or crisis_detected is null
   or created_at is null;

notify pgrst, 'reload schema';
