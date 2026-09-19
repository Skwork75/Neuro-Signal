import Link from "next/link";
import { ArrowRight, BarChart3, Lightbulb, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mapJournal, type JournalRow } from "@/lib/journal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function PatternsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("*, analysis_results(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const entries = ((data ?? []) as JournalRow[]).map(mapJournal);
  const analyzed = entries.filter((entry) => entry.analysis);
  const themes = analyzed.flatMap((entry) => entry.analysis?.themes ?? []);
  const themeCounts = Object.entries(themes.reduce<Record<string, number>>((counts, theme) => ({ ...counts, [theme]: (counts[theme] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const energy = entries.map((entry) => entry.checkIn?.energy).filter((value): value is number => typeof value === "number");
  const averageEnergy = energy.length ? (energy.reduce((sum, value) => sum + value, 0) / energy.length).toFixed(1) : null;
  const commonTheme = themeCounts[0]?.[0];

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
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-emerald-600" />Themes that keep showing up</CardTitle></CardHeader>
            <CardContent>{themeCounts.length ? <div className="flex flex-wrap gap-2">{themeCounts.slice(0, 6).map(([theme, count]) => <Badge key={theme} className="bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">{theme} · {count} entries</Badge>)}</div> : <p className="text-sm text-slate-600 dark:text-emerald-100/65">Themes become visible when entries mention recurring parts of life such as work, rest, or relationships.</p>}</CardContent>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/70 dark:bg-emerald-950/45">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-emerald-600" />A useful next question</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-6 text-slate-700">{commonTheme ? `${commonTheme} appears often in your writing. What is one condition that makes this area feel even 10% easier?` : "What do your better days have in common? Try noting sleep, connection, workload, or movement in your next entry."}</p></CardContent>
          </Card>
        </>
      )}
      <p className="text-xs text-slate-500">These are reflective patterns, not medical conclusions. More entries create a clearer picture.</p>
    </div>
  );
}
