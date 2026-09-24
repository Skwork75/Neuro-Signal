import type { EmotionScores, StressAnalysis, StressLevel } from "@/lib/types";

export function calculateStress(scores: EmotionScores): StressAnalysis {
  const stressScore = Math.round((scores.Angry * 0.35 + scores.Fear * 0.4 + scores.Sad * 0.25) * 100);
  const stressLevel: StressLevel = stressScore >= 65 ? "High" : stressScore >= 35 ? "Medium" : "Low";
  return {
    stressLevel,
    stressScore,
    stressEvidence: ["This prototype signal is based on the balance of fear, anger, and sadness language."],
    stressMethod: "Heuristic emotion-score weighting; not clinically validated.",
  };
}