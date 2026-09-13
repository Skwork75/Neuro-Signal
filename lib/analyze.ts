import "server-only";

import { InferenceClient } from "@huggingface/inference";
import type { AnalysisResult, EmotionScores, EmotionType, RiskLevel, StressLevel } from "@/lib/types";

const MAX_MODEL_CHARS = 2_000;
const DEFAULT_MODEL = "j-hartmann/emotion-english-distilroberta-base";
// Keep this deliberately narrow: sadness or stress alone must not create a crisis alert.
const CRISIS_PATTERNS = [/\b(?:kill|hurt)\s+myself\b/i, /\b(?:end|take)\s+my\s+life\b/i, /\b(?:want|plan|going)\s+to\s+die\b/i, /\b(?:suicid(?:e|al)|self[-\s]?harm)\b/i, /\bno\s+reason\s+to\s+live\b/i];
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
const THEME_KEYWORDS: Record<string, string[]> = {
  Work: ["work", "job", "boss", "meeting", "deadline", "career", "office"],
  Relationships: ["friend", "family", "partner", "relationship", "mom", "dad", "sister", "brother"],
  Rest: ["sleep", "tired", "rest", "exhausted", "night", "morning"],
  "Self-worth": ["enough", "failure", "proud", "worthless", "confidence", "good enough"],
  Health: ["health", "body", "pain", "exercise", "walk", "food"],
  Change: ["future", "change", "move", "decision", "uncertain", "opportunity"],
};

function emptyScores(): EmotionScores { return { Happy: 0, Sad: 0, Angry: 0, Fear: 0, Neutral: 0 }; }
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
  } catch { return null; }
}
function stressFromScores(scores: EmotionScores): { level: StressLevel; score: number } {
  const score = Math.round((scores.Angry * 0.35 + scores.Fear * 0.4 + scores.Sad * 0.25) * 100);
  if (score >= 65) return { level: "High", score };
  if (score >= 35) return { level: "Medium", score };
  return { level: "Low", score };
}
function riskFromScores(scores: EmotionScores, crisisDetected: boolean): { level: RiskLevel; score: number } {
  if (crisisDetected) return { level: "High", score: 100 };
  const score = Math.round((scores.Sad * 0.55 + scores.Fear * 0.3 + scores.Angry * 0.15) * 100);
  return score >= 65 ? { level: "Moderate", score } : { level: "Low", score };
}
function recommendationsFor(emotion: EmotionType, crisisDetected: boolean): string[] {
  if (crisisDetected) return ["Move to a safer place and contact someone you trust now.", "If you might act on these thoughts, call your local emergency number now.", "Find a local crisis service at findahelpline.com, or call/text 988 in the US and Canada."];
  const suggestions: Record<EmotionType, string[]> = {
    Happy: ["Notice what supported this feeling today.", "Write down one moment you want to remember."],
    Sad: ["Try one small act of care, such as water, food, rest, or a short walk.", "Consider sharing how you feel with someone you trust."],
    Angry: ["Give yourself a pause before responding to a difficult situation.", "Name the need or boundary underneath the feeling."],
    Fear: ["Try a five-senses grounding exercise.", "Separate what you know right now from what you are predicting."],
    Neutral: ["Check in with your body and name one thing it needs.", "Write one small intention for the next few hours."],
  };
  return [...suggestions[emotion], "If this feeling persists or affects daily life, consider speaking with a licensed professional."];
}
function extractThemes(content: string): string[] {
  const text = content.toLowerCase();
  return Object.entries(THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([theme]) => theme)
    .slice(0, 3);
}
function reflectionFor(emotion: EmotionType, themes: string[]): string {
  const focus = themes[0]?.toLowerCase();
  if (focus) return `What part of ${focus} is within your control today, even in a small way?`;
  const questions: Record<EmotionType, string> = {
    Happy: "What helped create this feeling, and how could you make room for it again?",
    Sad: "What would feeling supported look like for you today?",
    Angry: "What boundary, need, or value might be underneath this feeling?",
    Fear: "What is one fact you know right now, separate from what you fear may happen?",
    Neutral: "What would make the next few hours feel slightly more intentional?",
  };
  return questions[emotion];
}
function experimentFor(emotion: EmotionType, themes: string[]): string {
  if (themes.includes("Rest")) return "For three days, note your bedtime and energy level. Look for a pattern, not perfection.";
  if (themes.includes("Relationships")) return "Try one low-pressure connection this week: send a message, take a walk, or ask someone how they are.";
  if (emotion === "Fear") return "When worry shows up this week, write one fact and one next action before continuing your day.";
  if (emotion === "Angry") return "Before one difficult reply this week, pause for ten minutes and write the need you want to express.";
  return "Choose one small act of care this week and record whether it changed how your day felt.";
}

export async function analyzeJournalContent(content: string): Promise<AnalysisResult> {
  const emotionScores = (await modelScores(content)) ?? heuristicScores(content);
  const dominantEmotion = (Object.entries(emotionScores) as [EmotionType, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const confidence = Math.round(emotionScores[dominantEmotion] * 100);
  const crisisDetected = CRISIS_PATTERNS.some((pattern) => pattern.test(content));
  const stress = stressFromScores(emotionScores);
  const risk = riskFromScores(emotionScores, crisisDetected);
  const themes = extractThemes(content);
  return {
    dominantEmotion, emotionScores, stressLevel: stress.level, stressScore: stress.score, riskLevel: risk.level, riskScore: risk.score, confidence,
    summary: `Your words most closely reflect ${dominantEmotion.toLowerCase()} in this entry.`,
    insights: [`The language suggests ${stress.level.toLowerCase()} stress.`, crisisDetected ? "Your entry includes language that may signal an immediate need for support." : "This is a reflective wellbeing signal, not a diagnosis or clinical assessment."],
    recommendations: recommendationsFor(dominantEmotion, crisisDetected),
    themes,
    reflectionQuestion: reflectionFor(dominantEmotion, themes),
    experiment: experimentFor(dominantEmotion, themes),
    crisisDetected,
  };
}
