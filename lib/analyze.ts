import "server-only";

import { classifyEmotions } from "@/lib/emotions";
import { recommendationsFor, reflectionFor, experimentFor } from "@/lib/recommendations";
import { assessSafety } from "@/lib/safety";
import { calculateStress } from "@/lib/stress";
import { detectThemes } from "@/lib/themes";
import type { AnalysisResult } from "@/lib/types";

function formatEmotionSummary(primaryEmotion: string, mixedEmotion: boolean): string {
  const emotionLabel = primaryEmotion.toLowerCase();
  if (mixedEmotion) {
    return `Your entry reads as a mixed signal with ${emotionLabel} as the strongest current tone.`;
  }
  return `Your words most closely reflect ${emotionLabel} in this entry.`;
}

function formatStressInsight(stressLevel: string, crisisDetected: boolean): string {
  if (crisisDetected) {
    return `The entry shows a ${stressLevel.toLowerCase()} stress signal, and the wording may warrant immediate support.`;
  }
  return `The entry shows a ${stressLevel.toLowerCase()} stress signal that is separate from the dominant emotion.`;
}

export async function analyzeJournalContent(content: string): Promise<AnalysisResult> {
  const emotion = await classifyEmotions(content);
  const stress = calculateStress(emotion.emotionScores);
  const safety = assessSafety(emotion.emotionScores, content);
  const themes = detectThemes(content);
  const summary = formatEmotionSummary(emotion.primaryEmotion, emotion.mixedEmotion);
  const insights = [
    formatStressInsight(stress.stressLevel, safety.crisisDetected),
    safety.crisisDetected ? "Your entry includes language that may signal an immediate need for support." : "This is a reflective wellbeing signal, not a diagnosis or clinical assessment.",
  ];

  return {
    dominantEmotion: emotion.primaryEmotion,
    emotionScores: emotion.emotionScores,
    stressLevel: stress.stressLevel,
    stressScore: stress.stressScore,
    riskLevel: safety.riskLevel,
    riskScore: safety.riskScore,
    confidence: emotion.signalStrength,
    summary,
    insights,
    recommendations: recommendationsFor(emotion.primaryEmotion, safety.crisisDetected),
    themes,
    reflectionQuestion: reflectionFor(emotion.primaryEmotion, themes),
    experiment: experimentFor(emotion.primaryEmotion, themes),
    crisisDetected: safety.crisisDetected,
    safetyState: safety.state,
    safetyReasons: safety.reasons,
    userFeedback: {
      prompt: "Was this reflection useful?",
    },
    primaryEmotion: emotion.primaryEmotion,
    secondaryEmotions: emotion.secondaryEmotions,
    mixedEmotion: emotion.mixedEmotion,
    intensity: emotion.intensity,
    signalStrength: emotion.signalStrength,
    stressEvidence: stress.stressEvidence,
    stressMethod: stress.stressMethod,
  };
}
