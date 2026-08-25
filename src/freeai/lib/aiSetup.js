/**
 * Turning the AI on.
 *
 * Every text feature needs one provider that will actually answer. Keys baked
 * in at build time only help if the deployment sets them, so the app also lets
 * a person paste their own key, and verifies it against the live API instead of
 * just accepting whatever was typed.
 */

import { loadApiKeys, saveApiKey } from "./creditStore.js";
import { getChatProviderStatus, isPuterSignedIn } from "./chatEngine.js";

/** Providers a person can enable themselves, cheapest setup first. */
export const SETUP_PROVIDERS = [
  {
    id: "groq",
    env: "VITE_GROQ_API_KEY",
    name: { he: "Groq", en: "Groq" },
    blurb: {
      he: "מהיר וחינמי — 14,400 בקשות ביום. ההמלצה שלנו.",
      en: "Fast and free — 14,400 requests a day. Our recommendation.",
      ar: "سريع ومجاني.",
    },
    keyUrl: "https://console.groq.com/keys",
    prefix: "gsk_",
  },
  {
    id: "google_ai_studio",
    env: "VITE_GOOGLE_AI_API_KEY",
    name: { he: "Google Gemini", en: "Google Gemini" },
    blurb: {
      he: "מכסה חינמית נדיבה מ-Google AI Studio.",
      en: "Generous free quota from Google AI Studio.",
      ar: "حصة مجانية من Google.",
    },
    keyUrl: "https://aistudio.google.com/app/apikey",
    prefix: "AIza",
  },
];

/**
 * Ask the provider to answer one trivial prompt.
 *
 * Format checks catch typos but not a revoked or rate-limited key, and this is
 * the difference between "saved" and "working".
 *
 * @param {'groq'|'google_ai_studio'} providerId
 * @param {string} key
 * @returns {Promise<{ ok: boolean; reason?: string; status?: number }>}
 */
export async function verifyKey(providerId, key) {
  const trimmed = String(key || "").trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    if (providerId === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${trimmed}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "groq/compound-mini",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });
      if (res.ok) return { ok: true };
      if (res.status === 401 || res.status === 403) return { ok: false, reason: "bad_key", status: res.status };
      if (res.status === 429) return { ok: false, reason: "rate_limited", status: res.status };
      return { ok: false, reason: "provider_error", status: res.status };
    }

    if (providerId === "google_ai_studio") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }),
      });
      if (res.ok) return { ok: true };
      if (res.status === 400 || res.status === 403) return { ok: false, reason: "bad_key", status: res.status };
      return { ok: false, reason: "provider_error", status: res.status };
    }

    return { ok: false, reason: "unknown_provider" };
  } catch (error) {
    // An aborted request and a blocked endpoint look the same from here; both
    // mean this browser cannot reach the provider.
    return { ok: false, reason: error?.name === "AbortError" ? "timeout" : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

/** Save a key only after it has answered. */
export async function verifyAndSaveKey(providerId, key) {
  const result = await verifyKey(providerId, key);
  if (result.ok) saveApiKey(providerId, String(key).trim());
  return result;
}

/**
 * How the app can currently answer, in the order it will try.
 * @returns {{ mode: 'key'|'puter'|'none'; providerId?: string }}
 */
export function aiReadiness() {
  const status = getChatProviderStatus();
  const keys = loadApiKeys();

  for (const provider of SETUP_PROVIDERS) {
    const statusKey = provider.id === "groq" ? "groq" : "gemini";
    if (status[statusKey] || keys[provider.id]) {
      return { mode: "key", providerId: provider.id };
    }
  }
  if (keys.deepseek || status.deepseek) return { mode: "key", providerId: "deepseek" };
  if (isPuterSignedIn()) return { mode: "puter" };
  return { mode: "none" };
}
