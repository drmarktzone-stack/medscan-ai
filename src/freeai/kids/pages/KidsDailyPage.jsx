import React, { useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import KidsLayout from "../components/KidsLayout.jsx";
import KidsMagicBackground from "../components/KidsMagicBackground.jsx";
import KidsImage from "../components/KidsImage.jsx";
import FlashcardDeck from "../components/FlashcardDeck.jsx";
import BossBattleQuiz from "../components/BossBattleQuiz.jsx";
import { pickL } from "../lib/locale.js";
import { loadKidsProfile } from "../lib/kidsStore.js";
import {
  runDailyLesson, markDailyComplete, loadStreak, isTodayComplete, getDailyPlan, offlineDailyLesson,
} from "../lib/dailyLesson.js";
import { logActivity } from "../lib/activityLog.js";
import { topicIllustration } from "../lib/illustrations.js";
import { Loader2, Flame, CheckCircle2, Sparkles } from "lucide-react";

const COPY = {
  title: { he: "שיעור יומי ⚡", en: "Daily Lesson ⚡", ar: "درس يومي ⚡" },
  start: { he: "התחל שיעור (5 דק׳)", en: "Start lesson (5 min)", ar: "ابدأ الدرس" },
  done: { he: "סיימת היום! 🔥", en: "Done for today! 🔥", ar: "انتهيت اليوم! 🔥" },
  streak: { he: "רצף ימים", en: "Day streak", ar: "سلسلة أيام" },
  loading: { he: "מכין את השיעור...", en: "Preparing lesson...", ar: "..." },
};

export default function KidsDailyPage() {
  const { lang } = useI18n();
  const profile = loadKidsProfile();
  const streak = loadStreak();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [step, setStep] = useState("intro");
  const todayDone = isTodayComplete();
  const previewPlan = getDailyPlan(profile.grade || "5", lang);

  React.useEffect(() => { logActivity("page_daily"); }, []);

  const start = async () => {
    setLoading(true);
    const grade = profile.grade || "5";
    // The lesson must always open, so the on-device version is the guaranteed
    // result and anything the network adds is an upgrade on top of it.
    let result = offlineDailyLesson(grade, lang);
    try {
      result = (await runDailyLesson({ grade, lang })) || result;
    } catch {
      /* keep the offline lesson */
    } finally {
      setLesson(result);
      setStep("intro");
      setLoading(false);
      logActivity("daily_start", { subject: result.plan?.subject });
    }
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
          <div className="text-5xl kids-float">⚡</div>
          <h1 className="text-3xl font-black">{pickL(COPY.title, lang)}</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/40 border-2 border-orange-300/50 font-bold shadow-lg">
            <Flame className="w-5 h-5 text-orange-200" />
            {pickL(COPY.streak, lang)}: {streak.count || 0} 🔥
          </div>
        </div>

        {!lesson && !loading && !todayDone && (
          <div className="kids-glass-card p-5 space-y-4">
            <KidsImage
              src={topicIllustration(previewPlan.topic, previewPlan.subject)}
              alt={previewPlan.topic}
              aspect="video"
            />
            <p className="text-center font-bold text-lg">
              {previewPlan.subject} — {previewPlan.topic}
            </p>
            <button
              type="button"
              onClick={start}
              className="w-full py-4 rounded-3xl bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-black text-xl shadow-xl hover:scale-[1.01] transition-transform"
            >
              {pickL(COPY.start, lang)} 🚀
            </button>
          </div>
        )}

        {loading && (
          <div className="kids-glass-card p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-yellow-300" />
            <p className="font-bold text-lg">{pickL(COPY.loading, lang)}</p>
            <p className="text-sm opacity-80">{previewPlan.subject} · {previewPlan.topic}</p>
          </div>
        )}

        {todayDone && !lesson && !loading && (
          <div className="text-center py-8 kids-glass-card">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-300 mb-2" />
            <p className="font-black text-lg">{pickL(COPY.done, lang)}</p>
            <button type="button" onClick={start} className="mt-4 px-6 py-2 rounded-2xl bg-white/25 font-bold hover:bg-white/35">
              {lang === "he" ? "עוד פעם?" : "Again?"}
            </button>
          </div>
        )}

        {lesson && step === "intro" && (
          <div className="space-y-4 kids-glass-card p-5">
            <KidsImage src={lesson.heroImage} alt={lesson.plan.topic} aspect="video" />
            <div className="flex items-center gap-2 text-sm font-bold text-yellow-200">
              <Sparkles className="w-4 h-4" />
              {lesson.plan.subject} — {lesson.plan.topic}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{lesson.intro}</p>
            <button type="button" onClick={() => setStep("cards")}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-white to-yellow-100 text-purple-700 font-black shadow-lg">
              {lang === "he" ? "לפלאשקארדס →" : "Flashcards →"}
            </button>
          </div>
        )}

        {lesson && step === "cards" && (
          <div className="space-y-4">
            <FlashcardDeck cards={lesson.cards} lang={lang} />
            <button type="button" onClick={() => setStep("quiz")}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-white to-yellow-100 text-purple-700 font-black shadow-lg">
              {lang === "he" ? "מבחן בוס! ⚔️" : "Boss quiz! ⚔️"}
            </button>
          </div>
        )}

        {lesson && step === "quiz" && (
          <BossBattleQuiz quiz={lesson.quiz} lang={lang} onComplete={finish} />
        )}

        {step === "done" && (
          <div className="text-center py-10 space-y-3 kids-glass-card">
            <div className="text-6xl kids-float">🏆🔥</div>
            <p className="text-2xl font-black">{pickL(COPY.done, lang)}</p>
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
