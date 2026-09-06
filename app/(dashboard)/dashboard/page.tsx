import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import type { EmotionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">A snapshot of your recent emotional writing.</p>
        </div>
        <Link
          href="/journal/new"
          className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-500")}
        >
          New Entry
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Total Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{totalEntries}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Top Emotion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {dominantEmotion
              ? `${EMOTION_EMOJI[dominantEmotion]} ${dominantEmotion}`
              : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Last Entry</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {lastEntry ? formatEntryDate(lastEntry.createdAt) : "—"}
          </CardContent>
        </Card>
      </div>

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
                          Risk {entry.analysis.riskLevel}
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
