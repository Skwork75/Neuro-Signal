export type EmotionType = "Happy" | "Sad" | "Angry" | "Fear" | "Neutral";

export type StressLevel = "Low" | "Medium" | "High";

export type RiskLevel = "Low" | "Moderate" | "High";
export type SafetyState = "normal" | "concern" | "urgent";
export type FeedbackValue = "helpful" | "not_helpful";

export type EmotionScores = {
  Happy: number;
  Sad: number;
  Angry: number;
  Fear: number;
  Neutral: number;
};

export interface EmotionAnalysis {
  primaryEmotion: EmotionType;
  secondaryEmotions: EmotionType[];
  emotionScores: EmotionScores;
  mixedEmotion: boolean;
  intensity: number;
  signalStrength: number;
}

export interface StressAnalysis {
  stressLevel: StressLevel;
  stressScore: number;
  stressEvidence: string[];
  stressMethod: string;
}

export interface SafetyAnalysis {
  riskLevel: RiskLevel;
  riskScore: number;
  crisisDetected: boolean;
  state: SafetyState;
  reasons: string[];
}

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
  safetyState?: SafetyState;
  safetyReasons?: string[];
  checkInContext?: {
    mood?: string;
    energy?: number;
    note?: string;
  };
  userFeedback?: {
    prompt: string;
    value?: FeedbackValue;
  } | null;
  primaryEmotion?: EmotionType;
  secondaryEmotions?: EmotionType[];
  mixedEmotion?: boolean;
  intensity?: number;
  signalStrength?: number;
  stressEvidence?: string[];
  stressMethod?: string;
}

export type CounselorMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface CounselorResult {
  focus: string;
  understanding: string;
  nextSteps: string[];
  reflectionQuestion: string;
  sourceCount: number;
  analysis: AnalysisResult;
  conversation?: CounselorMessage[];
  turn?: number;
  isComplete?: boolean;
  finalTakeaway?: string;
  feedback?: {
    prompt: string;
    value?: FeedbackValue;
  };
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
