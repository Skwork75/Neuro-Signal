import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJournalContent } from "@/lib/analyze";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({ journalId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "A valid journal entry is required." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to analyze an entry." }, { status: 401 });
    const { data: journal, error: journalError } = await supabase
      .from("journal_entries").select("id, content").eq("id", body.data.journalId).eq("user_id", user.id).single();
    if (journalError || !journal) return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });

    const analysis = await analyzeJournalContent(journal.content);
    const { error: saveError } = await supabase.from("analysis_results").upsert({
      journal_id: journal.id, user_id: user.id,
      dominant_emotion: analysis.dominantEmotion, emotion_scores: analysis.emotionScores,
      stress_level: analysis.stressLevel, stress_score: analysis.stressScore,
      risk_level: analysis.riskLevel, risk_score: analysis.riskScore, confidence: analysis.confidence,
      summary: analysis.summary, insights: analysis.insights, recommendations: analysis.recommendations,
      themes: analysis.themes, reflection_question: analysis.reflectionQuestion, experiment: analysis.experiment,
      crisis_detected: analysis.crisisDetected,
    }, { onConflict: "journal_id" });
    if (saveError) return NextResponse.json({ error: "Could not save the analysis." }, { status: 500 });
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: "Could not analyze your entry. Please try again." }, { status: 500 });
  }
}
