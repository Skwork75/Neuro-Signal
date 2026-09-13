import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ question: z.string().trim().min(3).max(300) });
const STOP_WORDS = new Set(["what", "when", "where", "which", "that", "with", "from", "have", "does", "about", "this", "were", "your", "feel", "felt", "help", "helped", "the", "and", "for", "how", "did", "last"]);

function words(value: string) {
  return [...new Set(value.toLowerCase().match(/[a-z]{3,}/g)?.filter((word) => !STOP_WORDS.has(word)) ?? [])];
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
    const queryWords = words(body.data.question);
    const matches = (data ?? []).map((entry) => {
      const text = entry.content.toLowerCase();
      const score = queryWords.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
      return { ...entry, score };
    }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
    return NextResponse.json({
      matches: matches.map(({ id, content, created_at }) => ({ id, excerpt: content.slice(0, 280), createdAt: created_at })),
      searchedEntries: data?.length ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Could not search your journal." }, { status: 500 });
  }
}
