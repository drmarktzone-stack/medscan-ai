import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import { pickL } from "../lib/locale.js";
import { R } from "@/freeai/lib/routes.js";
import { loadGallery, loadAchievements, BADGE_MAP } from "../lib/kidsStore.js";

const COPY = {
  title: { he: "היצירות שלי", en: "My Creations", ar: "إبداعاتي" },
  empty: { he: "עדיין לא יצרת — בוא נתחיל!", en: "Nothing yet — let's create!", ar: "لا شيء بعد — لنبدأ!" },
  goCreate: { he: "ליצירה", en: "Create", ar: "إبداع" },
  goStudy: { he: "ללימוד", en: "Study", ar: "دراسة" },
};

const TYPE_ICON = { story: "📚", character: "🦸", drawing: "🎨", game: "🎮", study: "📖", body: "❤️" };

export default function KidsGalleryPage() {
  const { lang } = useI18n();
  const gallery = loadGallery();
  const achievements = loadAchievements();

  return (
    <KidsLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black">{pickL(COPY.title, lang)}</h1>

        {gallery.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">🎨</div>
            <p className="text-lg font-bold">{pickL(COPY.empty, lang)}</p>
            <div className="flex gap-3 justify-center">
              <Link to={R.kidsCreate} className="px-5 py-2 rounded-xl bg-white text-purple-700 font-bold">
                {pickL(COPY.goCreate, lang)}
              </Link>
              <Link to={R.kidsStudy} className="px-5 py-2 rounded-xl bg-white/30 font-bold">
                {pickL(COPY.goStudy, lang)}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {gallery.map((item) => (
              <div key={item.id} className="bg-white/20 rounded-2xl p-4 border-2 border-white/30">
                <div className="text-2xl mb-1">{TYPE_ICON[item.type] || "✨"}</div>
                <h3 className="font-black truncate">{item.title}</h3>
                {item.preview && item.type === "drawing" && (
                  <img src={item.preview} alt="" className="mt-2 rounded-xl w-full h-24 object-cover" />
                )}
                {item.preview && item.type !== "drawing" && (
                  <p className="text-xs opacity-80 mt-1 line-clamp-2">{item.preview}</p>
                )}
                <p className="text-[10px] opacity-60 mt-2">
                  {new Date(item.createdAt).toLocaleDateString(lang === "he" ? "he-IL" : lang === "ar" ? "ar" : "en")}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/15 rounded-3xl p-4">
          <h2 className="font-black mb-3">{lang === "he" ? "כל ההישגים" : lang === "ar" ? "كل الإنجازات" : "All badges"}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.values(BADGE_MAP).map((b) => {
              const unlocked = achievements.some((a) => a.id === b.id);
              return (
                <span
                  key={b.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    unlocked ? "bg-white/30" : "bg-white/10 opacity-50"
                  }`}
                >
                  {b.icon} {pickL(b.name, lang)}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </KidsLayout>
  );
}
