import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { createClient } from "@/lib/supabase/server";

type Emotion = "Happy" | "Sad" | "Angry" | "Fear" | "Neutral";
type StressLevel = "Low" | "Medium" | "High";
type RiskLevel = "Low" | "Moderate" | "High";
type EmotionScores = Record<Emotion, number>;
type Classification = { label?: string; score?: number };

const emotionLabels: Record<string, Emotion> = {
  joy: "Happy",
  happiness: "Happy",
  happy: "Happy",
  sadness: "Sad",
  sad: "Sad",
  anger: "Angry",
  angry: "Angry",
  fear: "Fear",
  scared: "Fear",
  neutral: "Neutral",
  surprise: "Neutral",
  disgust: "Angry",
};
const highStressWords = ["overwhelmed", "panic", "burnout", "stressed", "anxious", "exhausted", "hopeless", "cant cope", "terrible", "horrible"];
const mediumStressWords = ["worried", "nervous", "tense", "tired", "difficult", "frustrated", "upset", "pressure"];
const lowStressWords = ["calm", "good", "happy", "relaxed", "fine", "peaceful", "okay", "content"];
const crisisWords = ["suicide", "kill myself", "want to die", "end my life", "hurt myself"];
const highRiskWords = ["hopeless", "worthless", "empty inside", "numb", "meaningless", "giving up", "no point"];
const mediumRiskWords = ["lonely", "isolated", "sad", "depressed", "no energy", "cant sleep", "crying"];

function countMatches(text: string, words: string[]) {
  return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
}

function classifyStress(text: string) {
  const high = countMatches(text, highStressWords);
  const medium = countMatches(text, mediumStressWords);
  const low = countMatches(text, lowStressWords);
  const total = high + medium + low;
  const score = total === 0 ? 0 : (high * 0.8 + medium * 0.5 + low * 0.1) / total;
  const level: StressLevel = score >= 0.6 ? "High" : score >= 0.3 ? "Medium" : "Low";
  return { level, score: Number(score.toFixed(3)) };
}

function classifyRisk(text: string, sadScore: number) {
  if (countMatches(text, crisisWords) > 0) return { level: "High" as RiskLevel, score: 0.9, crisisDetected: true };
  const high = countMatches(text, highRiskWords);
  const medium = countMatches(text, mediumRiskWords);
  const total = high + medium;
  const keywordScore = total === 0 ? 0 : (high * 0.8 + medium * 0.5) / total;
  const score = Math.min(1, keywordScore + sadScore * 0.3);
  const level: RiskLevel = score >= 0.6 ? "High" : score >= 0.3 ? "Moderate" : "Low";
  return { level, score: Number(score.toFixed(3)), crisisDetected: false };
}

function suggestionsFor(emotion: Emotion, risk: RiskLevel, crisisDetected: boolean) {
  if (crisisDetected) return ["Call 14416 for immediate crisis support.", "Text HOME to 741741 to reach the Crisis Text Line.", "Move near someone you trust and tell them how you are feeling.", "If you may act on these thoughts, call emergency services now."];
  const suggestions: Record<Emotion, string[]> = {
    Happy: ["Notice what contributed to this positive feeling.", "Share this moment with someone you care about.", "Write down one thing you want to remember about today.", "Use this energy for a meaningful activity."],
    Sad: ["Reach out to someone you trust.", "Spend a few minutes outside or in nature.", "Write down three small things you appreciate.", "Give yourself permission to rest and feel this emotion."],
    Angry: ["Take a brisk walk or do another form of exercise.", "Try slow breathing before responding to anyone.", "Name the need beneath the anger.", "Give yourself space before making a decision."],
    Fear: ["Try a grounding exercise using your five senses.", "Separate what you know from what you are predicting.", "Challenge one fearful thought with a balanced alternative.", "Talk through the concern with someone you trust."],
    Neutral: ["Check in with your body and name what it needs.", "Take a short, mindful break.", "Write one honest sentence about your current mood.", "Choose one small task that would support your wellbeing."],
  };
  const result = [...suggestions[emotion]];
  if (risk === "High" || risk === "Moderate") result[3] = "Consider speaking with a licensed mental health professional.";
  return result;
}

async function analyzeEmotion(text: string) {
  const scores: EmotionScores = { Happy: 0, Sad: 0, Angry: 0, Fear: 0, Neutral: 0 };
  let recognizedModelLabel = false;
  try {
    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const result = await hf.textClassification({ model: "j-hartmann/emotion-english-distilroberta-base", inputs: text });
    const classifications = (Array.isArray(result) ? result : []) as Classification[];
    for (const item of classifications) {
      const label = item.label?.toLowerCase() ?? "";
      const emotion = emotionLabels[label];
      if (emotion) {
        recognizedModelLabel = true;
        scores[emotion] += item.score ?? 0;
      }
    }
  } catch {
    recognizedModelLabel = false;
  }

  if (!recognizedModelLabel) {
    const normalizedText = text.toLowerCase();
    const keywords: Record<Exclude<Emotion, "Neutral">, string[]> = {
      Happy: ["happy", "grateful", "excited", "proud", "joy", "love", "hope"],
      Sad: ["sad", "lonely", "empty", "cry", "depressed", "hopeless", "down"],
      Angry: ["angry", "furious", "hate", "frustrated", "irritated", "rage"],
      Fear: ["afraid", "anxious", "worry", "panic", "scared", "nervous"],
    };

    for (const [emotion, words] of Object.entries(keywords) as [Exclude<Emotion, "Neutral">, string[]][]) {
      scores[emotion] = words.reduce(
        (count, word) => count + (normalizedText.includes(word) ? 1 : 0),
        0,
      );
    }

    if (Object.values(scores).every((score) => score === 0)) scores.Neutral = 1;
  }

  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
  (Object.keys(scores) as Emotion[]).forEach((emotion) => {
    scores[emotion] = Number((scores[emotion] / total).toFixed(3));
  });

  const top = (Object.entries(scores) as [Emotion, number][]).sort((a, b) => b[1] - a[1])[0];
  return { emotion: top[0], confidence: Math.round(top[1] * 100), scores };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in to analyze an entry." }, { status: 401 });

    const body = (await request.json()) as { text?: unknown; journalId?: unknown };
    const journalId = typeof body.journalId === "string" ? body.journalId : "";
    let text = typeof body.text === "string" ? body.text.trim() : "";
    if (!journalId) return NextResponse.json({ error: "Missing journalId." }, { status: 400 });

    const { data: journal, error: journalError } = await supabase
      .from("journal_entries")
      .select("id, content")
      .eq("id", journalId)
      .eq("user_id", user.id)
      .single();
    if (journalError || !journal) return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    text ||= journal.content;
    if (text.length < 10 || text.length > 3000) return NextResponse.json({ error: "Text must be between 10 and 3000 characters." }, { status: 400 });

    const emotion = await analyzeEmotion(text);
    const stress = classifyStress(text.toLowerCase());
    const risk = classifyRisk(text.toLowerCase(), emotion.scores.Sad);
    const analysis = {
      dominantEmotion: emotion.emotion,
      emotionScores: emotion.scores,
      stressLevel: stress.level,
      stressScore: stress.score,
      riskLevel: risk.level,
      riskScore: risk.score,
      confidence: emotion.confidence,
      summary: `This entry most strongly reflects ${emotion.emotion.toLowerCase()}.`,
      insights: [`Stress appears ${stress.level.toLowerCase()} based on the language in this entry.`, `Emotional risk is currently ${risk.level.toLowerCase()}.`],
      recommendations: suggestionsFor(emotion.emotion, risk.level, risk.crisisDetected),
      crisisDetected: risk.crisisDetected,
    };
    const { data: savedData, error: saveError } = await supabase
      .from("analysis_results")
      .insert({ journal_id: journalId, user_id: user.id, dominant_emotion: analysis.dominantEmotion, emotion_scores: analysis.emotionScores, stress_level: analysis.stressLevel, stress_score: analysis.stressScore, risk_level: analysis.riskLevel, risk_score: analysis.riskScore, summary: analysis.summary, insights: analysis.insights, recommendations: analysis.recommendations, crisis_detected: analysis.crisisDetected })
      .select("*")
      .single();
    if (saveError || !savedData) return NextResponse.json({ error: saveError?.message ?? "Could not save the analysis." }, { status: 500 });
    return NextResponse.json({ success: true, analysis: savedData, ...analysis });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not analyze the journal entry." }, { status: 500 });
  }
}
