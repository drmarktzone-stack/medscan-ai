import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, BookOpen, Layers, ClipboardList } from "lucide-react";
import { R } from "@/freeai/lib/routes.js";
import { useI18n } from "../../lib/i18n.jsx";
import KidsLayout from "../components/KidsLayout.jsx";
import KidsImage from "../components/KidsImage.jsx";
import KidsMediaReveal from "../components/KidsMediaReveal.jsx";
import SimulationHub from "../components/SimulationHub.jsx";
import VoiceMic, { VoiceInputRow } from "../components/VoiceMic.jsx";
import FlashcardDeck from "../components/FlashcardDeck.jsx";
import SummaryQuiz from "../components/SummaryQuiz.jsx";
import BossBattleQuiz from "../components/BossBattleQuiz.jsx";
import { pickL } from "../lib/locale.js";
import { SUBJECTS, GRADES, getTopicsForGrade, findSubject } from "../data/curriculum.js";
import { loadKidsProfile, saveCreation } from "../lib/kidsStore.js";
import { generateFlashcards, generateSummaryQuiz, generateStudyIntro } from "../lib/kidsEngine.js";
import { topicIllustration } from "../lib/illustrations.js";
import { withTimeout, allSettledWithTimeout } from "../../lib/withTimeout.js";
import MotifIcon from "@/freeai/components/MotifIcon.jsx";

const COPY = {
  title: { he: "לימוד חכם", en: "Smart Study", ar: "دراسة ذكية" },
  pickSubject: { he: "בחר מקצוע", en: "Pick subject", ar: "اختر مادة" },
  pickGrade: { he: "כיתה", en: "Grade", ar: "صف" },
  pickTopic: { he: "נושא", en: "Topic", ar: "موضوع" },
  customTopic: { he: "או כתוב נושא משלך...", en: "Or type your own topic...", ar: "أو اكتب موضوعك..." },
  start: { he: "התחל ללמוד! 📚", en: "Start learning! 📚", ar: "ابدأ التعلّم! 📚" },
  flashcards: { he: "פלאשקארדס", en: "Flashcards", ar: "بطاقات" },
  summaryQuiz: { he: "שאלות סיכום לפרק", en: "Chapter summary quiz", ar: "اختبار مراجعة" },
  loading: { he: "מכין תוכן לימודי...", en: "Preparing study content...", ar: "جاري التحضير..." },
  examMode: { he: "הכנה למבחן 📝", en: "Exam prep 📝", ar: "تحضير للامتحان 📝" },
  bossMode: { he: "מבחן בוס ⚔️", en: "Boss quiz ⚔️", ar: "اختبار زعيم ⚔️" },
  introFallback: {
    he: "בוא נתחיל ללמוד! הפכו כל כרטיס כדי לגלות את התשובה.",
    en: "Let's start learning! Flip each card to reveal the answer.",
    ar: "لنبدأ التعلّم! اقلب كل بطاقة لكشف الإجابة.",
  },
  noCards: {
    he: "לא הצלחנו להכין כרטיסים כרגע. נסה נושא אחר או נסה שוב.",
    en: "Couldn't prepare cards right now. Try another topic or retry.",
    ar: "تعذّر تحضير البطاقات الآن. جرّب موضوعًا آخر.",
  },
};

export default function KidsStudyPage() {
  const { lang } = useI18n();
  const profile = loadKidsProfile();
  const [subjectId, setSubjectId] = useState("math");
  const [grade, setGrade] = useState(profile.grade || "5");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState("");
  const [heroMedia, setHeroMedia] = useState(null);
  const [heroImage, setHeroImage] = useState("");
  const [cards, setCards] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [tab, setTab] = useState("flashcards");
  const [bossMode, setBossMode] = useState(false);
  const [examExtra, setExamExtra] = useState("");
  const [notice, setNotice] = useState("");

  const subject = findSubject(subjectId);
  const topics = getTopicsForGrade(subjectId, grade);
  const topicText = topic.trim() || (topics[0] ? pickL(topics[0], lang) : "");

  const startStudy = async () => {
    if (!topicText) return;
    setLoading(true);
    setCards([]);
    setQuiz(null);
    setIntro("");
    setHeroMedia(null);
    setHeroImage("");

    const subName = subject ? pickL(subject.name, lang) : subjectId;
    const input = { subject: subName, grade, topic: topicText, lang };

    // A provider that stalls or throws must not strand the screen on a spinner;
    // whatever is missing falls back to locally generated study material.
    const [introRes, fcRes] = await allSettledWithTimeout(
      [
        () => generateStudyIntro(input),
        () => generateFlashcards({ ...input, count: 10 }),
      ],
      25000,
    );

    const heroFallback = topicIllustration(topicText, subName);
    setIntro(introRes?.text || pickL(COPY.introFallback, lang));
    setHeroMedia(introRes?.heroMedia || null);
    setHeroImage(introRes?.heroImage || heroFallback);

    const nextCards = fcRes?.cards?.length ? fcRes.cards : [];
    setCards(nextCards);

    // Rather than filling the deck with placeholder answers, say plainly that
    // no AI provider answered — the simulations below still work offline.
    setNotice(nextCards.length ? "" : pickL(COPY.noCards, lang));

    if (nextCards.length) {
      saveCreation({
        type: "study",
        title: `${subName}: ${topicText}`,
        data: { cards: nextCards, subjectId, grade, topic: topicText },
      });
    }
    setLoading(false);
  };

  const loadQuiz = async () => {
    setLoading(true);
    const subName = subject ? pickL(subject.name, lang) : subjectId;
    const topicFull = examExtra.trim()
      ? `${topicText} — ${examExtra.trim()}`
      : topicText;
    const res = await withTimeout(
      generateSummaryQuiz({
        subject: subName,
        grade,
        topic: topicFull,
        lang,
        count: examExtra.trim() ? 10 : 6,
      }),
      12000,
      null,
    );
    if (res?.quiz) {
      setQuiz(res.quiz);
      setTab("quiz");
    }
    setLoading(false);
  };

  return (
    <KidsLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BookOpen className="w-7 h-7" /> {pickL(COPY.title, lang)}
        </h1>

        <div className="bg-white/20 rounded-3xl p-4 space-y-4 border-2 border-white/30">
          <div>
            <label className="text-sm font-bold block mb-2">{pickL(COPY.pickSubject, lang)}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSubjectId(s.id); setTopic(""); }}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${
                    subjectId === s.id ? "bg-white text-purple-700 shadow-lg" : "bg-white/15 hover:bg-white/25"
                  }`}
                >
                  <MotifIcon
                    motif={s.motif}
                    size="sm"
                    accent={subjectId === s.id ? "#7c3aed" : "#ffffff"}
                  />
                  <span className="truncate">{pickL(s.name, lang)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold block mb-1">{pickL(COPY.pickGrade, lang)}</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-purple-900 font-bold">
                {GRADES.map((g) => (
                  <option key={g.id} value={g.id}>{pickL(g, lang)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">{pickL(COPY.pickTopic, lang)}</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-purple-900 font-bold">
                <option value="">{pickL(COPY.customTopic, lang)}</option>
                {topics.map((t, i) => (
                  <option key={i} value={pickL(t, lang)}>{pickL(t, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          <VoiceInputRow
            value={topic}
            onChange={setTopic}
            placeholder={pickL(COPY.customTopic, lang)}
            lang={lang}
          />
          <VoiceInputRow
            value={examExtra}
            onChange={setExamExtra}
            placeholder={pickL(COPY.examMode, lang)}
            lang={lang}
          />
          <div className="flex justify-center pb-1">
            <VoiceMic onText={(t) => setTopic(topic ? `${topic} ${t}` : t)} />
          </div>

          <button type="button" onClick={startStudy} disabled={loading || !topicText}
            className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {pickL(COPY.start, lang)}
          </button>
        </div>

        {heroMedia && (
          <KidsMediaReveal media={heroMedia} lang={lang} single className="kids-pulse-soft" />
        )}
        {!heroMedia && heroImage && (
          <KidsImage src={heroImage} alt={topicText} aspect="video" className="border-4 border-white/30 shadow-xl" />
        )}

        {intro && (
          <div className="bg-white/15 rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap kids-glass-card">{intro}</div>
        )}

        {notice && (
          <div className="kids-glass-card p-4 space-y-3 border-amber-300/40 bg-amber-500/15">
            <p className="font-bold text-sm">{notice}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={startStudy} className="kids-sim-btn">
                {lang === "he" ? "נסה שוב" : "Try again"}
              </button>
              <Link to={R.kidsChat} className="kids-sim-btn">
                {lang === "he" ? "חבר AI" : "Connect AI"}
              </Link>
            </div>
          </div>
        )}

        {(cards.length > 0 || notice) && (
          <SimulationHub subjectId={subjectId} lang={lang} />
        )}

        {cards.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setTab("flashcards")}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 ${
                  tab === "flashcards" ? "bg-white text-purple-700" : "bg-white/20"
                }`}>
                <Layers className="w-4 h-4" /> {pickL(COPY.flashcards, lang)}
              </button>
              <button type="button" onClick={loadQuiz} disabled={loading}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 ${
                  tab === "quiz" ? "bg-white text-purple-700" : "bg-white/20"
                }`}>
                <ClipboardList className="w-4 h-4" /> {pickL(COPY.summaryQuiz, lang)}
              </button>
            </div>

            {tab === "flashcards" && <FlashcardDeck cards={cards} lang={lang} />}
            {tab === "quiz" && quiz && (
              <>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setBossMode(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold ${!bossMode ? "bg-white text-purple-700" : "bg-white/20"}`}>
                    {pickL(COPY.summaryQuiz, lang)}
                  </button>
                  <button type="button" onClick={() => setBossMode(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold ${bossMode ? "bg-white text-purple-700" : "bg-white/20"}`}>
                    {pickL(COPY.bossMode, lang)}
                  </button>
                </div>
                {bossMode ? <BossBattleQuiz quiz={quiz} lang={lang} /> : <SummaryQuiz quiz={quiz} lang={lang} />}
              </>
            )}
            {tab === "quiz" && !quiz && loading && (
              <p className="text-center py-4">{pickL(COPY.loading, lang)}</p>
            )}
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
