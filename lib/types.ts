export type EmotionType = "Happy" | "Sad" | "Angry" | "Fear" | "Neutral";

export type StressLevel = "Low" | "Medium" | "High";

export type RiskLevel = "Low" | "Moderate" | "High";

export type EmotionScores = {
  Happy: number;
  Sad: number;
  Angry: number;
  Fear: number;
  Neutral: number;
};

export interface AnalysisResult {
  dominantEmotion: EmotionType;
  emotionScores: EmotionScores;
  stressLevel: StressLevel;
  stressScore: number;
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  crisisDetected: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  analysis: AnalysisResult | null;
}
