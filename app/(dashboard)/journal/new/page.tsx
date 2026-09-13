"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Lightbulb,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { barColorClass, EMOTION_EMOJI, levelBadgeClass } from "@/lib/journal";
import type { AnalysisResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "What felt heaviest today, and what helped even a little?",
  "Describe a moment you felt proud of how you handled something.",
  "What emotion has been visiting you most this week?",
  "If a trusted friend felt the way you feel now, what would you tell them?",
  "What is one small thing you need more of right now?",
];

export default function NewJournalPage() {
  const [prompt] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
  );
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [event, setEvent] = useState("");
  const [need, setNeed] = useState("");
  const [action, setAction] = useState("");

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  function resetForm() {
    setContent("");
    setError("");
    setResult(null);
    setReflectionAnswer("");
    setReflectionSaved(false);
    setEnergy(0);
    setEvent("");
    setNeed("");
    setAction("");
  }

  async function saveReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReflectionLoading(true);
    try {
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Reflection question: ${result?.reflectionQuestion}\n\nMy response: ${reflectionAnswer.trim()}`,
          checkIn: { helped: true },
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save your reflection.");
      setReflectionSaved(true);
      setReflectionAnswer("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your reflection.");
    } finally {
      setReflectionLoading(false);
    }
  }

  async function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setLoading(true);

    try {
      const journalResponse = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          checkIn: {
            ...(energy ? { energy } : {}),
            ...(event.trim() ? { event: event.trim() } : {}),
            ...(need.trim() ? { need: need.trim() } : {}),
            ...(action.trim() ? { action: action.trim() } : {}),
          },
        }),
      });
      const journalData = (await journalResponse.json()) as {
        journalId?: string;
        error?: string;
      };

      if (!journalResponse.ok || !journalData.journalId) {
        throw new Error(journalData.error ?? "Could not save your entry.");
      }

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalId: journalData.journalId }),
      });
      const analysis = (await analyzeResponse.json()) as AnalysisResult & {
        error?: string;
        crisis_detected?: boolean;
        recommendations?: string[];
      };

      if (!analyzeResponse.ok) {
        throw new Error(analysis.error ?? "Could not analyze your entry.");
      }

      setResult({
        ...analysis,
        crisisDetected: analysis.crisisDetected ?? Boolean(analysis.crisis_detected),
        recommendations: analysis.recommendations ?? [],
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const suggestions = result.recommendations.length
      ? result.recommendations
      : result.insights;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="size-6" />
          <h1 className="text-2xl font-semibold">Analysis Complete</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Emotion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl">
                {EMOTION_EMOJI[result.dominantEmotion]} {result.dominantEmotion}
              </p>
              <p className="mt-1 text-sm text-slate-500">{result.confidence}% signal strength</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Stress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge className={levelBadgeClass(result.stressLevel)}>
                {result.stressLevel}
              </Badge>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", barColorClass(result.stressLevel))}
                  style={{ width: `${Math.min(100, result.stressScore)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Support signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge className={levelBadgeClass(result.riskLevel)}>
                {result.riskLevel}
              </Badge>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", barColorClass(result.riskLevel))}
                  style={{ width: `${Math.min(100, result.riskScore)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {result.summary ? (
          <p className="text-sm text-slate-600">{result.summary}</p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
              {suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {result.themes.length ? (
          <div className="flex flex-wrap gap-2">
            {result.themes.map((theme) => <Badge key={theme} className="bg-indigo-100 text-indigo-800">{theme}</Badge>)}
          </div>
        ) : null}

        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-indigo-600" />A question for you</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-700">{result.reflectionQuestion}</p>
            <form onSubmit={saveReflection} className="mt-4 space-y-3">
              <Textarea
                value={reflectionAnswer}
                onChange={(event) => { setReflectionAnswer(event.target.value.slice(0, 3000)); setReflectionSaved(false); setError(""); }}
                minLength={10}
                maxLength={3000}
                required
                className="min-h-24 resize-none border-indigo-200 bg-white"
                placeholder="Write what comes up for you..."
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">Your response is saved privately as a new entry.</span>
                <Button type="submit" disabled={reflectionLoading || reflectionAnswer.trim().length < 10} className="bg-indigo-600 text-white hover:bg-indigo-500">
                  {reflectionLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {reflectionSaved ? "Saved" : "Save reflection"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardHeader><CardTitle className="text-base">A small experiment</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-6 text-slate-700">{result.experiment}</p></CardContent>
        </Card>

        {result.crisisDetected ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
            <p className="font-medium">You do not have to go through this alone.</p>
            <p className="mt-2">
              If you may act on these thoughts, call your local emergency number now.
              Find local, confidential crisis support at <strong>findahelpline.com</strong>.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={resetForm}
            className="bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Write Another Entry
          </Button>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Entry</h1>
        <p className="text-sm text-slate-500">Write freely. Analysis stays private to your account.</p>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        {prompt}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, 3000))}
          maxLength={3000}
          required
          className="min-h-[200px] resize-none"
          placeholder="How are you feeling right now?"
        />
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Add a quick check-in (optional)</summary>
          <p className="mt-1 text-xs text-slate-500">These tiny details make your future pattern reports more useful.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="energy">Energy level: {energy || "not set"}</Label>
              <input id="energy" type="range" min="1" max="5" value={energy || 3} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <div className="space-y-1.5"><Label htmlFor="event">What happened?</Label><Input id="event" maxLength={160} value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. A difficult meeting" /></div>
            <div className="space-y-1.5"><Label htmlFor="need">What did you need?</Label><Input id="need" maxLength={160} value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. Reassurance or rest" /></div>
            <div className="space-y-1.5"><Label htmlFor="action">What did you do next?</Label><Input id="action" maxLength={160} value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Took a walk" /></div>
          </div>
        </details>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{wordCount} words</span>
          <span>{content.length}/3000</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="size-3.5" />
          Only you can see this entry. It is a reflective tool, never a medical diagnosis.
        </p>
        <Button
          type="submit"
          disabled={loading || content.trim().length < 10}
          className="h-10 w-full bg-indigo-600 text-white hover:bg-indigo-500"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Analyzing..." : "Analyze My Entry"}
        </Button>
      </form>
    </div>
  );
}
