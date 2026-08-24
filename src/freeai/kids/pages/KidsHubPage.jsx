import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Palette, Gamepad2, Images, Sparkles, Star, Heart, Brain, Flame,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import { pickL } from "../lib/locale.js";
import { loadKidsProfile, saveKidsProfile, loadAchievements, loadGallery } from "../lib/kidsStore.js";
import { GRADES } from "../data/curriculum.js";
import { R } from "@/freeai/lib/routes.js";
import { loadStreak, isTodayComplete } from "../lib/streak.js";
import { getWeeklyPath } from "../lib/gradePath.js";

const COPY = {
  title: { he: "FreeAI Kids", en: "FreeAI Kids", ar: "FreeAI Kids" },
  subtitle: {
    he: "AI חכם שיודע הכל — לומדים, יוצרים ומשחקים!",
    en: "Smart AI that knows everything — learn, create & play!",
    ar: "AI ذكي يعرف كل شيء — تعلّم، ابدع والعب!",
  },
  yourName: { he: "איך קוראים לך?", en: "What's your name?", ar: "ما اسمك؟" },
  yourGrade: { he: "באיזו כיתה?", en: "Your grade?", ar: "في أي صف؟" },
  save: { he: "יאללה!", en: "Let's go!", ar: "هيا!" },
  studyDesc: { he: "כל המקצועות — פלאשקארדס ומבחן", en: "All subjects — flashcards & quiz", ar: "كل المواد" },
  createDesc: { he: "סיפורים, דמויות וציורים", en: "Stories, characters & art", ar: "قصص ورسوم" },
  gameDesc: { he: "10 משחקים AI!", en: "10 AI games!", ar: "10 ألعاب!" },
  bodyDesc: { he: "גוף, איברים ובריאות", en: "Body & health", ar: "جسم وصحة" },
  galleryDesc: { he: "כל מה שיצרת", en: "Your creations", ar: "إبداعاتك" },
  chatDesc: { he: "שאל/י הכל — תשובה אמיתית!", en: "Ask anything — real answers!", ar: "اسأل أي شيء!" },
  dailyDesc: { he: "5 דקות לימוד + רצף 🔥", en: "5-min lesson + streak 🔥", ar: "درس 5 دقائق 🔥" },
  achievements: { he: "הישגים", en: "Achievements", ar: "إنجازات" },
  pathTitle: { he: "מסלול השבוע", en: "This week's path", ar: "مسار الأسبوع" },
};

const CARDS = [
  { to: R.kidsChat, icon: Brain, color: "from-violet-600 to-indigo-500", key: "chatDesc", featured: true },
  { to: R.kidsDaily, icon: Flame, color: "from-orange-500 to-red-500", key: "dailyDesc" },
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
  const streak = loadStreak();
  const weeklyPath = getWeeklyPath(grade, lang);
  const todayDone = isTodayComplete();

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
        <div className="text-center space-y-2 kids-fade-in">
          <div className="text-5xl kids-float">🌟</div>
          <h1 className="text-3xl sm:text-4xl font-black drop-shadow-lg">{pickL(COPY.title, lang)}</h1>
          <p className="text-lg opacity-95 max-w-md mx-auto font-semibold">{pickL(COPY.subtitle, lang)}</p>
          {(streak.count || 0) > 0 && (
            <p className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-orange-500/40 font-black text-sm">
              🔥 {streak.count} {lang === "he" ? "ימים ברצף!" : "day streak!"}
            </p>
          )}
        </div>

        {!profile.name && (
          <div className="bg-white/25 backdrop-blur rounded-3xl p-5 space-y-3 border-2 border-white/40 shadow-xl">
            <label className="block text-sm font-bold">{pickL(COPY.yourName, lang)}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-purple-900 font-semibold"
              placeholder={lang === "he" ? "השם שלי" : "My name"}
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
              className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg shadow-lg hover:scale-[1.02] transition-transform">
              {pickL(COPY.save, lang)} ✨
            </button>
          </div>
        )}

        {profile.name && (
          <div className="text-center text-xl font-black">
            {lang === "he" ? `היי ${profile.name}! 👋` : `Hi ${profile.name}! 👋`}
          </div>
        )}

        <Link
          to={R.kidsDaily}
          className={`block p-5 rounded-3xl border-2 border-white/40 shadow-xl transition-transform hover:scale-[1.01] ${
            todayDone ? "bg-green-500/30" : "bg-gradient-to-r from-yellow-400/40 to-orange-500/40 kids-glow"
          }`}
        >
          <div className="flex items-center gap-4">
            <Flame className="w-12 h-12" />
            <div>
              <p className="font-black text-lg">{pickL(COPY.dailyDesc, lang)}</p>
              <p className="text-sm opacity-90">
                {todayDone
                  ? (lang === "he" ? "✅ סיימת היום!" : "✅ Done today!")
                  : (lang === "he" ? "התחל עכשיו →" : "Start now →")}
              </p>
            </div>
          </div>
        </Link>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map(({ to, icon: Icon, color, key, featured }) => (
            <Link
              key={to}
              to={to}
              className={`group block p-5 rounded-3xl bg-gradient-to-br ${color} shadow-xl border-2 border-white/30 hover:scale-[1.03] transition-all ${
                featured ? "ring-2 ring-yellow-300 ring-offset-2 ring-offset-transparent sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <Icon className="w-10 h-10 mb-3 opacity-95" />
              <p className="font-black text-lg leading-snug">{pickL(COPY[key], lang)}</p>
              <Sparkles className="w-5 h-5 mt-2 opacity-70 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        {profile.name && (
          <div className="bg-white/15 rounded-3xl p-4 space-y-2">
            <h2 className="font-black text-sm">{pickL(COPY.pathTitle, lang)}</h2>
            <div className="flex flex-wrap gap-2">
              {weeklyPath.map((w) => (
                <Link key={w.id} to={`${R.kidsStudy}?subject=${w.id}`}
                  className="px-3 py-2 rounded-xl bg-white/20 text-sm font-bold hover:bg-white/30">
                  {w.icon} {w.label}
                </Link>
              ))}
            </div>
          </div>
        )}

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
            </div>
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
