import React from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useKidsVoice } from "../hooks/useKidsVoice.js";
import { pickL } from "../lib/locale.js";

const COPY = {
  talk: { he: "דבר אלי", en: "Talk to me", ar: "تحدث معي" },
  listening: { he: "מקשיב...", en: "Listening...", ar: "أستمع..." },
  unsupported: {
    he: "הדפדפן לא תומך במיקרופון — כתוב במקלדת",
    en: "Mic not supported — type instead",
    ar: "الميكروفون غير مدعوم — اكتب بدلاً",
  },
  hint: { he: "לחץ והתחל לדבר", en: "Tap and speak", ar: "اضغط وتحدث" },
};

/**
 * Voice input button — use in every Kids screen.
 * @param {{ onText: (text: string) => void; className?: string; size?: 'sm'|'md'|'lg' }} props
 */
export default function VoiceMic({ onText, className = "", size = "md" }) {
  const { lang } = useI18n();
  const { listening, transcript, start, stop, supported } = useKidsVoice({
    lang,
    onResult: (text) => { if (text) onText?.(text); },
  });

  const sz = size === "lg" ? "w-14 h-14 text-lg" : size === "sm" ? "w-9 h-9" : "w-12 h-12";

  if (!supported) {
    return (
      <p className={`text-xs opacity-70 ${className}`}>{pickL(COPY.unsupported, lang)}</p>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-label={pickL(COPY.talk, lang)}
        className={`${sz} rounded-full font-black shadow-lg flex items-center justify-center transition-all ${
          listening
            ? "bg-red-500 text-white animate-pulse scale-110 ring-4 ring-red-300/50"
            : "bg-white text-purple-700 hover:scale-105 active:scale-95"
        }`}
      >
        {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <span className="text-[10px] font-bold opacity-80 flex items-center gap-0.5">
        {listening ? (
          <><Volume2 className="w-3 h-3 animate-bounce" /> {pickL(COPY.listening, lang)}</>
        ) : (
          pickL(COPY.hint, lang)
        )}
      </span>
      {transcript && listening && (
        <p className="text-xs bg-white/25 rounded-lg px-2 py-1 max-w-[200px] truncate">{transcript}</p>
      )}
    </div>
  );
}

/**
 * Inline voice bar — mic + optional text field binding.
 */
export function VoiceInputRow({ value, onChange, placeholder, lang: langProp }) {
  const { lang: ctxLang } = useI18n();
  const lang = langProp || ctxLang;

  return (
    <div className="flex gap-2 items-end">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 rounded-xl text-purple-900 font-semibold"
      />
      <VoiceMic onText={(t) => onChange(value ? `${value} ${t}` : t)} size="md" />
    </div>
  );
}
