import { InferenceClient } from "@huggingface/inference";
import type {
  AnalysisResult,
  EmotionScores,
  EmotionType,
  RiskLevel,
  StressLevel,
} from "@/lib/types";

const CRISIS_PATTERNS =
  /\b(suicid|kill myself|end my life|want to die|self[- ]harm|hurt myself|no reason to live)\b/i;

const LABEL_MAP: Record<string, EmotionType> = {
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

function emptyScores(): EmotionScores {
  return { Happy: 0, Sad: 0, Angry: 0, Fear: 0, Neutral: 0 };
}

function detectCrisis(content: string, scores: EmotionScores) {
  return (
    CRISIS_PATTERNS.test(content) ||
    scores.Sad + scores.Fear >= 0.85
  );
}

function stressFromScores(scores: EmotionScores): { level: StressLevel; score: number } {
  const score = Math.round(
    (scores.Angry * 0.4 + scores.Fear * 0.35 + scores.Sad * 0.25) * 100,
  );
  if (score >= 65) return { level: "High", score };
  if (score >= 35) return { level: "Medium", score };
  return { level: "Low", score };
}

function riskFromScores(
  scores: EmotionScores,
  crisisDetected: boolean,
): { level: RiskLevel; score: number } {
  const score = Math.min(
    100,
    Math.round((scores.Sad * 0.45 + scores.Fear * 0.45 + scores.Angry * 0.1) * 100) +
      (crisisDetected ? 25 : 0),
  );
  if (crisisDetected || score >= 70) return { level: "High", score };
  if (score >= 40) return { level: "Moderate", score };
  return { level: "Low", score };
}

function heuristicScores(content: string): EmotionScores {
  const text = content.toLowerCase();
  const scores = emptyScores();
  const buckets: Array<[EmotionType, string[]]> = [
    ["Happy", ["happy", "grateful", "excited", "proud", "joy", "love", "hope"]],
    ["Sad", ["sad", "lonely", "empty", "cry", "depressed", "hopeless", "down"]],
    ["Angry", ["angry", "furious", "hate", "frustrated", "irritated", "rage"]],
    ["Fear", ["afraid", "anxious", "worry", "panic", "scared", "nervous"]],
  ];

  for (const [emotion, words] of buckets) {
    scores[emotion] = words.reduce(
      (sum, word) => sum + (text.includes(word) ? 1 : 0),
      0,
    );
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    scores.Neutral = 1;
    return scores;
  }

  (Object.keys(scores) as EmotionType[]).forEach((key) => {
    scores[key] = Number((scores[key] / total).toFixed(3));
  });
  return scores;
}

async function modelScores(content: string): Promise<EmotionScores | null> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) return null;

  try {
    const client = new InferenceClient(token);
    const results = await client.textClassification({
      model: "j-hartmann/emotion-english-distilroberta-base",
      inputs: content.slice(0, 1000),
    });

    const scores = emptyScores();
    for (const item of results) {
      const emotion = LABEL_MAP[item.label.toLowerCase()];
      if (emotion) {
        scores[emotion] += item.score;
      } else {
        scores.Neutral += item.score;
      }
    }

    const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;
    (Object.keys(scores) as EmotionType[]).forEach((key) => {
      scores[key] = Number((scores[key] / total).toFixed(3));
    });
    return scores;
  } catch {
    return null;
  }
}

export async function analyzeJournalContent(content: string): Promise<AnalysisResult> {
  const emotionScores = (await modelScores(content)) ?? heuristicScores(content);
  const dominantEmotion = (
    Object.entries(emotionScores) as [EmotionType, number][]
  ).sort((a, b) => b[1] - a[1])[0][0];
  const confidence = Math.round(emotionScores[dominantEmotion] * 100);
  const crisisDetected = detectCrisis(content, emotionScores);
  const stress = stressFromScores(emotionScores);
  const risk = riskFromScores(emotionScores, crisisDetected);

  const recommendations = crisisDetected
    ? [
        "Reach out to someone you trust right now.",
        "If you are in crisis, call or text 988 in the US.",
        "You can also text HOME to 741741 for the Crisis Text Line.",
      ]
    : [
        "Write another short entry tomorrow to notice patterns.",
        "Take a 5-minute pause and name three things you can see or hear.",
        "If this feeling lasts, consider talking with a licensed professional.",
      ];

  return {
    dominantEmotion,
    emotionScores,
    stressLevel: stress.level,
    stressScore: stress.score,
    riskLevel: risk.level,
    riskScore: risk.score,
    confidence,
    summary: `This entry most strongly reflects ${dominantEmotion.toLowerCase()} with ${confidence}% confidence.`,
    insights: [
      `Stress appears ${stress.level.toLowerCase()} based on the language in this entry.`,
      `Emotional risk is currently ${risk.level.toLowerCase()}.`,
    ],
    recommendations,
    crisisDetected,
  };
}
