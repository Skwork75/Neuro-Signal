import "server-only";

import { InferenceClient } from "@huggingface/inference";
import type { EmotionAnalysis, EmotionScores, EmotionType } from "@/lib/types";

const MAX_MODEL_CHARS = 2_000;
const DEFAULT_MODEL = "j-hartmann/emotion-english-distilroberta-base";
const LABEL_MAP: Record<string, EmotionType> = {
  joy: "Happy", happiness: "Happy", love: "Happy", optimism: "Happy",
  sadness: "Sad", grief: "Sad", remorse: "Sad", disappointment: "Sad",
  anger: "Angry", annoyance: "Angry", disgust: "Angry",
  fear: "Fear", nervousness: "Fear", anxiety: "Fear",
  neutral: "Neutral", surprise: "Neutral", realization: "Neutral",
};
const PHRASES: Record<Exclude<EmotionType, "Neutral">, string[]> = {
  Happy: ["grateful", "relieved", "excited", "proud", "happy", "joy", "love", "hopeful", "peaceful", "calm"],
  Sad: ["sad", "lonely", "empty", "crying", "depressed", "hopeless", "down", "grief", "heartbroken", "miss"],
  Angry: ["angry", "furious", "hate", "frustrated", "irritated", "rage", "annoyed", "unfair"],
  Fear: ["afraid", "anxious", "worry", "panic", "scared", "nervous", "overwhelmed", "stressed", "tense"],
};

function emptyScores(): EmotionScores {
  return { Happy: 0, Sad: 0, Angry: 0, Fear: 0, Neutral: 0 };
}

function normalize(scores: EmotionScores): EmotionScores {
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  if (!total) return { ...emptyScores(), Neutral: 1 };
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number((value / total).toFixed(3))])) as EmotionScores;
}

function heuristicScores(content: string): EmotionScores {
  const text = content.toLowerCase();
  const scores = emptyScores();
  for (const [emotion, phrases] of Object.entries(PHRASES) as [Exclude<EmotionType, "Neutral">, string[]][]) {
    for (const phrase of phrases) {
      const matches = text.match(new RegExp(`\\b${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "g"));
      scores[emotion] += matches?.length ?? 0;
    }
  }
  return normalize(scores);
}

async function modelScores(content: string): Promise<EmotionScores | null> {
  const token = process.env.HUGGINGFACE_API_KEY;
  if (!token) return null;
  try {
    const client = new InferenceClient(token);
    const result = await client.textClassification({ model: process.env.HUGGINGFACE_EMOTION_MODEL || DEFAULT_MODEL, inputs: content.slice(0, MAX_MODEL_CHARS) });
    const scores = emptyScores();
    for (const item of result) {
      const emotion = LABEL_MAP[item.label.toLowerCase()];
      if (emotion) scores[emotion] += item.score;
    }
    return Object.values(scores).some(Boolean) ? normalize(scores) : null;
  } catch {
    return null;
  }
}

export async function classifyEmotions(content: string): Promise<EmotionAnalysis> {
  const emotionScores = (await modelScores(content)) ?? heuristicScores(content);
  const ranked = (Object.entries(emotionScores) as [EmotionType, number][]).sort((a, b) => b[1] - a[1]);
  const primaryEmotion = ranked[0][0];
  const primaryScore = ranked[0][1];
  const secondaryScore = ranked[1]?.[1] ?? 0;
  const secondaryEmotions = ranked.slice(1).filter(([, score]) => score >= 0.05).map(([emotion]) => emotion);
  const mixedEmotion = secondaryEmotions.length > 0 && secondaryScore >= 0.2;

  return {
    primaryEmotion,
    secondaryEmotions,
    emotionScores,
    mixedEmotion,
    intensity: Math.max(5, Math.min(100, Math.round(primaryScore * 100))),
    signalStrength: Math.max(0, Math.min(100, Math.round((primaryScore - secondaryScore) * 100 + primaryScore * 20))),
  };
}