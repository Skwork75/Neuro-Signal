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

export type CheckIn = {
  energy?: number;
  event?: string;
  need?: string;
  action?: string;
  helped?: boolean;
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
  themes: string[];
  reflectionQuestion: string;
  experiment: string;
  crisisDetected: boolean;
}

export interface CounselorResult {
  focus: string;
  understanding: string;
  nextSteps: string[];
  reflectionQuestion: string;
  sourceCount: number;
  analysis: AnalysisResult;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  checkIn: CheckIn | null;
  analysis: AnalysisResult | null;
}
