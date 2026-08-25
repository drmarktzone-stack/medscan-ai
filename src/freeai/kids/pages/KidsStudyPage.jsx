import React, { useState } from "react";
import { Loader2, BookOpen, Layers, ClipboardList } from "lucide-react";
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

    const [introRes, fcRes] = await Promise.all([
      generateStudyIntro(input),
      generateFlashcards({ ...input, count: 10 }),
    ]);

    setIntro(introRes.text || "");
    setHeroMedia(introRes.heroMedia || null);
    setHeroImage(introRes.heroImage || "");
    setCards(fcRes.cards || []);
    saveCreation({
      type: "study",
      title: `${subName}: ${topicText}`,
      data: { cards: fcRes.cards, subjectId, grade, topic: topicText },
    });
    setLoading(false);
  };

  const loadQuiz = async () => {
    setLoading(true);
    const subName = subject ? pickL(subject.name, lang) : subjectId;
    const topicFull = examExtra.trim()
      ? `${topicText} — ${examExtra.trim()}`
      : topicText;
    const res = await generateSummaryQuiz({
      subject: subName,
      grade,
      topic: topicFull,
      lang,
      count: examExtra.trim() ? 10 : 6,
    });
    setQuiz(res.quiz);
    setTab("quiz");
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
                  className={`p-3 rounded-xl text-sm font-bold transition-all ${
                    subjectId === s.id ? "bg-white text-purple-700 scale-105" : "bg-white/15 hover:bg-white/25"
                  }`}
                >
                  {s.icon} {pickL(s.name, lang)}
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

        {cards.length > 0 && (
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
