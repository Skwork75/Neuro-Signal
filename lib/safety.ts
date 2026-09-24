import type { EmotionScores, RiskLevel, SafetyAnalysis, SafetyState } from "@/lib/types";

const URGENT_PATTERNS = [
  /\b(?:kill|hurt)\s+myself\b/i,
  /\b(?:end|take)\s+my\s+life\b/i,
  /\b(?:want|plan|going)\s+to\s+die\b/i,
  /\b(?:suicid(?:e|al)|self[-\s]?harm)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\b(?:not\s+want\s+to\s+be\s+here|can't\s+go\s+on)\b/i,
];

const CONCERN_PATTERNS = [
  /\b(?:hopeless|worthless|overwhelmed|panic|alone|isolat(?:ed|e))\b/i,
  /\b(?:can't\s+cope|too\s+much|breaking\s+down|falling\s+apart)\b/i,
];

function deriveState(riskScore: number): SafetyState {
  if (riskScore >= 75) return "urgent";
  if (riskScore >= 45) return "concern";
  return "normal";
}

export function assessSafety(scores: EmotionScores, content: string): SafetyAnalysis {
  const normalized = content.toLowerCase();
  const urgentDetected = URGENT_PATTERNS.some((pattern) => pattern.test(normalized));
  if (urgentDetected) {
    return {
      riskLevel: "High",
      riskScore: 100,
      crisisDetected: true,
      state: "urgent",
      reasons: ["High-risk wording suggests immediate support may be needed."],
    };
  }

  const concernDetected = CONCERN_PATTERNS.some((pattern) => pattern.test(normalized));
  const riskScore = Math.round((scores.Sad * 0.55 + scores.Fear * 0.3 + scores.Angry * 0.15) * 100);
  const riskLevel: RiskLevel = riskScore >= 65 ? "Moderate" : "Low";
  const state = deriveState(riskScore + (concernDetected ? 15 : 0));

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore + (concernDetected ? 15 : 0)),
    crisisDetected: false,
    state,
    reasons: concernDetected
      ? ["The wording suggests possible emotional overload and a need for extra support."]
      : ["The wording is within a general reflective range without urgent indicators."],
  };
}