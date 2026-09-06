import { NextResponse } from "next/server";
import { analyzeJournalContent } from "@/lib/analyze";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to analyze an entry." }, { status: 401 });
  }

  const body = (await request.json()) as { journalId?: string };
  if (!body.journalId) {
    return NextResponse.json({ error: "Missing journalId." }, { status: 400 });
  }

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .select("id, content, user_id")
    .eq("id", body.journalId)
    .eq("user_id", user.id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
  }

  const analysis = await analyzeJournalContent(entry.content);

  const { error: saveError } = await supabase.from("analysis_results").insert({
    journal_id: entry.id,
    user_id: user.id,
    dominant_emotion: analysis.dominantEmotion,
    emotion_scores: analysis.emotionScores,
    stress_level: analysis.stressLevel,
    stress_score: analysis.stressScore,
    risk_level: analysis.riskLevel,
    risk_score: analysis.riskScore,
    confidence: analysis.confidence,
    summary: analysis.summary,
    insights: analysis.insights,
    recommendations: analysis.recommendations,
    crisis_detected: analysis.crisisDetected,
  });

  if (saveError) {
    return NextResponse.json(
      { ...analysis, warning: "Analysis completed but could not be saved." },
      { status: 200 },
    );
  }

  return NextResponse.json(analysis);
}
