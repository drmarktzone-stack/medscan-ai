import React, { useState } from "react";
import { Heart, Zap, Trophy } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { unlockQuizAchievement } from "../lib/kidsStore.js";

const UI = {
  submit: { he: "תקיפה!", en: "Attack!", ar: "هجوم!" },
  next: { he: "הבא", en: "Next", ar: "التالي" },
  victory: { he: "ניצחת! 🏆", en: "Victory! 🏆", ar: "فوز! 🏆" },
  defeat: { he: "נסה שוב!", en: "Try again!", ar: "حاول مجددًا!" },
  boss: { he: "בוס השאלות", en: "Quiz Boss", ar: "زعيم الأسئلة" },
  yourHp: { he: "הכוח שלך", en: "Your power", ar: "قوتك" },
};

export default function BossBattleQuiz({ quiz, lang = "he", onComplete }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [score, setScore] = useState(0);
  const [showExp, setShowExp] = useState(false);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);

  const questions = quiz?.questions || [];
  if (!questions.length) return null;

  const q = questions[idx];
  const rtl = lang !== "en";

  const attack = () => {
    if (selected === null) return;
    const correct = selected === q.correct;
    setShowExp(true);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    if (correct) {
      setBossHp((h) => Math.max(0, h - Math.ceil(100 / questions.length)));
      setScore((s) => s + 1);
    } else {
      setPlayerHp((h) => Math.max(0, h - 20));
    }
  };

  const next = () => {
    if (bossHp <= 0 || idx + 1 >= questions.length) {
      setDone(true);
      if (score + (selected === q.correct ? 0 : 0) >= questions.length / 2) {
        unlockQuizAchievement();
      }
      onComplete?.({ score, total: questions.length, win: bossHp <= 0 || score >= questions.length / 2 });
      return;
    }
    if (playerHp <= 0) {
      setDone(true);
      onComplete?.({ score, total: questions.length, win: false });
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setShowExp(false);
  };

  if (done) {
    const win = score >= Math.ceil(questions.length / 2);
    return (
      <div className="text-center space-y-4 py-6" dir={rtl ? "rtl" : "ltr"}>
        <Trophy className={`w-16 h-16 mx-auto ${win ? "text-yellow-300" : "text-white/50"}`} />
        <h3 className="text-2xl font-black">{win ? pickL(UI.victory, lang) : pickL(UI.defeat, lang)}</h3>
        <p className="text-xl">{score}/{questions.length}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${shake ? "kids-shake" : ""}`} dir={rtl ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center gap-4 bg-white/15 rounded-2xl p-4">
        <div className="flex-1">
          <div className="text-xs font-bold mb-1">{pickL(UI.yourHp, lang)}</div>
          <div className="h-3 rounded-full bg-black/20 overflow-hidden">
            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${playerHp}%` }} />
          </div>
        </div>
        <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
        <div className="flex-1 text-left">
          <div className="text-xs font-bold mb-1 flex items-center gap-1 justify-end">
            <Heart className="w-3 h-3 text-red-400" /> {pickL(UI.boss, lang)}
          </div>
          <div className="h-3 rounded-full bg-black/20 overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${bossHp}%` }} />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold bg-white/20 rounded-2xl p-4">{q.q}</h3>
      <div className="space-y-2">
        {(q.choices || []).map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={showExp}
            onClick={() => setSelected(i)}
            className={`w-full text-right px-4 py-3 rounded-xl font-semibold border-2 transition-all ${
              selected === i ? "border-yellow-300 bg-yellow-400/30 scale-[1.02]" : "border-white/20 bg-white/10"
            } ${showExp && i === q.correct ? "!bg-green-400/50" : ""}
            ${showExp && selected === i && i !== q.correct ? "!bg-red-400/50" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>
      {showExp && q.explanation && (
        <p className="text-sm bg-white/15 rounded-xl p-3">{q.explanation}</p>
      )}
      {!showExp ? (
        <button type="button" onClick={attack} disabled={selected === null}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-lg disabled:opacity-50 shadow-lg">
          ⚔️ {pickL(UI.submit, lang)}
        </button>
      ) : (
        <button type="button" onClick={next}
          className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg">
          {pickL(UI.next, lang)} →
        </button>
      )}
    </div>
  );
}
