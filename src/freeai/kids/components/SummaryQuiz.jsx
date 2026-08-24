import React, { useState } from "react";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { pickL } from "../lib/locale.js";
import { unlockQuizAchievement } from "../lib/kidsStore.js";

const UI = {
  submit: { he: "בדוק", en: "Check", ar: "تحقق" },
  next: { he: "הבא", en: "Next", ar: "التالي" },
  done: { he: "סיימת! 🏆", en: "Done! 🏆", ar: "انتهيت! 🏆" },
  score: { he: "ציון", en: "Score", ar: "النتيجة" },
};

export default function SummaryQuiz({ quiz, lang = "he", onComplete }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showExp, setShowExp] = useState(false);

  const questions = quiz?.questions || [];
  if (!questions.length) return null;

  const q = questions[idx];
  const rtl = lang !== "en";

  const check = () => {
    if (selected === null) return;
    setShowExp(true);
    if (selected === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
      unlockQuizAchievement();
      onComplete?.({ score: score + (selected === q.correct ? 0 : 0), total: questions.length });
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setShowExp(false);
  };

  if (done) {
    const finalScore = score;
    return (
      <div className="text-center space-y-4 py-6" dir={rtl ? "rtl" : "ltr"}>
        <Trophy className="w-16 h-16 mx-auto text-yellow-300" />
        <h3 className="text-2xl font-black">{pickL(UI.done, lang)}</h3>
        <p className="text-xl">{pickL(UI.score, lang)}: {finalScore}/{questions.length}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={rtl ? "rtl" : "ltr"}>
      <div className="text-sm font-bold opacity-80">{idx + 1}/{questions.length}</div>
      <h3 className="text-lg font-bold bg-white/20 rounded-2xl p-4">{q.q}</h3>
      <div className="space-y-2">
        {(q.choices || []).map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={showExp}
            onClick={() => setSelected(i)}
            className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
              selected === i ? "border-white bg-white/30" : "border-white/20 bg-white/10 hover:bg-white/20"
            } ${showExp && i === q.correct ? "!bg-green-400/40 border-green-300" : ""}
            ${showExp && selected === i && i !== q.correct ? "!bg-red-400/40 border-red-300" : ""}`}
          >
            {showExp && i === q.correct && <CheckCircle className="inline w-4 h-4 ml-2" />}
            {showExp && selected === i && i !== q.correct && <XCircle className="inline w-4 h-4 ml-2" />}
            {c}
          </button>
        ))}
      </div>
      {showExp && q.explanation && (
        <p className="text-sm bg-white/15 rounded-xl p-3">{q.explanation}</p>
      )}
      {!showExp ? (
        <button type="button" onClick={check} disabled={selected === null}
          className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg disabled:opacity-50">
          {pickL(UI.submit, lang)}
        </button>
      ) : (
        <button type="button" onClick={next}
          className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg">
          {idx + 1 >= questions.length ? pickL(UI.done, lang) : pickL(UI.next, lang)}
        </button>
      )}
    </div>
  );
}
