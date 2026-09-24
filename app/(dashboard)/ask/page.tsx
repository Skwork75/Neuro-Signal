"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatEntryDate } from "@/lib/journal";

type Match = { id: string; excerpt: string; createdAt: string };

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchedEntries, setSearchedEntries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || question.trim().length < 3) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/journal-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await response.json() as { matches?: Match[]; searchedEntries?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Search failed.");
      setMatches(data.matches ?? []); setSearchedEntries(data.searchedEntries ?? 0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Search failed."); }
    finally { setLoading(false); }
  }
  return <div className="mx-auto max-w-4xl space-y-7">
    <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Private retrieval</p><h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-emerald-50">Ask your journal</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-emerald-100/65">Find relevant moments in your own writing. Results always point back to your words.</p></div>
    <Card><CardContent className="pt-6"><form onSubmit={submit} className="flex gap-2"><Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What helped when I felt anxious about work?" maxLength={300} /><Button type="submit" disabled={loading || question.trim().length < 3}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Search</Button></form><p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="size-3.5" />Searches only your entries in this account.</p></CardContent></Card>
    {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    {searchedEntries ? <section className="space-y-3"><p className="text-sm text-slate-500">Searched {searchedEntries} entries. {matches.length ? "These moments were the closest matches:" : "No close matches yet. Try different words or keep writing."}</p>{matches.map((match) => <Card key={match.id}><CardHeader><CardTitle className="text-sm text-slate-500">{formatEntryDate(match.createdAt)}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">{match.excerpt}{match.excerpt.length === 280 ? "…" : ""}</p></CardContent></Card>)}</section> : null}
  </div>;
}
