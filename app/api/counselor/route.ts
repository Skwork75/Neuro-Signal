import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJournalContent } from "@/lib/analyze";
import { createClient } from "@/lib/supabase/server";
import type { CounselorMessage, CounselorResult } from "@/lib/types";

const requestSchema = z.object({
  mode: z.enum(["initial", "follow_up"]).default("initial"),
  reason: z.string().trim().min(3).max(500),
  feelings: z.string().trim().min(3).max(500),
  impact: z.string().trim().max(500).optional().default(""),
  support: z.string().trim().max(500).optional().default(""),
  extra: z.string().trim().max(2_000).optional().default(""),
  entryIds: z.array(z.string().uuid()).max(10).default([]),
  answer: z.string().trim().max(2_000).optional().default(""),
  conversation: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2_000) })).max(20).default([]),
  turn: z.number().int().min(0).max(10).default(0),
});

function summarizeEvidence(entries: { content: string }[], limit = 2) {
  return entries
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((entry) => (entry.length > 220 ? `${entry.slice(0, 220).trim()}…` : entry));
}

function isAdviceRequest(answer: string) {
  return /\b(suggestion|suggestions|advice|tips?|how can I|how do I|what should I do|what can I do|help me|feel better|reduce|lower)\b/i.test(answer);
}

function isDirectQuestion(answer: string) {
  return /\?|^\s*(do|should|can|could|would|is|are|what|why|how)\b/i.test(answer);
}

function wantsToEnd(answer: string) {
  return /\b(i'?m done|do not want to continue|don't want to continue|that's enough|that is enough|stop here|finish)\b/i.test(answer);
}

function makeAdviceResponse(reason: string, answer: string) {
  const context = `${reason} ${answer}`;
  if (/presentation|meeting|speech|talk/i.test(context)) {
    return "Since your anxiety is connected to the presentation, try focusing on what you can control right now:\n\n1. Practice your opening once or twice.\n2. Write down three key points instead of memorizing every sentence.\n3. Take a few slow breaths before you begin and deliberately slow down your first few sentences.\n\nYou do not need to remove the anxiety completely; the goal is to make it manageable enough to start.";
  }
  if (/argument|friend|conversation|conflict|relationship/i.test(context)) {
    return "Since this is connected to a difficult interaction, you could:\n\n1. Write down what you want the other person to understand.\n2. Choose one specific example instead of trying to explain everything at once.\n3. Wait for a calmer moment before deciding whether to talk or send a message.\n\nYou can take time to decide what kind of response would feel right for you.";
  }
  if (/sleep|tired|exhaust/i.test(context)) {
    return "To make this feel a little more manageable, you could:\n\n1. Choose one small wind-down step you can repeat tonight.\n2. Write down any thoughts that keep you awake before getting into bed.\n3. Notice what tends to make rest easier or harder without judging yourself for it.\n\nYou only need to try one of these at a time.";
  }
  return "A few practical options are:\n\n1. Name the specific part of this situation you can influence today.\n2. Choose one small action and decide when you could try it.\n3. Tell someone you trust what kind of support would actually be useful.\n\nYou do not have to do all three; choose the one that feels most realistic.";
}

function makeDirectAnswer(reason: string, answer: string) {
  if (/should I practice|practice again|rehearse/i.test(answer) && /presentation|meeting|speech|talk/i.test(reason)) {
    return "Yes, a short focused practice round could help. Rather than repeating the whole presentation, rehearse the opening and the three points you most want to remember, then stop and give yourself a break.";
  }
  if (/how can I|how do I|what should I|what can I|feel better|reduce|lower/i.test(answer)) {
    return makeAdviceResponse(reason, answer);
  }
  return "You are asking a real question about what might help next. I can work through it with you using the situation you described, rather than assuming there is one right answer.";
}

function makeCounselorResponse(reason: string, answer: string) {
  const context = `${reason} ${answer}`;
  const lowerAnswer = answer.toLowerCase();

  if (isAdviceRequest(answer)) return makeAdviceResponse(reason, answer);
  if (isDirectQuestion(answer)) return makeDirectAnswer(reason, answer);

  if (/presentation|meeting|speech|talk/i.test(context)) {
    if (/^\s*(starting|beginning|to start)\s*[.!?]*$/i.test(answer)) {
      return "Getting started can feel like the hardest part when you are already feeling anxious.";
    }
    if (/forget|remember|what to say|lose my flow/i.test(lowerAnswer)) {
      return "That sounds like the fear of losing your flow is adding to the pressure. A short outline of your main points could give you something steady to return to.";
    }
    if (/tip|advice|help me/i.test(lowerAnswer)) {
      return "It sounds like you are looking for something practical to try. We can keep the next step small and focused on the part of the presentation that feels most difficult.";
    }
  }

  if (/argument|friend|conversation|conflict/i.test(context)) {
    if (/sorry|guilty|bad|hurt|upset/i.test(lowerAnswer)) {
      return "It sounds like the disagreement is still weighing on you, and the impact on the relationship matters to you.";
    }
    return "It sounds like this interaction is still sitting with you, rather than feeling finished or settled.";
  }

  if (/tip|advice|help me/i.test(lowerAnswer)) {
    return "It sounds like you want something practical that could help with this right now. We can look for one small step that fits your situation.";
  }

  if (/^\s*(yes|no|maybe|idk|i do not know|i don't know|starting)\s*[.!?]*$/i.test(answer)) {
    return "That is okay; we can take this one small piece at a time.";
  }

  return "That gives us another part of your experience to work with. We can stay with what you actually know right now and take it one step at a time.";
}

function makeFollowUpQuestion(reason: string, feelings: string, impact: string, extra: string, answer = "") {
  const latestAnswer = answer.trim();
  if (latestAnswer) {
    if (wantsToEnd(latestAnswer)) return "";
    if (isAdviceRequest(latestAnswer)) {
      if (/presentation|meeting|speech|talk/i.test(`${reason} ${latestAnswer}`)) return "Which of these feels most doable before the presentation?";
      return "Which of these suggestions feels most useful to try first?";
    }
    if (/^\s*(yes|no|maybe|idk|i do not know|i don't know)\s*[.!?]*$/i.test(latestAnswer)) {
      if (/presentation|meeting|speech|talk/i.test(reason)) return "Would you like to focus first on what to say, how to feel calmer, or what might happen?";
      return "What feels most unclear right now: what to do, what might happen, or how you feel?";
    }
    if (/presentation|meeting|speech|talk/i.test(`${reason} ${latestAnswer}`)) {
      if (/practice|prepared|ready/i.test(latestAnswer)) return "What part of your preparation still feels uncertain?";
      if (/forget|remember|say/i.test(latestAnswer)) return "Which key point would you most want to remember when you begin?";
      if (/starting|begin/i.test(latestAnswer)) return "What specifically are you worried might happen when you start presenting?";
      return "What would help you feel a little more prepared for that presentation?";
    }
    if (/argument|friend|conversation|conflict/i.test(`${reason} ${latestAnswer}`)) {
      return "What would you want the other person to understand about your side?";
    }
    if (/sleep|tired|exhaust/i.test(latestAnswer)) return "What seems to make rest more difficult for you right now?";
    if (/work|job|school|study/i.test(`${reason} ${latestAnswer}`)) return "Which part of that situation would be most useful to make easier first?";
    return "What detail in what you described feels most important to understand better?";
  }

  const situation = reason.trim().replace(/^[Ii](?:'m| am)\s+\w+\s+because\s+/i, "").replace(/\s+/g, " ");

  if (situation.length > 0) {
    const directSituation = situation
      .replace(/^I had\s+(.+?)(?:\s+and I (?:feel|felt)\b.*)?$/i, "the $1")
      .replace(/^I have\s+(?:a|an|the)\s+(.+)$/i, "your $1")
      .replace(/^I have\s+(.+)$/i, "your $1")
      .replace(/\bmy\b/gi, "your")
      .replace(/[.!?]+$/, "");
    return `What part of ${directSituation.toLowerCase()} feels hardest to deal with right now?`;
  }

  if (impact.trim().length > 0) {
    return "Which part of this situation is affecting your day the most right now?";
  }

  if (extra.trim().length > 0) {
    return "What detail from this situation keeps coming back to you?";
  }

  if (feelings.trim().length > 0) {
    return "What feels hardest to put into words about this right now?";
  }

  return "What feels like the smallest next step that would make this easier to carry?";
}

function buildNextSteps(reason: string, conversation: CounselorMessage[], support: string) {
  const context = `${reason} ${support} ${conversation.map((message) => message.content).join(" ")}`;
  if (/presentation|meeting|speech|talk/i.test(context)) {
    return [
      "Practice the opening of your presentation once or twice so the first minute feels familiar.",
      "Review your key points rather than trying to memorize every sentence.",
      "Set aside a short pre-presentation routine, such as taking a few slow breaths and checking your notes.",
    ];
  }
  if (/argument|friend|conversation|conflict/i.test(context)) {
    return [
      "Write down what you want the other person to understand before deciding whether to talk.",
      "Choose a calm time to explain your side using one specific example.",
      "Give yourself time to decide what kind of repair or boundary would feel right.",
    ];
  }
  if (support.trim()) return [`Try one small step connected to the support you named: ${support.trim().replace(/[.!?]+$/, "")}.`];
  return [
    "Name the one part of this situation you can influence today.",
    "Write down one specific next step and choose when you could try it.",
  ];
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Please answer the first two questions and try again." }, { status: 400 });
    }
    if (body.data.mode === "follow_up" && !body.data.answer.trim()) {
      return NextResponse.json({ error: "Please write a response before continuing." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

    const { data: entries, error } = body.data.entryIds.length
      ? await supabase.from("journal_entries").select("id, content").eq("user_id", user.id).in("id", body.data.entryIds)
      : { data: [], error: null };
    if (error) return NextResponse.json({ error: "Could not read your selected entries." }, { status: 500 });

    const evidence = summarizeEvidence(entries ?? []);
    const conversation = body.data.conversation as CounselorMessage[];
    const conversationContext = conversation.length
      ? conversation.map((message) => `${message.role === "user" ? "User" : "Counselor"}: ${message.content}`).join("\n\n")
      : "";
    const context = [
      `Reason for seeking support: ${body.data.reason}`,
      `Current feelings: ${body.data.feelings}`,
      body.data.impact ? `Impact on daily life: ${body.data.impact}` : "",
      body.data.support ? `Support wanted: ${body.data.support}` : "",
      body.data.extra ? `Additional context: ${body.data.extra}` : "",
      ...(evidence.length ? evidence.map((entry) => `Journal evidence: ${entry}`) : []),
      conversationContext,
      body.data.answer ? `Latest user response: ${body.data.answer}` : "",
    ].filter(Boolean).join("\n\n");

    const analysis = await analyzeJournalContent(context);
    const focus = analysis.themes[0] ?? analysis.dominantEmotion;
    const isFollowUp = body.data.mode === "follow_up";
    const turn = isFollowUp ? body.data.turn + 1 : 0;
    const urgent = analysis.safetyState === "urgent";
    const enoughInformation = turn >= 3;
    const isComplete = urgent || (isFollowUp && (enoughInformation || wantsToEnd(body.data.answer)));
    const secondaryEmotions = (analysis.secondaryEmotions ?? []).map((emotion) => emotion.toLowerCase());
    const mixedEmotionText = analysis.mixedEmotion && secondaryEmotions.length
      ? ` The tone feels mixed, with ${analysis.dominantEmotion.toLowerCase()} as the strongest signal and ${secondaryEmotions.slice(0, 2).join(" and ")} also present.`
      : "";

    const evidenceText = evidence.length
      ? ` Based on the journal entries you selected, the pattern is grounded in what you actually wrote and not just in the form answers.`
      : " Your reflection is based on the answers you provided, and there is no selected journal evidence to ground it further.";

    const urgentSafetySummary = analysis.safetyState === "urgent"
      ? " This looks urgent enough that I would prioritize immediate support and a safe environment over reflection alone."
      : "";

    const userDetails = [...conversation.filter((message) => message.role === "user").map((message) => message.content), body.data.answer].filter(Boolean);
    const understanding = isFollowUp
      ? urgent
        ? "Your latest message raises an urgent safety concern, so I am pausing ordinary reflection questions. Please focus on immediate support and getting to a safe place."
        : isComplete
          ? `You started with ${body.data.reason.toLowerCase()}. As you described ${userDetails.join(" ").toLowerCase()}, the main thread became clearer: ${focus.toLowerCase()} is worth continuing to notice, while the emotional signal remains tentative and based only on what you shared.`
        : makeCounselorResponse(body.data.reason, body.data.answer)
      : `You described feeling ${body.data.feelings.toLowerCase()} and said this matters because ${body.data.reason.toLowerCase()}.${evidenceText}${mixedEmotionText}${urgentSafetySummary} This points toward ${focus.toLowerCase()} as the main thread, while keeping room for the mixed feeling that may be present at the same time.`;

    const nextSteps = urgent
      ? [
          "Move to a safe place and contact a trusted person or emergency support now.",
          "If you may act on these thoughts, call your local emergency number or the relevant crisis service immediately.",
        ]
      : isComplete
        ? buildNextSteps(body.data.reason, [...conversation, ...(body.data.answer ? [{ role: "user", content: body.data.answer } satisfies CounselorMessage] : [])], body.data.support)
        : [];

    const reflectionQuestion = isComplete ? "" : makeFollowUpQuestion(body.data.reason, body.data.feelings, body.data.impact, body.data.extra, body.data.answer);
    const nextConversation: CounselorMessage[] = isFollowUp
      ? [...conversation, { role: "user", content: body.data.answer } satisfies CounselorMessage, { role: "assistant", content: understanding } satisfies CounselorMessage, ...(reflectionQuestion ? [{ role: "assistant", content: reflectionQuestion } satisfies CounselorMessage] : [])]
      : [{ role: "assistant", content: understanding } satisfies CounselorMessage, ...(reflectionQuestion ? [{ role: "assistant", content: reflectionQuestion } satisfies CounselorMessage] : [])];

    const result: CounselorResult = {
      focus,
      understanding,
      nextSteps: [...new Set(nextSteps)],
      reflectionQuestion,
      sourceCount: entries?.length ?? 0,
      analysis,
      conversation: nextConversation,
      turn,
      isComplete,
      finalTakeaway: isComplete ? `The main thread to carry forward is ${focus.toLowerCase()}. You can take this one step at a time and adjust as you learn more about what helps.` : undefined,
      feedback: {
        prompt: "Was this reflection helpful?",
      },
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not prepare your counselor reflection. Please try again." }, { status: 500 });
  }
}