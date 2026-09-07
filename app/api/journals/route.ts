import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to save an entry." }, { status: 401 });
    }

    const body = (await request.json()) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (content.length < 10) {
      return NextResponse.json({ error: "Please write at least 10 characters." }, { status: 400 });
    }

    const wordCount = content.split(/\s+/).length;
    const { data: journal, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, content, word_count: wordCount })
      .select("*")
      .single();
    if (error || !journal) {
      return NextResponse.json({ error: error?.message ?? "Could not save your journal entry." }, { status: 500 });
    }

    return NextResponse.json({ journal, journalId: journal.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save your journal entry." }, { status: 500 });
  }
}
