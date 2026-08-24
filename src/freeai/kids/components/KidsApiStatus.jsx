import React, { useState, useEffect } from "react";
import { Key, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { getChatProviderStatus } from "../../lib/chatEngine.js";
import { loadApiKeys, saveApiKey } from "../../lib/creditStore.js";
import { R } from "../../lib/routes.js";

const KEYS = [
  {
    id: "groq",
    env: "VITE_GROQ_API_KEY",
    name: { he: "Groq (מומלץ לצ'אט AI)", en: "Groq (recommended for AI chat)", ar: "Groq" },
    url: "https://console.groq.com/keys",
    signup: "https://console.groq.com",
  },
  {
    id: "google_ai_studio",
    env: "VITE_GOOGLE_AI_API_KEY",
    name: { he: "Google Gemini (גיבוי)", en: "Google Gemini (backup)", ar: "Gemini" },
    url: "https://aistudio.google.com/app/apikey",
    signup: "https://aistudio.google.com",
  },
  {
    id: "deepseek",
    env: "VITE_DEEPSEEK_API_KEY",
    name: { he: "DeepSeek (גיבוי)", en: "DeepSeek (backup)", ar: "DeepSeek" },
    url: "https://platform.deepseek.com/api_keys",
    signup: "https://platform.deepseek.com",
  },
  {
    id: "pollinations_text",
    env: "VITE_POLLINATIONS_API_KEY",
    name: { he: "Pollinations (גיבוי)", en: "Pollinations (backup)", ar: "Pollinations" },
    url: "https://enter.pollinations.ai/keys",
    signup: "https://enter.pollinations.ai",
  },
];

export default function KidsApiStatus({ lang = "he", compact = false }) {
  const [status, setStatus] = useState(() => getChatProviderStatus());
  const [keys, setKeys] = useState(() => loadApiKeys());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setStatus(getChatProviderStatus());
    setKeys(loadApiKeys());
  }, []);

  const chatOk =
    status.groq ||
    status.gemini ||
    status.deepseek ||
    keys.groq ||
    keys.google_ai_studio ||
    keys.deepseek;

  const saveGroq = () => {
    if (!draft.trim()) return;
    saveApiKey("groq", draft.trim());
    setKeys(loadApiKeys());
    setStatus(getChatProviderStatus());
    setDraft("");
  };

  if (chatOk && compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-green-200 bg-green-500/20 px-3 py-1.5 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> AI {lang === "he" ? "מחובר" : "connected"}
      </div>
    );
  }

  if (chatOk) return null;

  return (
    <div className="kids-glass-card p-4 space-y-3 border-2 border-amber-400/40 bg-amber-500/10">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <p className="font-black text-sm">
            {pickL({
              he: "צ'אט AI דורש מפתח חינמי (Groq / Gemini / DeepSeek)",
              en: "AI chat needs a free key (Groq / Gemini / DeepSeek)",
              ar: "!",
            }, lang)}
          </p>
          <p className="text-xs opacity-90 mt-1">
            {pickL({
              he: "1. היכנס לקישור → 2. Create API Key → 3. הדבק כאן",
              en: "1. Open link → 2. Create API Key → 3. Paste here",
              ar: "1. الرابط → 2. مفتاح → 3. الصق",
            }, lang)}
          </p>
        </div>
      </div>

      {KEYS.map((k) => (
        <div key={k.id} className="text-xs space-y-1">
          <a href={k.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline text-yellow-200">
            {pickL(k.name, lang)} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="gsk_..."
          className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-sm font-mono"
        />
        <button type="button" onClick={saveGroq} className="kids-sim-btn shrink-0 flex items-center gap-1">
          <Key className="w-4 h-4" /> {lang === "he" ? "שמור" : "Save"}
        </button>
      </div>

      <p className="text-[10px] opacity-70">
        {pickL({
          he: `או הדבק ב-.env.local · Hub → ${R.providers}`,
          en: `Or paste in .env.local · Hub → ${R.providers}`,
          ar: ".env.local",
        }, lang)}
      </p>
    </div>
  );
}
