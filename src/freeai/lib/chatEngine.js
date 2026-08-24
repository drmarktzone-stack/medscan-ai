/**
 * FreeAI Chat Engine — real LLM responses with free provider fallback chain.
 *
 * Order: Groq → Pollinations → Base44 → Puter.js → smart local assistant
 */

import { loadApiKeys } from "./creditStore.js";
import { tryBase44Core } from "../../lib/medscan/llmAdapter.js";

const SYSTEM_PROMPT = `You are FreeAI Hub — a helpful AI assistant inside an app that aggregates 30+ free AI tools (images, code, video, design, deploy).

Rules:
- Reply in the same language the user writes (Hebrew → Hebrew, English → English).
- Be concise, friendly, and practical — like ChatGPT.
- You can help with: writing, ideas, code snippets, marketing copy, explanations, planning creative projects.
- When user wants images → suggest switching to 🖼️ Image mode or describe what to prompt.
- When user wants a website/app → suggest 💻 Code mode.
- Pro subscription is ₪20/month; free tier includes 2 projects/month.
- Never claim you executed actions you didn't — you only chat here; creation happens in other modes.
- Keep answers focused; use bullet lists when helpful.`;

function envKey(name) {
  if (typeof import.meta !== "undefined" && import.meta.env?.[name]) {
    return import.meta.env[name];
  }
  return null;
}

function getApiKey(providerId, envVar) {
  const keys = loadApiKeys();
  return keys[providerId] || envKey(envVar) || null;
}

/** @typedef {{ role: 'user'|'assistant'|'system'; content: string }} ChatMessage */

/**
 * @param {object} input
 * @param {string} input.prompt
 * @param {ChatMessage[]} [input.history]
 * @param {object[]} [input.attachments]
 */
export async function chatWithAI(input) {
  const { prompt, history = [], attachments = [] } = input;
  const trimmed = (prompt || "").trim();
  if (!trimmed && attachments.length === 0) {
    return { ok: false, reason: "empty_input" };
  }

  const attachmentNote = buildAttachmentContext(attachments);
  const userContent = attachmentNote ? `${trimmed}\n\n${attachmentNote}` : trimmed;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({ role: m.role, content: String(m.content || "").slice(0, 4000) })),
    { role: "user", content: userContent.slice(0, 8000) },
  ];

  const providers = [
    () => chatGroq(messages),
    () => chatPollinations(messages),
    () => chatBase44(messages),
    () => chatPuter(messages),
  ];

  for (const attempt of providers) {
    try {
      const result = await attempt();
      if (result?.ok && result.text?.trim()) return result;
    } catch {
      /* try next provider */
    }
  }

  return smartLocalChat(trimmed, history, attachments);
}

function buildAttachmentContext(attachments) {
  if (!attachments?.length) return "";
  const parts = attachments.map((a) => {
    if (a.kind === "image") return `[קובץ תמונה: ${a.name}]`;
    if (a.content) return `[קובץ ${a.name}]:\n${String(a.content).slice(0, 1500)}`;
    return `[קובץ: ${a.name}]`;
  });
  return parts.join("\n");
}

async function chatGroq(messages) {
  const key = getApiKey("groq", "VITE_GROQ_API_KEY");
  if (!key) return { ok: false, reason: "no_groq_key" };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: envKey("VITE_GROQ_MODEL") || "groq/compound-mini",
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, reason: "groq_error", detail: err.slice(0, 200) };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, reason: "groq_empty" };
  return { ok: true, text, provider: "groq", model: envKey("VITE_GROQ_MODEL") || "groq/compound-mini" };
}

async function chatPollinations(messages) {
  const key = getApiKey("pollinations_text", "VITE_POLLINATIONS_API_KEY");
  if (!key) return { ok: false, reason: "no_pollinations_key" };

  const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai-fast",
      messages,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) return { ok: false, reason: "pollinations_error" };

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, reason: "pollinations_empty" };
  return { ok: true, text, provider: "pollinations_text", model: "openai-fast" };
}

async function chatBase44(messages) {
  const invoke = tryBase44Core("InvokeLLM");
  if (!invoke) return { ok: false, reason: "no_base44" };

  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${SYSTEM_PROMPT}\n\n---\nConversation:\n${conversation}\n\nAssistant:`;

  const data = await invoke({
    prompt,
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
  });

  const text = (typeof data === "string" ? data : data?.text || data?.response || "").trim();
  if (!text) return { ok: false, reason: "base44_empty" };
  return { ok: true, text, provider: "base44", model: "claude" };
}

let puterLoadPromise = null;

function loadPuterScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no_window"));
  if (window.puter?.ai?.chat) return Promise.resolve(window.puter);
  if (puterLoadPromise) return puterLoadPromise;

  puterLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freeai-puter]');
    if (existing && window.puter?.ai?.chat) {
      resolve(window.puter);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.dataset.freeaiPuter = "1";
    script.onload = () => {
      if (window.puter?.ai?.chat) resolve(window.puter);
      else reject(new Error("puter_not_ready"));
    };
    script.onerror = () => reject(new Error("puter_load_failed"));
    document.head.appendChild(script);
  });

  return puterLoadPromise;
}

async function chatPuter(messages) {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };

  const puter = await loadPuterScript();
  const puterMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await puter.ai.chat(puterMessages, {
    model: "gpt-5-nano",
    stream: false,
  });

  const text = (
    typeof response === "string"
      ? response
      : response?.message?.content
        || response?.text
        || response?.content
        || ""
  ).trim();

  if (!text) return { ok: false, reason: "puter_empty" };
  return { ok: true, text, provider: "puter", model: "gpt-5-nano" };
}

/** Intelligent offline fallback when no API is available */
function smartLocalChat(prompt, history, attachments) {
  const lower = prompt.toLowerCase();
  const he = /[\u0590-\u05FF]/.test(prompt);

  const trimmedPrompt = prompt.trim();
  const greeting = /^(היי|שלום|hello|hi|hey)(?:[\s!,?]|$)/i.test(trimmedPrompt);

  if (greeting) {
    const text = he
      ? "שלום! 👋 אני FreeAI Hub.\n\nאפשר לשאול אותי כל שאלה — רעיונות, טקסטים, קוד, שיווק.\n\n💡 ליצירה:\n• 🖼️ תמונות\n• 💻 קוד/אתר\n• 🚀 פרויקט שלם\n\nPro: ₪20/חודש · חינם: 2 פרויקטים"
      : "Hello! 👋 I'm FreeAI Hub — ask me anything, or switch modes for images, code, and full projects. Pro: ₪20/mo.";
    return { ok: true, text, provider: "freeai-local", needsApiKey: true };
  }

  if (/מחיר|pricing|pro|כמה עולה|₪20/i.test(prompt)) {
    const text = he
      ? "💰 **מחירים:**\n• חינם — 2 פרויקטים/חודש, תמונות בסיסיות\n• Pro — ₪20/חודש, הכל ללא הגבלה\n\nתשלום ב-Bit → /freeai/checkout"
      : "Free: 2 projects/mo. Pro: ₪20/mo — unlimited. Pay via Bit at /freeai/checkout";
    return { ok: true, text, provider: "freeai-local" };
  }

  if (/תמונ|image|ציור|midjourney|logo/i.test(prompt)) {
    const text = he
      ? "🖼️ ליצירת תמונות — עבור למצב **תמונה** (🖼️) למעלה, או כתוב prompt מפורט.\n\nדוגמה: \"תמונת מוצר לחנות תכשיטים, רקע לבן, סטודיו\""
      : "Switch to 🖼️ Image mode for AI images, or describe what you want in detail.";
    return { ok: true, text, provider: "freeai-local", suggestMode: "image" };
  }

  if (/אתר|קוד|code|bolt|landing|html|react/i.test(prompt)) {
    const text = he
      ? "💻 לבניית אתר — עבור למצב **קוד** (💻) ותאר מה אתה צריך.\n\nדוגמה: \"דף נחיתה לחנות קפה בעברית\""
      : "Switch to 💻 Code mode and describe your site — I'll generate HTML/CSS/JS.";
    return { ok: true, text, provider: "freeai-local", suggestMode: "code" };
  }

  if (/עזר|help|מה אתה|what can|יודע לעשות/i.test(prompt)) {
    const text = he
      ? "אני יכול לעזור ב:\n✅ כתיבה ושיווק\n✅ רעיונות לפרויקטים\n✅ הסברים ותכנון\n✅ קוד קצר\n\n**ליצירה אמיתית** — השתמש במצבים: 🖼️ תמונה · 💻 קוד · 🚀 פרויקט\n\n⚠️ לצ'אט חכם מלא — הוסף מפתח Groq חינמי ב-/freeai/providers (Groq → console.groq.com)"
      : "I help with writing, ideas, planning, and short code. Use 🖼️/💻/🚀 modes to create. Add free Groq API key at /freeai/providers for full AI chat.";
    return { ok: true, text, provider: "freeai-local", needsApiKey: true };
  }

  // Context from history — echo understanding
  const lastUser = history.filter((m) => m.role === "user").slice(-2);
  const contextHint = lastUser.length > 1 && he
    ? " (ממשיך מהשיחה הקודמת)\n\n"
    : "";

  const text = he
    ? `${contextHint}קיבלתי: "${prompt.slice(0, 200)}"\n\n⚠️ **צ'אט AI מלא דורש מפתח חינמי** (2 דקות):\n1. היכנס ל-[console.groq.com](https://console.groq.com) → API Keys\n2. העתק מפתח\n3. /freeai/providers → Groq → הדבק\n\nאו השתמש במצבים:\n• 🖼️ **תמונה** — יצירה מיידית (Pollinations, חינם)\n• 💻 **קוד** — אתר מוכן\n• 🚀 **פרויקט** — pipeline מלא`
    : `${contextHint}Got it: "${prompt.slice(0, 200)}"\n\nFor full AI chat, add a free Groq key at /freeai/providers.\nOr use 🖼️ Image / 💻 Code / 🚀 Project modes for instant creation.`;

  return {
    ok: true,
    text,
    textEn: text,
    provider: "freeai-local",
    needsApiKey: true,
    attachments: attachments?.length || 0,
  };
}

export function getChatProviderStatus() {
  return {
    groq: !!getApiKey("groq", "VITE_GROQ_API_KEY"),
    pollinations: !!getApiKey("pollinations_text", "VITE_POLLINATIONS_API_KEY"),
    base44: !!tryBase44Core("InvokeLLM"),
    puter: typeof window !== "undefined",
  };
}
