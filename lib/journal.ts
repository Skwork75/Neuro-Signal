import type {
  AnalysisResult,
  EmotionType,
  JournalEntry,
  CheckIn,
  RiskLevel,
  StressLevel,
} from "@/lib/types";

export const EMOTION_EMOJI: Record<EmotionType, string> = {
  Happy: "😊",
  Sad: "😢",
  Angry: "😠",
  Fear: "😰",
  Neutral: "😐",
};

export function isEmotionType(value: string): value is EmotionType {
  return ["Happy", "Sad", "Angry", "Fear", "Neutral"].includes(value);
}

export function levelBadgeClass(level: string) {
  const normalized = level.toLowerCase();
  if (normalized === "low") {
    return "bg-green-100 text-green-800";
  }
  if (normalized === "medium" || normalized === "moderate") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-red-100 text-red-800";
}

export function barColorClass(level: string) {
  const normalized = level.toLowerCase();
  if (normalized === "low") return "bg-green-500";
  if (normalized === "medium" || normalized === "moderate") return "bg-amber-500";
  return "bg-red-500";
}

export function formatEntryDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type AnalysisRow = {
  dominant_emotion?: string | null;
  emotion_scores?: AnalysisResult["emotionScores"] | null;
  stress_level?: string | null;
  stress_score?: number | null;
  risk_level?: string | null;
  risk_score?: number | null;
  confidence?: number | null;
  summary?: string | null;
  insights?: string[] | null;
  recommendations?: string[] | null;
  themes?: string[] | null;
  reflection_question?: string | null;
  experiment?: string | null;
  crisis_detected?: boolean | null;
};

export type JournalRow = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  check_in?: CheckIn | null;
  analysis_results?: AnalysisRow | AnalysisRow[] | null;
};

function scoreFromLevel(level: string, kind: "stress" | "risk") {
  const normalized = level.toLowerCase();
  if (normalized === "low") return 25;
  if (normalized === "medium" || normalized === "moderate") return 60;
  if (normalized === "high") return 90;
  return kind === "stress" ? 40 : 30;
}

export function mapAnalysis(row: AnalysisRow | null | undefined): AnalysisResult | null {
  if (!row?.dominant_emotion || !isEmotionType(row.dominant_emotion)) {
    return null;
  }

  const stressLevel = (row.stress_level ?? "Low") as StressLevel;
  const riskLevel = (row.risk_level ?? "Low") as RiskLevel;

  return {
    dominantEmotion: row.dominant_emotion,
    emotionScores: row.emotion_scores ?? {
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Fear: 0,
      Neutral: 0,
      [row.dominant_emotion]: 1,
    },
    stressLevel,
    stressScore: row.stress_score ?? scoreFromLevel(stressLevel, "stress"),
    riskLevel,
    riskScore: row.risk_score ?? scoreFromLevel(riskLevel, "risk"),
    confidence: row.confidence ?? 0,
    summary: row.summary ?? "",
    insights: row.insights ?? [],
    recommendations: row.recommendations ?? [],
    themes: row.themes ?? [],
    reflectionQuestion: row.reflection_question ?? "What feels most important to carry forward from this entry?",
    experiment: row.experiment ?? "",
    crisisDetected: Boolean(row.crisis_detected),
  };
}

export function mapJournal(row: JournalRow): JournalEntry {
  const analysisRow = Array.isArray(row.analysis_results)
    ? row.analysis_results[0]
    : row.analysis_results;

  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    checkIn: row.check_in ?? null,
    analysis: mapAnalysis(analysisRow),
  };
}
