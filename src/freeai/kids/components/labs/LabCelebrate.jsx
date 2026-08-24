import React, { useEffect } from "react";
import { pickL } from "../../lib/locale.js";

const COPY = {
  awesome: { he: "מדהים!", en: "Awesome!", ar: "رائع!" },
  xp: { he: "נקודות XP", en: "XP points", ar: "نقاط" },
  levelUp: { he: "עלית רמה!", en: "Level up!", ar: "مستوى جديد!" },
  combo: { he: "רצף ניסויים", en: "Experiment combo", ar: "سلسلة!" },
};

export default function LabCelebrate({ show, result, onClose, lang = "he" }) {
  useEffect(() => {
    if (!show) return undefined;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm kids-fade-in">
      <div className="kids-lab-celebrate bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full border-4 border-white animate-bounce-slow">
        <div className="text-6xl mb-3 kids-confetti-burst">🎉✨🏆</div>
        <p className="text-3xl font-black drop-shadow-lg">{pickL(COPY.awesome, lang)}</p>
        {result.xp > 0 && (
          <p className="text-xl font-bold mt-2">+{result.xp} {pickL(COPY.xp, lang)}</p>
        )}
        {result.levelUp && (
          <p className="text-lg font-black mt-2 text-yellow-200">{pickL(COPY.levelUp, lang)} 🚀 Lv.{result.level}</p>
        )}
        {result.combo > 1 && (
          <p className="text-sm font-bold mt-1 opacity-90">🔥 {pickL(COPY.combo, lang)}: {result.combo}</p>
        )}
        <button type="button" onClick={onClose} className="mt-4 kids-sim-btn bg-white/30 px-6">
          {lang === "he" ? "עוד ניסוי! →" : lang === "ar" ? "→!" : "More! →"}
        </button>
      </div>
    </div>
  );
}
