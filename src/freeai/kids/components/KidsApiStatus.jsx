import React, { useState, useEffect } from "react";
import { Key, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { getChatProviderStatus, preloadPuter } from "../../lib/chatEngine.js";
import { hasFullAccess } from "../../lib/demoMode.js";
import { loadApiKeys, saveApiKey } from "../../lib/creditStore.js";
import { R } from "../../lib/routes.js";

const KEYS = [
  {
    id: "groq",
    name: { he: "Groq (מומלץ)", en: "Groq (recommended)", ar: "Groq" },
    url: "https://console.groq.com/keys",
  },
  {
    id: "google_ai_studio",
    name: { he: "Google Gemini", en: "Google Gemini", ar: "Gemini" },
    url: "https://aistudio.google.com/app/apikey",
  },
];

export default function KidsApiStatus({ lang = "he", compact = false }) {
  const [status, setStatus] = useState(() => getChatProviderStatus());
  const [keys, setKeys] = useState(() => loadApiKeys());
  const [draft, setDraft] = useState("");

  useEffect(() => {
    preloadPuter().then(() => setStatus(getChatProviderStatus()));
    const poll = setInterval(() => setStatus(getChatProviderStatus()), 3000);
    return () => clearInterval(poll);
  }, []);

  const chatOk =
    status.groq ||
    status.gemini ||
    status.deepseek ||
    status.puter ||
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

  if (compact) {
    if (hasFullAccess()) {
      return (
        <span className="text-[10px] font-bold text-blue-200 bg-blue-500/25 px-2 py-0.5 rounded-full">
          Pro
        </span>
      );
    }
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chatOk ? "text-green-200 bg-green-500/25" : "text-amber-200 bg-amber-500/25"}`}>
        {chatOk ? (lang === "he" ? "AI מוכן" : "AI ready") : (lang === "he" ? "AI טוען..." : "AI loading...")}
      </span>
    );
  }

  if (chatOk) return null;

  return (
    <div className="kids-glass-card p-3 space-y-2 border border-amber-400/30 bg-amber-500/10 text-xs">
      <p className="font-bold flex items-center gap-1">
        <AlertTriangle className="w-4 h-4 text-amber-300" />
        {pickL({
          he: "לצ'אט חכם יותר — הדבק מפתח Groq חינמי (אופציונלי)",
          en: "For smarter chat — paste a free Groq key (optional)",
          ar: "مفتاح Groq",
        }, lang)}
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="gsk_..."
          className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 font-mono"
        />
        <button type="button" onClick={saveGroq} className="kids-sim-btn shrink-0 flex items-center gap-1">
          <Key className="w-4 h-4" /> {lang === "he" ? "שמור" : "Save"}
        </button>
      </div>
      {KEYS.map((k) => (
        <a key={k.id} href={k.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline text-yellow-200">
          {pickL(k.name, lang)} <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  );
}
