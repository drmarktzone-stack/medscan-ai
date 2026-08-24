import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Palette, Gamepad2, Images, Sparkles, Star, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import { pickL } from "../lib/locale.js";
import { loadKidsProfile, saveKidsProfile, loadAchievements, loadGallery } from "../lib/kidsStore.js";
import { GRADES } from "../data/curriculum.js";

const COPY = {
  title: { he: "FreeAI Kids", en: "FreeAI Kids", ar: "FreeAI Kids" },
  subtitle: {
    he: "לומדים, יוצרים ומשחקים עם AI חכם — בקלות!",
    en: "Learn, create & play with smart AI — the easy way!",
    ar: "تعلّم، ابدع والعب مع AI ذكي — بسهولة!",
  },
  yourName: { he: "איך קוראים לך?", en: "What's your name?", ar: "ما اسمك؟" },
  yourGrade: { he: "באיזו כיתה?", en: "Your grade?", ar: "في أي صف؟" },
  save: { he: "יאללה!", en: "Let's go!", ar: "هيا!" },
  studyDesc: { he: "כל המקצועות — פלאשקארדס ומבחן סיכום", en: "All subjects — flashcards & summary quiz", ar: "كل المواد — بطاقات واختبار" },
  createDesc: { he: "סיפורים, דמויות וציורים", en: "Stories, characters & drawings", ar: "قصص وشخصيات ورسوم" },
  gameDesc: { he: "בנה משחק משלך!", en: "Build your own game!", ar: "ابنِ لعبتك!" },
  bodyDesc: { he: "גוף, איברים ובריאות — ציורים חמודים", en: "Body, organs & health — cute art", ar: "جسم وأعضاء وصحة — رسوم لطيفة" },
  galleryDesc: { he: "כל מה שיצרת", en: "Everything you made", ar: "كل ما أبدعت" },
  achievements: { he: "הישגים", en: "Achievements", ar: "إنجازات" },
  aiTip: {
    he: "💡 כל יום תיצור משהו — כך תלמד לעבוד עם AI כמו מקצוען!",
    en: "💡 Create something every day — that's how you master AI!",
    ar: "💡 ابدع كل يوم — هكذا تتقن AI!",
  },
};

import { R } from "@/freeai/lib/routes.js";

const CARDS = [
  { to: R.kidsStudy, icon: BookOpen, color: "from-blue-500 to-cyan-400", key: "studyDesc" },
  { to: R.kidsBody, icon: Heart, color: "from-red-400 to-rose-500", key: "bodyDesc" },
  { to: R.kidsCreate, icon: Palette, color: "from-pink-500 to-rose-400", key: "createDesc" },
  { to: R.kidsGame, icon: Gamepad2, color: "from-amber-500 to-orange-400", key: "gameDesc" },
  { to: R.kidsGallery, icon: Images, color: "from-violet-500 to-purple-400", key: "galleryDesc" },
];

export default function KidsHubPage() {
  const { lang } = useI18n();
  const [profile, setProfile] = useState(() => loadKidsProfile());
  const [name, setName] = useState(profile.name || "");
  const [grade, setGrade] = useState(profile.grade || "5");
  const achievements = loadAchievements();
  const gallery = loadGallery();

  useEffect(() => {
    if (profile.name) setName(profile.name);
  }, [profile.name]);

  const saveProfile = () => {
    const p = saveKidsProfile({ name: name.trim() || "חבר/ה", grade });
    setProfile(p);
  };

  return (
    <KidsLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🌟</div>
          <h1 className="text-3xl sm:text-4xl font-black drop-shadow">{pickL(COPY.title, lang)}</h1>
          <p className="text-lg opacity-90 max-w-md mx-auto">{pickL(COPY.subtitle, lang)}</p>
        </div>

        {!profile.name && (
          <div className="bg-white/20 backdrop-blur rounded-3xl p-5 space-y-3 border-2 border-white/30">
            <label className="block text-sm font-bold">{pickL(COPY.yourName, lang)}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-purple-900 font-semibold"
              placeholder={lang === "he" ? "השם שלי" : lang === "ar" ? "اسمي" : "My name"}
            />
            <label className="block text-sm font-bold">{pickL(COPY.yourGrade, lang)}</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-purple-900 font-bold"
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>{pickL(g, lang)}</option>
              ))}
            </select>
            <button type="button" onClick={saveProfile}
              className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg shadow-lg">
              {pickL(COPY.save, lang)} ✨
            </button>
          </div>
        )}

        {profile.name && (
          <div className="text-center text-xl font-black">
            {lang === "he" ? `היי ${profile.name}! 👋` : lang === "ar" ? `مرحباً ${profile.name}! 👋` : `Hi ${profile.name}! 👋`}
            <span className="block text-sm font-normal opacity-80 mt-1">
              {pickL(GRADES.find((g) => g.id === profile.grade) || GRADES[4], lang)}
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map(({ to, icon: Icon, color, key }) => (
            <Link
              key={to}
              to={to}
              className={`group block p-5 rounded-3xl bg-gradient-to-br ${color} shadow-xl border-2 border-white/30 hover:scale-[1.02] transition-transform`}
            >
              <Icon className="w-10 h-10 mb-3 opacity-90" />
              <p className="font-black text-lg leading-snug">{pickL(COPY[key], lang)}</p>
              <Sparkles className="w-5 h-5 mt-2 opacity-60 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        <p className="text-center text-sm font-semibold bg-white/15 rounded-2xl py-3 px-4">
          {pickL(COPY.aiTip, lang)}
        </p>

        {(achievements.length > 0 || gallery.length > 0) && (
          <div className="bg-white/15 rounded-3xl p-4 space-y-3">
            <h2 className="font-black flex items-center gap-2">
              <Star className="w-5 h-5" /> {pickL(COPY.achievements, lang)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <span key={a.id} className="px-3 py-1.5 rounded-full bg-white/25 text-sm font-bold">
                  {a.icon} {pickL(a.name, lang)}
                </span>
              ))}
              {gallery.length > 0 && (
                <span className="px-3 py-1.5 rounded-full bg-white/25 text-sm font-bold">
                  🎨 {gallery.length} {lang === "he" ? "יצירות" : lang === "ar" ? "إبداعات" : "creations"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
