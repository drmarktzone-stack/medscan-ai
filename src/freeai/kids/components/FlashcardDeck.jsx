import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import { pickL } from "../lib/locale.js";

const UI = {
  card: { he: "כרטיס", en: "Card", ar: "بطاقة" },
  of: { he: "מתוך", en: "of", ar: "من" },
  flip: { he: "הפוך", en: "Flip", ar: "اقلب" },
  next: { he: "הבא", en: "Next", ar: "التالي" },
  prev: { he: "הקודם", en: "Prev", ar: "السابق" },
  hint: { he: "רמז", en: "Hint", ar: "تلميح" },
};

export default function FlashcardDeck({ cards = [], lang = "he" }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!cards.length) {
    return (
      <div className="text-center py-8 opacity-70">
        {lang === "he" ? "אין כרטיסים עדיין" : lang === "ar" ? "لا بطاقات بعد" : "No cards yet"}
      </div>
    );
  }

  const card = cards[idx];
  const rtl = lang !== "en";

  return (
    <div className="space-y-4" dir={rtl ? "rtl" : "ltr"}>
      <div className="text-center text-sm font-bold opacity-80">
        {pickL(UI.card, lang)} {idx + 1} {pickL(UI.of, lang)} {cards.length}
      </div>

      <button
        type="button"
        onClick={() => { setFlipped(!flipped); setShowHint(false); }}
        className="w-full min-h-[180px] rounded-3xl bg-white text-purple-900 p-6 shadow-xl border-4 border-white/50 flex items-center justify-center text-lg font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {flipped ? card.back : card.front}
      </button>

      {card.hint && showHint && (
        <div className="flex items-center gap-2 text-sm bg-white/20 rounded-xl px-3 py-2">
          <Lightbulb className="w-4 h-4 shrink-0" />
          {card.hint}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        <button type="button" onClick={() => setFlipped(!flipped)}
          className="px-4 py-2 rounded-xl bg-white/30 font-bold text-sm hover:bg-white/40">
          {pickL(UI.flip, lang)}
        </button>
        {card.hint && (
          <button type="button" onClick={() => setShowHint(!showHint)}
            className="px-4 py-2 rounded-xl bg-white/30 font-bold text-sm hover:bg-white/40">
            💡 {pickL(UI.hint, lang)}
          </button>
        )}
        <button type="button" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }}
          disabled={idx === 0}
          className="px-3 py-2 rounded-xl bg-white/30 disabled:opacity-40">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }}
          disabled={idx >= cards.length - 1}
          className="px-3 py-2 rounded-xl bg-white/30 disabled:opacity-40">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => { setIdx(0); setFlipped(false); }}
          className="px-3 py-2 rounded-xl bg-white/30">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
