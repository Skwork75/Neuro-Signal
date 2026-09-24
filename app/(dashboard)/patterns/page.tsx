import Link from "next/link";
import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapJournal, type JournalRow } from "@/lib/journal";
import type { JournalEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const DAY_WINDOWS = [7, 14, 30] as const;

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {});
}

function summarizeWindow(entries: JournalEntry[], days: number, now: number) {
  const recent = entries.filter((entry) => {
    const date = new Date(entry.createdAt).getTime();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return date >= cutoff;
  });

  if (recent.length < 2) {
    return {
      days,
      enoughEvidence: false,
      summary: "Not enough writing in this window yet to spot a stable pattern.",
      dominantEmotion: "—",
      mainTheme: "—",
      averageEnergy: "Not tracked yet",
      stressHint: "No clear stress signal yet",
    };
  }

  const analyzed = recent.filter((entry) => entry.analysis);
  const emotions = analyzed.map((entry) => entry.analysis?.dominantEmotion ?? "Neutral");
  const themes = analyzed.flatMap((entry) => entry.analysis?.themes ?? []);
  const stressScores = analyzed
    .map((entry) => entry.analysis?.stressScore ?? null)
    .filter((value): value is number => typeof value === "number");
  const energy = recent
    .map((entry) => entry.checkIn?.energy)
    .filter((value): value is number => typeof value === "number");

  const emotionCounts = countBy(emotions as string[]);
  const themeCounts = countBy(themes as string[]);
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Neutral";
  const mainTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "still emerging";
  const averageEnergy = energy.length ? (energy.reduce((sum, value) => sum + value, 0) / energy.length).toFixed(1) : "Not tracked yet";
  const averageStress = stressScores.length ? Math.round(stressScores.reduce((sum, value) => sum + value, 0) / stressScores.length) : null;

  return {
    days,
    enoughEvidence: true,
    summary: `Over the last ${days} days, ${dominantEmotion.toLowerCase()} is the strongest repeated tone, with ${mainTheme.toLowerCase()} appearing as the recurring context.`,
    dominantEmotion,
    mainTheme,
    averageEnergy: typeof averageEnergy === "string" ? averageEnergy : `${averageEnergy} / 5`,
    stressHint: averageStress === null ? "No clear stress signal yet" : averageStress >= 65 ? "stress signal trending higher" : averageStress >= 35 ? "stress signal is moderate" : "stress signal is relatively low",
  };
}

export default async function PatternsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id, user_id, content, created_at, updated_at, check_in, analysis_results(dominant_emotion, emotion_scores, stress_level, stress_score, risk_level, risk_score, confidence, summary, insights, recommendations, themes, reflection_question, experiment, crisis_detected)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(120);
  const entries = ((data ?? []) as JournalRow[]).map(mapJournal);
  const analyzed = entries.filter((entry) => entry.analysis);
  const themes = analyzed.flatMap((entry) => entry.analysis?.themes ?? []);
  const themeCounts = Object.entries(countBy(themes)).sort((a, b) => b[1] - a[1]);
  const energy = entries.map((entry) => entry.checkIn?.energy).filter((value): value is number => typeof value === "number");
  const averageEnergy = energy.length ? (energy.reduce((sum, value) => sum + value, 0) / energy.length).toFixed(1) : null;
  const commonTheme = themeCounts[0]?.[0];
  const now = Date.now();
  const windowSummaries = DAY_WINDOWS.map((days) => summarizeWindow(entries, days, now));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Your emotional memory</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-emerald-50">Patterns, not labels</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-emerald-100/65">A gentle read of your latest {entries.length} private entries.</p>
        </div>
        <Link href="/journal/new" className={cn(buttonVariants(), "bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800")}>Write an entry <ArrowRight className="size-4" /></Link>
      </div>

      {entries.length < 3 ? (
        <Card className="border-dashed py-12 text-center"><CardContent><Sparkles className="mx-auto size-7 text-emerald-600" /><h2 className="mt-3 font-semibold text-slate-900 dark:text-emerald-50">Your story is just starting</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-emerald-100/65">Write a few entries and add optional check-ins. NeuroSignal will surface recurring themes and what supports you.</p></CardContent></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-white/70 dark:bg-emerald-950/40"><CardHeader><CardTitle className="text-sm text-slate-500">Entries reflected on</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{entries.length}</CardContent></Card>
            <Card className="bg-white/70 dark:bg-emerald-950/40"><CardHeader><CardTitle className="text-sm text-slate-500">Most recurring theme</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{commonTheme ?? "Still emerging"}</CardContent></Card>
            <Card className="bg-white/70 dark:bg-emerald-950/40"><CardHeader><CardTitle className="text-sm text-slate-500">Average energy check-in</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{averageEnergy ? `${averageEnergy} / 5` : "Not tracked yet"}</CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {windowSummaries.map((window) => (
              <Card key={window.days} className="bg-white/70 dark:bg-emerald-950/35">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-600 dark:text-emerald-100/80">{window.days}-day pattern</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700 dark:text-emerald-50/80">
                  <p className="font-medium text-slate-900 dark:text-emerald-50">{window.enoughEvidence ? window.summary : window.summary}</p>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-emerald-100/70">
                    <div><span className="font-medium text-slate-800 dark:text-emerald-100">Dominant emotion:</span> {window.dominantEmotion}</div>
                    <div><span className="font-medium text-slate-800 dark:text-emerald-100">Recurring theme:</span> {window.mainTheme}</div>
                    <div><span className="font-medium text-slate-800 dark:text-emerald-100">Energy:</span> {window.averageEnergy}</div>
                    <div><span className="font-medium text-slate-800 dark:text-emerald-100">Stress signal:</span> {window.stressHint}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-emerald-600" />Themes that keep showing up</CardTitle></CardHeader>
            <CardContent>{themeCounts.length ? <div className="flex flex-wrap gap-2">{themeCounts.slice(0, 6).map(([theme, count]) => <Badge key={theme} className="bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">{theme} · {count} entries</Badge>)}</div> : <p className="text-sm text-slate-600 dark:text-emerald-100/65">Themes become visible when entries mention recurring parts of life such as work, rest, or relationships.</p>}</CardContent>
          </Card>
        </>
      )}
      <p className="text-xs text-slate-500">These are reflective patterns, not medical conclusions. More entries create a clearer picture.</p>
    </div>
  );
}
