import type { EmotionType } from "@/lib/types";

export function recommendationsFor(emotion: EmotionType, crisisDetected: boolean): string[] {
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

export function reflectionFor(emotion: EmotionType, themes: string[]): string {
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

export function experimentFor(emotion: EmotionType, themes: string[]): string {
  if (themes.includes("Rest")) return "For three days, note your bedtime and energy level. Look for a pattern, not perfection.";
  if (themes.includes("Relationships")) return "Try one low-pressure connection this week: send a message, take a walk, or ask someone how they are.";
  if (emotion === "Fear") return "When worry shows up this week, write one fact and one next action before continuing your day.";
  if (emotion === "Angry") return "Before one difficult reply this week, pause for ten minutes and write the need you want to express.";
  return "Choose one small act of care this week and record whether it changed how your day felt.";
}