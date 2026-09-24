"use client";

import { useState } from "react";
import { ArrowRight, Brain, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatEntryDate, levelBadgeClass } from "@/lib/journal";
import type { CounselorMessage, CounselorResult } from "@/lib/types";

type Entry = { id: string; content: string; created_at: string };

const questions = [
  ["reason", "What brings you here today?", "For example: I keep feeling tense after work."],
  ["feelings", "What are you noticing in your thoughts or feelings?", "Use your own words. There is no right answer."],
  ["impact", "How is this affecting your day-to-day life?", "Sleep, focus, relationships, energy, or anything else."],
  ["support", "What kind of support would feel useful right now?", "A next step, a way to communicate, a calming practice, or simply clarity."],
] as const;

export default function CounselorWorkspace({ entries }: { entries: Entry[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<CounselorResult | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleEntry(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function saveReflection() {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Counselor reflection\n\nWhat I was working through: ${answers.reason}\n\nWhat I noticed: ${answers.feelings}\n\nA next step: ${result.nextSteps[0] ?? result.reflectionQuestion}`,
          checkIn: { helped: true },
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save this reflection.");
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this reflection.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "initial", ...answers, extra, entryIds: selected }),
      });
      const data = await response.json() as CounselorResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not prepare your reflection.");
      setResult(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not prepare your reflection.");
    } finally {
      setLoading(false);
    }
  }

  async function sendFollowUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !result || !followUp.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "follow_up",
          ...answers,
          extra,
          entryIds: selected,
          answer: followUp.trim(),
          conversation: result.conversation ?? [],
          turn: result.turn ?? 0,
        }),
      });
      const data = await response.json() as CounselorResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not continue the reflection.");
      setResult(data);
      setFollowUp("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not continue the reflection.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const isComplete = Boolean(result.isComplete);
    const visibleMessages = (result.conversation ?? []).filter((message, index, messages) => !( !isComplete && index === messages.length - 1 && message.role === "assistant"));
    return <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-500"><Check className="size-4" />{isComplete ? "Reflection complete" : "Reflection in progress"}</p><h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-emerald-50">{isComplete ? "A thoughtful next step" : "Let’s explore this together"}</h1><p className="mt-2 text-sm text-slate-600 dark:text-emerald-100/70">Built from your answers and {result.sourceCount} selected journal {result.sourceCount === 1 ? "entry" : "entries"}.</p></div>
        <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setResult(null); setFollowUp(""); }}>Start over</Button>{isComplete ? <Button type="button" onClick={saveReflection} disabled={saving || saved} className="bg-emerald-600 text-white hover:bg-emerald-500">{saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}{saved ? "Saved to journal" : "Save reflection"}</Button> : null}</div>
      </div>
      {result.analysis.crisisDetected ? <Alert variant="destructive"><AlertDescription>If you may act on thoughts of harming yourself or someone else, contact your local emergency number now or visit findahelpline.com for immediate, confidential support.</AlertDescription></Alert> : null}
      <Card className="border-emerald-800/70 bg-emerald-950 text-emerald-50"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-100"><Sparkles className="size-4" />{isComplete ? "What we discovered" : "What I am hearing"}</CardTitle></CardHeader><CardContent><div className="space-y-4">{visibleMessages.map((message: CounselorMessage, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-3xl rounded-xl bg-emerald-800/70 p-3 text-sm leading-6 text-emerald-50" : "max-w-3xl whitespace-pre-line text-lg leading-7 text-emerald-50"}>{message.content}</div>)}</div>{isComplete ? <div className="mt-4 flex flex-wrap gap-2"><Badge className="bg-emerald-400 text-emerald-950">Focus: {result.focus}</Badge><Badge className={levelBadgeClass(result.analysis.stressLevel)}>Stress {result.analysis.stressLevel}</Badge><Badge className={levelBadgeClass(result.analysis.riskLevel)}>Support {result.analysis.riskLevel}</Badge></div> : null}</CardContent></Card>
      {isComplete ? <><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowRight className="size-4 text-emerald-500" />Personalized small steps</CardTitle></CardHeader><CardContent><ol className="space-y-3 text-sm leading-6 text-slate-600 dark:text-emerald-100/75">{result.nextSteps.map((step, index) => <li key={step} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{index + 1}</span><span>{step}</span></li>)}</ol></CardContent></Card><Card className="border-amber-200/70 bg-amber-50/60 dark:border-amber-800/70 dark:bg-amber-950/40"><CardHeader><CardTitle className="text-amber-950 dark:text-amber-100">One thing to carry forward</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-amber-950/80 dark:text-amber-100/75">{result.finalTakeaway}</p></CardContent></Card></div></> : <Card className="border-amber-200/70 bg-amber-50/60 dark:border-amber-800/70 dark:bg-amber-950/40"><CardHeader><CardTitle className="text-amber-950 dark:text-amber-100">A question to explore</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-amber-950/80 dark:text-amber-100/75">{result.reflectionQuestion}</p><form onSubmit={sendFollowUp} className="mt-4 space-y-3"><Textarea value={followUp} onChange={(event) => setFollowUp(event.target.value)} maxLength={2000} required placeholder="Write your response..." className="min-h-28 border-amber-300/70 bg-white/70 dark:border-amber-800 dark:bg-amber-950/50" /><Button type="submit" disabled={loading || !followUp.trim()} className="bg-amber-600 text-white hover:bg-amber-500">{loading ? <Loader2 className="size-4 animate-spin" /> : null}{loading ? "Thinking..." : "Send"}</Button></form></CardContent></Card>}
      <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-emerald-100/55"><ShieldCheck className="size-4" />This is a private reflection tool, not medical advice or a diagnosis.</p>
    </div>;
  }

  return <div className="mx-auto max-w-5xl space-y-7"><div><p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400"><Brain className="size-4" />Guided support</p><h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-emerald-50">Talk it through</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-emerald-100/70">A calm, structured conversation with yourself. Bring in journal moments when they help tell the fuller story.</p></div>
    {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    <form onSubmit={submit} className="space-y-4"><Card><CardHeader><CardTitle className="text-base">A few questions</CardTitle></CardHeader><CardContent className="space-y-5">{questions.map(([key, label, placeholder], index) => <div key={key} className="space-y-2"><label htmlFor={key} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-emerald-50"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{index + 1}</span>{label}{index < 2 ? <span className="text-emerald-600">*</span> : null}</label><Textarea id={key} required={index < 2} minLength={index < 2 ? 3 : undefined} maxLength={500} value={answers[key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="min-h-20 resize-none" /></div>)}<div className="space-y-2"><label htmlFor="extra" className="text-sm font-medium text-slate-800 dark:text-emerald-50">Anything else you want me to know?</label><Textarea id="extra" maxLength={2000} value={extra} onChange={(event) => setExtra(event.target.value)} placeholder="Add a detail, a recent event, or words you could not find in the questions." className="min-h-24 resize-none" /></div></CardContent></Card>
      {entries.length ? <Card><CardHeader><CardTitle className="text-base">Bring in journal moments <span className="font-normal text-slate-500 dark:text-emerald-100/60">(optional)</span></CardTitle></CardHeader><CardContent className="space-y-2">{entries.map((entry) => <label key={entry.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-emerald-400 hover:bg-emerald-50/60 dark:border-emerald-900/80 dark:hover:bg-emerald-950/50"><input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggleEntry(entry.id)} className="mt-1 accent-emerald-600" /><span className="min-w-0"><span className="block text-xs font-medium text-emerald-700 dark:text-emerald-300">{formatEntryDate(entry.created_at)}</span><span className="mt-1 block line-clamp-2 text-sm text-slate-600 dark:text-emerald-100/70">{entry.content}</span></span></label>)}</CardContent></Card> : <Card className="border-dashed"><CardContent className="py-7 text-center text-sm text-slate-500 dark:text-emerald-100/60">Your journal is empty for now. The answers above are enough to begin.</CardContent></Card>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-slate-500 dark:text-emerald-100/55"><ShieldCheck className="size-4" />Only your account can access this reflection.</p><Button type="submit" disabled={loading || (answers.reason ?? "").trim().length < 3 || (answers.feelings ?? "").trim().length < 3} className="bg-emerald-600 text-white hover:bg-emerald-500">{loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{loading ? "Thinking..." : "Prepare my reflection"}</Button></div></form>
  </div>;
}