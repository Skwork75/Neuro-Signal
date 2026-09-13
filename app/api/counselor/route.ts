import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJournalContent } from "@/lib/analyze";
import { createClient } from "@/lib/supabase/server";
import type { CounselorResult } from "@/lib/types";

const requestSchema = z.object({
  reason: z.string().trim().min(3).max(500),
  feelings: z.string().trim().min(3).max(500),
  impact: z.string().trim().max(500).optional().default(""),
  support: z.string().trim().max(500).optional().default(""),
  extra: z.string().trim().max(2_000).optional().default(""),
  entryIds: z.array(z.string().uuid()).max(10).default([]),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Please answer the first two questions and try again." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

    const { data: entries, error } = body.data.entryIds.length
      ? await supabase.from("journal_entries").select("id, content").eq("user_id", user.id).in("id", body.data.entryIds)
      : { data: [], error: null };
    if (error) return NextResponse.json({ error: "Could not read your selected entries." }, { status: 500 });

    const context = [
      `Reason for seeking support: ${body.data.reason}`,
      `Current feelings: ${body.data.feelings}`,
      body.data.impact ? `Impact on daily life: ${body.data.impact}` : "",
      body.data.support ? `Support wanted: ${body.data.support}` : "",
      body.data.extra ? `Additional context: ${body.data.extra}` : "",
      ...(entries ?? []).map((entry) => `Journal entry: ${entry.content}`),
    ].filter(Boolean).join("\n\n");

    const analysis = await analyzeJournalContent(context);
    const focus = analysis.themes[0] ?? analysis.dominantEmotion;
    const nextSteps = [
      ...analysis.recommendations.slice(0, 2),
      body.data.support
        ? `For the support you named, choose one person or resource and make one small request today.`
        : "Name one person, place, or routine that could make the next hour feel more supported.",
    ];
    const result: CounselorResult = {
      focus,
      understanding: `Your answers and selected writing point most strongly toward ${focus.toLowerCase()}. This is a reflection signal, not a diagnosis.`,
      nextSteps: [...new Set(nextSteps)],
      reflectionQuestion: analysis.reflectionQuestion,
      sourceCount: entries?.length ?? 0,
      analysis,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not prepare your counselor reflection. Please try again." }, { status: 500 });
  }
}