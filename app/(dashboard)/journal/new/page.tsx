"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Lightbulb,
  Loader2,
  Lock,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  function resetForm() {
    setContent("");
    setError("");
    setResult(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const journalResponse = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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
              <p className="mt-1 text-sm text-slate-500">{result.confidence}% confidence</p>
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
              <CardTitle className="text-sm text-slate-500">Risk</CardTitle>
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

        {result.crisisDetected ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
            <p className="font-medium">You do not have to go through this alone.</p>
            <p className="mt-2">
              If you are in crisis, call <strong>14416</strong>. You can
              also text HOME to <strong>741741</strong> to reach the Crisis Text Line.
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
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{wordCount} words</span>
          <span>{content.length}/3000</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="size-3.5" />
          Only you can see this entry. It is never used as a medical diagnosis.
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
