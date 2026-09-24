const THEME_KEYWORDS: Record<string, string[]> = {
  Work: ["work", "job", "boss", "meeting", "deadline", "career", "office"],
  Relationships: ["friend", "family", "partner", "relationship", "mom", "dad", "sister", "brother"],
  Rest: ["sleep", "tired", "rest", "exhausted", "night", "morning"],
  "Self-worth": ["enough", "failure", "proud", "worthless", "confidence", "good enough"],
  Health: ["health", "body", "pain", "exercise", "walk", "food"],
  Change: ["future", "change", "move", "decision", "uncertain", "opportunity"],
};

export function detectThemes(content: string): string[] {
  const text = content.toLowerCase();
  return Object.entries(THEME_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([theme]) => theme)
    .slice(0, 3);
}