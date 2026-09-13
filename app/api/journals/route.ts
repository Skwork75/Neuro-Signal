import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  content: z.string().trim().min(10).max(3_000),
  checkIn: z.object({
    energy: z.number().int().min(1).max(5).optional(),
    event: z.string().trim().max(160).optional(),
    need: z.string().trim().max(160).optional(),
    action: z.string().trim().max(160).optional(),
    helped: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to save an entry." }, { status: 401 });
    }

    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Entries must be between 10 and 3,000 characters." }, { status: 400 });
    }
    const content = body.data.content;

    const wordCount = content.split(/\s+/).length;
    const { data: journal, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, content, word_count: wordCount, check_in: body.data.checkIn ?? {} })
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
