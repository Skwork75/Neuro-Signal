import { Circle, CloudRain, Flame, Leaf, Sun } from "lucide-react";
import type { EmotionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const emotionStyles: Record<EmotionType, { icon: typeof Sun; className: string }> = {
  Happy: { icon: Sun, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200" },
  Sad: { icon: CloudRain, className: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200" },
  Angry: { icon: Flame, className: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200" },
  Fear: { icon: Leaf, className: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200" },
  Neutral: { icon: Circle, className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

export function EmotionMark({ emotion, size = "default" }: { emotion: EmotionType; size?: "default" | "large" }) {
  const style = emotionStyles[emotion];
  const Icon = style.icon;
  return <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full", style.className, size === "large" ? "size-12" : "size-9")} aria-label={`${emotion} emotional signal`}><Icon className={size === "large" ? "size-6" : "size-4"} strokeWidth={1.8} /></span>;
}