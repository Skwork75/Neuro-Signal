import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CalendarDays, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EMOTION_EMOJI,
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
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">{todayLabel}</p>
          <h1 className="mt-1 text-4xl font-semibold text-slate-900">How are you, really?</h1>
          <p className="mt-1 text-sm text-slate-500">A small check-in can make the rest of the day more intentional.</p>
        </div>
        <Link
          href="/journal/new"
          className={cn(buttonVariants({ size: "lg" }), "bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800")}
        >
          New Entry
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-100 bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{totalEntries}</CardContent>
        </Card>
        <Card className="border-amber-100 bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Top Emotion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {dominantEmotion
              ? `${EMOTION_EMOJI[dominantEmotion]} ${dominantEmotion}`
              : "—"}
          </CardContent>
        </Card>
        <Card className="border-sky-100 bg-white/90">
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
        <Card className="border-slate-200 bg-white/90">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-4 text-amber-600" />A gentle prompt</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-medium leading-7 text-slate-800">What would make today feel 10% kinder?</p><Link href="/journal/new" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900">Write it down <ArrowUpRight className="inline size-4" /></Link></CardContent>
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
              <Card key={entry.id} className="bg-white">
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">
                      {entry.analysis
                        ? EMOTION_EMOJI[entry.analysis.dominantEmotion]
                        : "📝"}
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
