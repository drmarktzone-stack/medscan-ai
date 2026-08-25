import React, { useState, useEffect } from "react";
import { Key, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { getChatProviderStatus, preloadPuter, isPuterSignedIn } from "../../lib/chatEngine.js";
import { hasFullAccess } from "../../lib/demoMode.js";
import { loadApiKeys, saveApiKey } from "../../lib/creditStore.js";

const KEY_LINKS = [
  { id: "groq", name: { he: "Groq (מומלץ)", en: "Groq (recommended)", ar: "Groq" }, url: "https://console.groq.com/keys" },
  { id: "google_ai_studio", name: { he: "Google Gemini", en: "Google Gemini", ar: "Gemini" }, url: "https://aistudio.google.com/app/apikey" },
];

const COPY = {
  ready: { he: "AI מחובר", en: "AI connected", ar: "AI متصل" },
  free: { he: "AI חינמי", en: "Free AI", ar: "AI مجاني" },
  freeHint: {
    he: "ההודעה הראשונה עשויה לבקש התחברות חינמית ל-Puter",
    en: "The first message may ask for a free Puter sign-in",
    ar: "قد تطلب الرسالة الأولى تسجيل دخول مجاني",
  },
  title: {
    he: "רוצה תשובות מהירות יותר, בלי התחברות?",
    en: "Want faster answers with no sign-in?",
    ar: "إجابات أسرع بدون تسجيل دخول؟",
  },
  body: {
    he: "הדבק מפתח Groq חינמי — הצ'אט, השיעור היומי והלימוד יעבדו מיד.",
    en: "Paste a free Groq key — chat, daily lesson and study start working right away.",
    ar: "الصق مفتاح Groq مجاني.",
  },
  save: { he: "שמור", en: "Save", ar: "حفظ" },
};

/**
 * Shows how Kids AI is currently powered.
 *
 * A saved API key answers instantly. Without one the app still works through
 * Puter, which is free but may ask for a sign-in on the first message — so the
 * two states are labelled differently instead of both claiming "connected".
 */
export default function KidsApiStatus({ lang = "he", compact = false }) {
  const [status, setStatus] = useState(() => getChatProviderStatus());
  const [keys, setKeys] = useState(() => loadApiKeys());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let alive = true;
    preloadPuter().then(() => {
      if (alive) setStatus(getChatProviderStatus());
    });
    return () => { alive = false; };
  }, []);

  const hasKey = Boolean(
    status.groq || status.gemini || status.deepseek || status.base44 ||
    keys.groq || keys.google_ai_studio || keys.deepseek,
  );
  const instant = hasKey || isPuterSignedIn();

  const saveGroq = () => {
    if (!draft.trim()) return;
    saveApiKey("groq", draft.trim());
    setKeys(loadApiKeys());
    setStatus(getChatProviderStatus());
    setDraft("");
  };

  if (compact) {
    if (hasFullAccess()) {
      return (
        <span className="text-[10px] font-bold text-blue-100 bg-blue-500/30 px-2 py-0.5 rounded-full">Pro</span>
      );
    }
    return (
      <span
        title={instant ? undefined : pickL(COPY.freeHint, lang)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          instant ? "text-green-100 bg-green-500/30" : "text-sky-100 bg-sky-500/30"
        }`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {instant ? pickL(COPY.ready, lang) : pickL(COPY.free, lang)}
      </span>
    );
  }

  if (hasKey) return null;

  return (
    <div className="kids-glass-card p-4 space-y-3 text-xs">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-200" />
        <div>
          <p className="font-black text-sm">{pickL(COPY.title, lang)}</p>
          <p className="opacity-90 mt-1">{pickL(COPY.body, lang)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="gsk_..."
          aria-label="Groq API key"
          className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 font-mono"
        />
        <button type="button" onClick={saveGroq} className="kids-sim-btn shrink-0 flex items-center gap-1">
          <Key className="w-4 h-4" /> {pickL(COPY.save, lang)}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {KEY_LINKS.map((k) => (
          <a
            key={k.id}
            href={k.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline text-yellow-200"
          >
            {pickL(k.name, lang)} <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
