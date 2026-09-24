import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ question: z.string().trim().min(3).max(300) });
const STOP_WORDS = new Set(["what", "when", "where", "which", "that", "with", "from", "have", "does", "about", "this", "were", "your", "feel", "felt", "help", "helped", "the", "and", "for", "how", "did", "last", "into", "just", "than", "them", "then", "their", "there", "these", "those", "been", "will", "would", "could", "should", "want", "more", "some", "over", "under", "after", "before", "without", "through"]);

const CONCEPT_MAP: Record<string, string[]> = {
  work: ["work", "job", "career", "project", "deadline", "meeting", "boss", "office", "focus"],
  sleep: ["sleep", "tired", "rest", "exhausted", "night", "morning", "awake", "energy"],
  relationships: ["friend", "family", "partner", "relationship", "mom", "dad", "sister", "brother", "support", "connection", "alone"],
  stress: ["stress", "pressure", "overwhelmed", "tense", "anxious", "worry", "panic", "burnout"],
  mood: ["happy", "sad", "angry", "fear", "hopeful", "lonely", "frustrated", "grateful", "guilt", "shame"],
  health: ["health", "body", "pain", "exercise", "walk", "food", "illness", "headache"],
};

function normalizeWords(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z]{3,}/g)?.filter((word) => !STOP_WORDS.has(word)) ?? [])];
}

function expandTerms(terms: string[]) {
  const expanded = new Set<string>();
  for (const term of terms) {
    expanded.add(term);
    for (const [concept, synonyms] of Object.entries(CONCEPT_MAP)) {
      if (term === concept || synonyms.includes(term)) {
        for (const synonym of synonyms) expanded.add(synonym);
      }
    }
  }
  return [...expanded];
}

function buildReason(entryText: string, matchedTerms: string[]) {
  const uniqueMatches = [...new Set(matchedTerms)].slice(0, 3);
  if (!uniqueMatches.length) return "matched your question context";
  return `matched ${uniqueMatches.map((term) => `'${term}'`).join(", ")}`;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Ask a question between 3 and 300 characters." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    const { data, error } = await supabase.from("journal_entries").select("id, content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: "Could not search your journal." }, { status: 500 });

    const rawTerms = normalizeWords(body.data.question);
    const expandedTerms = expandTerms(rawTerms);

    const matches = (data ?? [])
      .map((entry) => {
        const text = entry.content.toLowerCase();
        const matchedTerms = expandedTerms.filter((term) => term.length > 2 && text.includes(term));
        const score = matchedTerms.length + rawTerms.filter((term) => text.includes(term)).length;
        return { ...entry, score, matchedTerms };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at))
      .slice(0, 5);

    return NextResponse.json({
      matches: matches.map(({ id, content, created_at, matchedTerms }) => ({
        id,
        excerpt: content.slice(0, 280),
        createdAt: created_at,
        reason: buildReason(content, matchedTerms),
      })),
      searchedEntries: data?.length ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Could not search your journal." }, { status: 500 });
  }
}
