import React, { useState } from "react";
import { Loader2, Heart, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import VoiceMic, { VoiceInputRow } from "../components/VoiceMic.jsx";
import FlashcardDeck from "../components/FlashcardDeck.jsx";
import { pickL } from "../lib/locale.js";
import { BODY_CATEGORIES } from "../data/anatomyData.js";
import { loadKidsProfile, saveCreation } from "../lib/kidsStore.js";
import { generateBodyLesson, generateBodyFlashcards } from "../lib/kidsEngine.js";

const COPY = {
  title: { he: "גוף האדם", en: "Human Body", ar: "جسم الإنسان" },
  subtitle: {
    he: "למד על חלקי הגוף, איברים ובריאות — עם ציורים חמודים!",
    en: "Learn body parts, organs & health — with cute drawings!",
    ar: "تعلّم أجزاء الجسم والأعضاء والصحة — برسوم لطيفة!",
  },
  explore: { he: "גלה וצייר", en: "Explore & draw", ar: "استكشف وارسم" },
  flashcards: { he: "פלאשקארדס לקטגוריה", en: "Category flashcards", ar: "بطاقات للفئة" },
  askVoice: { he: "שאל בקול: \"מה זה הלב?\"", en: "Ask aloud: \"What is the heart?\"", ar: "اسأل: \"ما هو القلب؟\"" },
  loading: { he: "מצייר ומסביר...", en: "Drawing & explaining...", ar: "يرسم ويشرح..." },
  notMedical: {
    he: "⚕️ לימוד בלבד — לא אבחנה. בכאב — פנו לרופא/ה.",
    en: "⚕️ Learning only — not a diagnosis. If in pain, see a doctor.",
    ar: "⚕️ للتعلم فقط — ليس تشخيصاً. عند الألم راجع الطبيب.",
  },
};

export default function KidsBodyPage() {
  const { lang } = useI18n();
  const profile = loadKidsProfile();
  const [categoryId, setCategoryId] = useState("parts");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState(null);
  const [cards, setCards] = useState(null);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [tab, setTab] = useState("explore");

  const category = BODY_CATEGORIES.find((c) => c.id === categoryId);

  const exploreItem = async (item) => {
    setSelected(item);
    setLoading(true);
    setLesson(null);
    const res = await generateBodyLesson({
      item,
      grade: profile.grade || "5",
      lang,
    });
    setLesson(res);
    saveCreation({
      type: "body",
      title: pickL(item.name, lang),
      preview: res.explanation?.slice(0, 80),
      data: { item, lesson: res },
    });
    setLoading(false);
  };

  const loadCategoryCards = async () => {
    if (!category) return;
    setLoading(true);
    const res = await generateBodyFlashcards({
      categoryName: pickL(category.name, lang),
      items: category.items,
      grade: profile.grade || "5",
      lang,
    });
    setCards(res.cards);
    setTab("cards");
    setLoading(false);
  };

  const findItemByVoice = (text) => {
    const q = text.toLowerCase();
    for (const cat of BODY_CATEGORIES) {
      for (const item of cat.items) {
        const names = [item.name.he, item.name.en, item.name.ar, item.id].join(" ").toLowerCase();
        if (names.includes(q) || q.split(" ").some((w) => w.length > 2 && names.includes(w))) {
          setCategoryId(cat.id);
          exploreItem(item);
          return;
        }
      }
    }
    setVoiceQuery(text);
  };

  return (
    <KidsLayout>
      <div className="space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black flex items-center justify-center gap-2">
            <Heart className="w-7 h-7" /> {pickL(COPY.title, lang)}
          </h1>
          <p className="text-sm opacity-90">{pickL(COPY.subtitle, lang)}</p>
          <p className="text-xs opacity-75">{pickL(COPY.notMedical, lang)}</p>
        </div>

        <div className="flex flex-col items-center gap-2 bg-white/15 rounded-2xl p-4">
          <p className="text-xs font-bold">{pickL(COPY.askVoice, lang)}</p>
          <VoiceInputRow
            value={voiceQuery}
            onChange={setVoiceQuery}
            placeholder={pickL(COPY.askVoice, lang)}
            lang={lang}
          />
          {voiceQuery && (
            <button type="button" onClick={() => findItemByVoice(voiceQuery)}
              className="text-sm font-bold px-4 py-2 rounded-xl bg-white text-purple-700">
              🔍 {lang === "he" ? "חפש" : lang === "ar" ? "ابحث" : "Search"}
            </button>
          )}
          <VoiceMic onText={findItemByVoice} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {BODY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setCategoryId(cat.id); setSelected(null); setLesson(null); setTab("explore"); }}
              className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r ${cat.color} ${
                categoryId === cat.id ? "ring-4 ring-white scale-105" : "opacity-80"
              }`}
            >
              {cat.icon} {pickL(cat.name, lang)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setTab("explore")}
            className={`flex-1 py-2 rounded-xl font-bold ${tab === "explore" ? "bg-white text-purple-700" : "bg-white/20"}`}>
            {pickL(COPY.explore, lang)}
          </button>
          <button type="button" onClick={loadCategoryCards} disabled={loading}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 ${
              tab === "cards" ? "bg-white text-purple-700" : "bg-white/20"
            }`}>
            <Layers className="w-4 h-4" /> {pickL(COPY.flashcards, lang)}
          </button>
        </div>

        {tab === "explore" && category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {category.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => exploreItem(item)}
                className={`p-4 rounded-2xl text-right transition-all border-2 ${
                  selected?.id === item.id
                    ? "bg-white text-purple-800 border-white scale-105 shadow-xl"
                    : "bg-white/20 border-white/30 hover:bg-white/30"
                }`}
              >
                <div className="text-3xl mb-1">{item.icon}</div>
                <div className="font-black text-sm">{pickL(item.name, lang)}</div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-bold">{pickL(COPY.loading, lang)}</span>
          </div>
        )}

        {tab === "explore" && lesson && !loading && (
          <div className="bg-white/95 text-purple-900 rounded-3xl p-5 space-y-4 shadow-xl">
            <h2 className="text-xl font-black flex items-center gap-2">
              {selected?.icon} {lesson.name}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {(lesson.images || []).map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={lesson.name}
                  className="rounded-2xl w-full aspect-square object-cover border-4 border-purple-200"
                />
              ))}
            </div>
            <p className="leading-relaxed whitespace-pre-wrap text-base">{lesson.explanation}</p>
          </div>
        )}

        {tab === "cards" && cards && !loading && (
          <FlashcardDeck cards={cards} lang={lang} />
        )}
      </div>
    </KidsLayout>
  );
}
