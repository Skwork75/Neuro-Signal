import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to save an entry." }, { status: 401 });
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? "";

  if (content.length < 10) {
    return NextResponse.json(
      { error: "Please write a little more so we can analyze your entry." },
      { status: 400 },
    );
  }

  if (content.length > 3000) {
    return NextResponse.json(
      { error: "Entries can be at most 3000 characters." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, content })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save your journal entry." },
      { status: 500 },
    );
  }

  return NextResponse.json({ journalId: data.id });
}
