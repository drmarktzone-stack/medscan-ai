import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { preloadPuter } from "../../lib/chatEngine.js";
import { aiReadiness } from "../../lib/aiSetup.js";
import { hasFullAccess } from "../../lib/demoMode.js";
import AISetupPanel from "../../components/AISetupPanel.jsx";

const COPY = {
  ready: { he: "AI פעיל", en: "AI live", ar: "AI متصل" },
  needsSetup: { he: "AI כבוי", en: "AI off", ar: "AI متوقف" },
  hint: {
    he: "לחצו כדי להפעיל את ה-AI",
    en: "Tap to turn the AI on",
    ar: "اضغط لتشغيل الذكاء الاصطناعي",
  },
};

/**
 * Whether the AI can actually answer.
 *
 * The compact badge used to read "connected" whenever a browser was present,
 * which told a child everything was fine while every answer came from local
 * fallbacks. It now reflects the real readiness and opens the setup panel.
 */
export default function KidsApiStatus({ lang = "he", compact = false }) {
  const [readiness, setReadiness] = useState(() => aiReadiness());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    preloadPuter().then(() => {
      if (alive) setReadiness(aiReadiness());
    });
    return () => { alive = false; };
  }, []);

  const live = readiness.mode !== "none";

  if (compact) {
    if (hasFullAccess() && live) {
      return (
        <span className="text-[10px] font-bold text-blue-100 bg-blue-500/30 px-2 py-0.5 rounded-full">Pro</span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={live ? undefined : pickL(COPY.hint, lang)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
          live
            ? "text-green-100 bg-green-500/30"
            : "text-amber-100 bg-amber-500/40 hover:bg-amber-500/55"
        }`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {live ? pickL(COPY.ready, lang) : pickL(COPY.needsSetup, lang)}
      </button>
    );
  }

  if (live && !open) return null;

  return (
    <AISetupPanel
      lang={lang}
      tone="kids"
      onConnected={(next) => { setReadiness(next); setOpen(false); }}
    />
  );
}
