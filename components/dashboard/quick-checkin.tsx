"use client";

import { useState } from "react";
import { Check, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const moods = [
  { value: "Great", emoji: "😄" }, { value: "Good", emoji: "🙂" }, { value: "Okay", emoji: "😐" }, { value: "Low", emoji: "😕" }, { value: "Rough", emoji: "😣" },
] as const;

export function QuickCheckIn() {
  const [mood, setMood] = useState<(typeof moods)[number]["value"]>("Okay");
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  async function save() {
    setStatus("saving");
    setErrorMessage("");
    try {
      const response = await fetch("/api/checkins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood, energy, ...(note.trim() ? { note: note.trim() } : {}) }) });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? "Could not save your check-in.");
      }
      setStatus("done"); setNote("");
    } catch (reason) {
      setStatus("error");
      setErrorMessage(reason instanceof Error ? reason.message : "Could not save your check-in.");
    }
  }
  return <section className="rounded-2xl border border-emerald-900/80 bg-gradient-to-br from-emerald-950 to-teal-950 p-5 text-emerald-50 shadow-sm">
    <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-semibold text-emerald-50"><Zap className="size-4 text-emerald-400" />Quick check-in</p><p className="mt-1 text-sm text-emerald-200/70">A 10-second snapshot for clearer patterns later.</p></div>{status === "done" ? <span className="flex items-center gap-1 text-sm font-medium text-emerald-300"><Check className="size-4" />Saved</span> : null}</div>
    <div className="mt-4 flex flex-wrap gap-2">{moods.map((item) => <button key={item.value} type="button" onClick={() => { setMood(item.value); setStatus("idle"); }} className={cn("rounded-xl border px-3 py-2 text-sm transition", mood === item.value ? "border-emerald-400 bg-emerald-400 text-emerald-950 shadow-sm" : "border-emerald-800/80 bg-emerald-900/60 text-emerald-100 hover:border-emerald-600 hover:bg-emerald-800")}><span className="mr-1.5">{item.emoji}</span>{item.value}</button>)}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-sm text-emerald-200/80">Energy: <strong className="text-emerald-50">{energy}/5</strong><input aria-label="Energy level" type="range" min="1" max="5" value={energy} onChange={(event) => { setEnergy(Number(event.target.value)); setStatus("idle"); }} className="mt-2 block w-full accent-emerald-400" /></label><Button type="button" onClick={save} disabled={status === "saving"} className="self-end bg-emerald-500 text-emerald-950 hover:bg-emerald-400">{status === "saving" ? <Loader2 className="size-4 animate-spin" /> : null}Save check-in</Button></div>
    <Input value={note} onChange={(event) => { setNote(event.target.value); setStatus("idle"); }} maxLength={280} placeholder="Optional: what is affecting you today?" className="mt-3 border-emerald-800/80 bg-emerald-900/60 text-emerald-50 placeholder:text-emerald-200/50" />
    {status === "error" ? <p className="mt-2 text-xs text-red-700">{errorMessage}</p> : null}
  </section>;
}
