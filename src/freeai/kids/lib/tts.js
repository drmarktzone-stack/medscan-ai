/**
 * Text-to-speech for kids (Web Speech API).
 */

import { resolveKidsLang } from "./locale.js";

const TTS_LANG = { he: "he-IL", en: "en-US", ar: "ar-SA" };

let currentUtterance = null;

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/**
 * @param {string} text
 * @param {{ lang?: string; rate?: number; onEnd?: () => void }} [opts]
 */
export function speakText(text, opts = {}) {
  if (!ttsSupported() || !text?.trim()) return false;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text.slice(0, 2000));
  u.lang = TTS_LANG[resolveKidsLang(opts.lang)] || "he-IL";
  u.rate = opts.rate ?? (resolveKidsLang(opts.lang) === "he" ? 0.95 : 1);
  u.pitch = 1.1;
  u.onend = () => {
    currentUtterance = null;
    opts.onEnd?.();
  };
  currentUtterance = u;
  window.speechSynthesis.speak(u);
  return true;
}

export function isSpeaking() {
  return typeof window !== "undefined" && window.speechSynthesis.speaking;
}
