import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "../lib/i18n.jsx";

const LANGUAGES = [
  { code: "he", label: "עברית", short: "HE" },
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "AR" },
];

/** Language switcher styled for FreeAI's dark/kids themes. */
export default function LanguageSwitcher({ tone = "dark" }) {
  const { lang, setLang, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const triggerClass =
    tone === "kids"
      ? "bg-white/20 hover:bg-white/30 text-white"
      : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-xs font-bold rounded-xl px-2.5 py-1.5 transition-colors ${triggerClass}`}
      >
        <Globe className="w-3.5 h-3.5" />
        {current.short}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 ${dir === "rtl" ? "left-0" : "right-0"} min-w-[140px] z-50 overflow-hidden rounded-xl border border-white/15 bg-slate-900/95 backdrop-blur-xl shadow-2xl`}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                l.code === lang
                  ? "text-violet-300 font-bold bg-violet-500/15"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
              {l.code === lang && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
