import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import KidsMagicBackground from "../components/KidsMagicBackground.jsx";
import KidsImage from "../components/KidsImage.jsx";
import KidsMediaReveal from "../components/KidsMediaReveal.jsx";
import FlashcardDeck from "../components/FlashcardDeck.jsx";
import BossBattleQuiz from "../components/BossBattleQuiz.jsx";
import SpeakingAvatar from "../components/SpeakingAvatar.jsx";
import { pickL } from "../lib/locale.js";
import { loadKidsProfile } from "../lib/kidsStore.js";
import { runDailyLesson, markDailyComplete, loadStreak, isTodayComplete } from "../lib/dailyLesson.js";
import { logActivity } from "../lib/activityLog.js";
import { Loader2, Flame, CheckCircle2 } from "lucide-react";

const COPY = {
  title: { he: "שיעור יומי ⚡", en: "Daily Lesson ⚡", ar: "درس يومي ⚡" },
  start: { he: "התחל שיעור (5 דק׳)", en: "Start lesson (5 min)", ar: "ابدأ الدرس" },
  done: { he: "סיימת היום! 🔥", en: "Done for today! 🔥", ar: "انتهيت اليوم! 🔥" },
  streak: { he: "רצף ימים", en: "Day streak", ar: "سلسلة أيام" },
};

export default function KidsDailyPage() {
  const { lang } = useI18n();
  const profile = loadKidsProfile();
  const streak = loadStreak();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [step, setStep] = useState("intro");
  const todayDone = isTodayComplete();

  React.useEffect(() => { logActivity("page_daily"); }, []);

  const start = async () => {
    setLoading(true);
    const result = await runDailyLesson({ grade: profile.grade || "5", lang });
    setLesson(result);
    setStep("intro");
    setLoading(false);
    logActivity("daily_start", { subject: result.plan?.subject });
  };

  const finish = () => {
    markDailyComplete();
    logActivity("daily_complete");
    setStep("done");
  };

  return (
    <KidsLayout>
      <KidsMagicBackground />
      <div className="relative z-10 space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">{pickL(COPY.title, lang)}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/30 border border-orange-300/40 font-bold">
            <Flame className="w-5 h-5 text-orange-300" />
            {pickL(COPY.streak, lang)}: {streak.count || 0} 🔥
          </div>
        </div>

        {!lesson && !todayDone && (
          <button
            type="button"
            disabled={loading}
            onClick={start}
            className="w-full py-4 rounded-3xl bg-white text-purple-700 font-black text-xl shadow-xl hover:scale-[1.01] transition-transform disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : pickL(COPY.start, lang)}
          </button>
        )}

        {todayDone && !lesson && (
          <div className="text-center py-8 bg-white/20 rounded-3xl">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-2" />
            <p className="font-black text-lg">{pickL(COPY.done, lang)}</p>
            <button type="button" onClick={start} className="mt-4 text-sm underline opacity-80">
              {lang === "he" ? "עוד פעם?" : "Again?"}
            </button>
          </div>
        )}

        {lesson && step === "intro" && (
          <div className="space-y-4 bg-white/20 rounded-3xl p-5 kids-glass-card">
            {lesson.heroMedia ? (
              <KidsMediaReveal media={lesson.heroMedia} lang={lang} single />
            ) : lesson.heroImage ? (
              <KidsImage src={lesson.heroImage} alt={lesson.plan.topic} aspect="video" />
            ) : null}
            <SpeakingAvatar text={lesson.intro} lang={lang} />
            <p className="font-bold text-lg">{lesson.plan.subject} — {lesson.plan.topic}</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{lesson.intro}</p>
            <button type="button" onClick={() => setStep("cards")}
              className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black">
              {lang === "he" ? "לפלאשקארדס →" : "Flashcards →"}
            </button>
          </div>
        )}

        {lesson && step === "cards" && (
          <div className="space-y-4">
            <FlashcardDeck cards={lesson.cards} lang={lang} />
            <button type="button" onClick={() => setStep("quiz")}
              className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black">
              {lang === "he" ? "מבחן בוס! ⚔️" : "Boss quiz! ⚔️"}
            </button>
          </div>
        )}

        {lesson && step === "quiz" && (
          <BossBattleQuiz quiz={lesson.quiz} lang={lang} onComplete={finish} />
        )}

        {step === "done" && (
          <div className="text-center py-10 space-y-3">
            <div className="text-6xl">🏆🔥</div>
            <p className="text-2xl font-black">{pickL(COPY.done, lang)}</p>
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
