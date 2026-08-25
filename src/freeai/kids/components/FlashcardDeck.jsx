import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb } from "lucide-react";
import { pickL } from "../lib/locale.js";
import KidsImage from "./KidsImage.jsx";

const UI = {
  card: { he: "כרטיס", en: "Card", ar: "بطاقة" },
  of: { he: "מתוך", en: "of", ar: "من" },
  flip: { he: "הפוך", en: "Flip", ar: "اقلب" },
  hint: { he: "רמז", en: "Hint", ar: "تلميح" },
};

export default function FlashcardDeck({ cards = [], lang = "he" }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!cards.length) {
    return (
      <div className="text-center py-8 opacity-70 kids-glass-card">
        {lang === "he" ? "אין כרטיסים עדיין" : lang === "ar" ? "لا بطاقات بعد" : "No cards yet"}
      </div>
    );
  }

  const card = cards[idx];
  const rtl = lang !== "en";

  return (
    <div className="space-y-4" dir={rtl ? "rtl" : "ltr"}>
      <div className="text-center text-sm font-bold opacity-90">
        {pickL(UI.card, lang)} {idx + 1} {pickL(UI.of, lang)} {cards.length}
      </div>

      <div className="kids-flip-scene w-full max-w-md mx-auto" style={{ minHeight: 280 }}>
        <button
          type="button"
          onClick={() => { setFlipped(!flipped); setShowHint(false); }}
          className={`kids-flip-card w-full ${flipped ? "is-flipped" : ""}`}
        >
          <div className="kids-flip-face kids-flip-front kids-glass-card p-4 flex flex-col items-center justify-center gap-3 min-h-[280px]">
            {card.imageUrl && !flipped && (
              <KidsImage src={card.imageUrl} alt="" aspect="square" className="w-32 h-32 shrink-0" />
            )}
            <p className="text-lg font-black text-white text-center leading-snug">{card.front}</p>
          </div>
          <div className="kids-flip-face kids-flip-back kids-glass-card p-6 flex items-center justify-center min-h-[280px]">
            <p className="text-lg font-bold text-white text-center leading-relaxed">{card.back}</p>
          </div>
        </button>
      </div>

      {card.hint && showHint && (
        <div className="flex items-center gap-2 text-sm bg-white/20 rounded-xl px-3 py-2 kids-glass-card">
          <Lightbulb className="w-4 h-4 shrink-0" />
          {card.hint}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        <button type="button" onClick={() => setFlipped(!flipped)} className="kids-sim-btn">
          {pickL(UI.flip, lang)}
        </button>
        {card.hint && (
          <button type="button" onClick={() => setShowHint(!showHint)} className="kids-sim-btn">
            💡 {pickL(UI.hint, lang)}
          </button>
        )}
        <button type="button" onClick={() => { setIdx(Math.max(0, idx - 1)); setFlipped(false); }} disabled={idx === 0} className="kids-sim-btn disabled:opacity-40">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => { setIdx(Math.min(cards.length - 1, idx + 1)); setFlipped(false); }} disabled={idx >= cards.length - 1} className="kids-sim-btn disabled:opacity-40">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => { setIdx(0); setFlipped(false); }} className="kids-sim-btn">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
