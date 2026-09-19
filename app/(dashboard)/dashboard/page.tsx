import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CalendarDays, Compass, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatEntryDate,
  levelBadgeClass,
  mapJournal,
  type JournalRow,
} from "@/lib/journal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { QuickCheckIn } from "@/components/dashboard/quick-checkin";
import type { EmotionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmotionMark } from "@/components/insights/emotion-mark";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("*, analysis_results(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const entries = ((data ?? []) as JournalRow[]).map(mapJournal);
  const totalEntries = entries.length;
  const emotionCounts = entries.reduce(
    (counts, entry) => {
      const emotion = entry.analysis?.dominantEmotion;
      if (emotion) counts[emotion] = (counts[emotion] ?? 0) + 1;
      return counts;
    },
    {} as Partial<Record<EmotionType, number>>,
  );
  const dominantEmotion =
    (Object.entries(emotionCounts) as [EmotionType, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? null;
  const lastEntry = entries[0];
  const recent = entries.slice(0, 5);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEntries = entries.filter((entry) => new Date(entry.createdAt) >= weekStart).length;
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-5 animate-soft-rise">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{todayLabel}</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-emerald-50 sm:text-5xl">How are you, really?</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-emerald-100/65">A small check-in can give the rest of the day somewhere gentler to go.</p>
        </div>
        <Link
          href="/journal/new"
          className={cn(buttonVariants({ size: "lg" }), "bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800")}
        >
          <Compass className="size-4" />Write a moment
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="animate-soft-rise stagger-1 border-emerald-100 bg-white/70 dark:border-emerald-900/70 dark:bg-emerald-950/40">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{totalEntries}</CardContent>
        </Card>
        <Card className="animate-soft-rise stagger-2 border-amber-100 bg-white/70 dark:border-amber-900/70 dark:bg-emerald-950/40">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Top Emotion</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-2xl font-semibold">
            {dominantEmotion ? <><EmotionMark emotion={dominantEmotion} />{dominantEmotion}</> : "—"}
          </CardContent>
        </Card>
        <Card className="animate-soft-rise stagger-3 border-sky-100 bg-white/70 dark:border-sky-900/70 dark:bg-emerald-950/40">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Last Entry</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {lastEntry ? formatEntryDate(lastEntry.createdAt) : "—"}
          </CardContent>
        </Card>
      </div>

      <QuickCheckIn />

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="border-emerald-100 bg-emerald-950 text-white shadow-xl shadow-emerald-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-100"><Sparkles className="size-4" />Your weekly signal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold leading-tight">{weekEntries ? `${weekEntries} ${weekEntries === 1 ? "moment" : "moments"} noticed this week.` : "Your first page is waiting."}</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-emerald-100/75">Patterns become more useful when you pair your words with one small action. Start with a two-minute reflection today.</p>
            <Link href="/patterns" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">See your patterns <ArrowUpRight className="size-4" /></Link>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/70 dark:border-emerald-900/70 dark:bg-emerald-950/40">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-amber-600" />A gentle prompt</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-medium leading-7 text-slate-800 dark:text-emerald-50">What would make today feel 10% kinder?</p><Link href="/journal/new" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300">Write it down <ArrowUpRight className="inline size-4" /></Link></CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Recent entries</h2>
        {recent.length === 0 ? (
          <Card className="items-center py-12 text-center">
            <CardContent className="space-y-3">
              <p className="text-slate-600">No entries yet. Write your first reflection.</p>
              <Link
                href="/journal/new"
                className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-500")}
              >
                Write first entry
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((entry) => (
                <Card key={entry.id} className="bg-white/70 dark:bg-emerald-950/40">
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">
                      {entry.analysis ? <EmotionMark emotion={entry.analysis.dominantEmotion} /> : <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Compass className="size-4" /></span>}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {formatEntryDate(entry.createdAt)}
                    </span>
                    {entry.analysis ? (
                      <>
                        <Badge className={levelBadgeClass(entry.analysis.stressLevel)}>
                          Stress {entry.analysis.stressLevel}
                        </Badge>
                        <Badge className={levelBadgeClass(entry.analysis.riskLevel)}>
                          Support {entry.analysis.riskLevel}
                        </Badge>
                      </>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
