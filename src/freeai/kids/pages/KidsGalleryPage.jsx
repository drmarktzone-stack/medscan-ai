import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import { pickL } from "../lib/locale.js";
import { R } from "@/freeai/lib/routes.js";
import { loadGallery, loadAchievements, BADGE_MAP } from "../lib/kidsStore.js";
import { Share2, X, Play } from "lucide-react";

const COPY = {
  title: { he: "היצירות שלי", en: "My Creations", ar: "إبداعاتي" },
  empty: { he: "עדיין לא יצרת — בוא נתחיל!", en: "Nothing yet — let's create!", ar: "لا شيء بعد — لنبدأ!" },
  goCreate: { he: "ליצירה", en: "Create", ar: "إبداع" },
  goStudy: { he: "ללימוד", en: "Study", ar: "دراسة" },
  open: { he: "פתח", en: "Open", ar: "افتح" },
  share: { he: "שתף", en: "Share", ar: "شارك" },
};

const TYPE_ICON = { story: "📚", character: "🦸", drawing: "🎨", game: "🎮", study: "📖", body: "❤️" };

export default function KidsGalleryPage() {
  const { lang } = useI18n();
  const gallery = loadGallery();
  const achievements = loadAchievements();
  const [view, setView] = useState(null);

  const shareItem = (item) => {
    const text = encodeURIComponent(`${item.title} — FreeAI Kids`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <KidsLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black">{pickL(COPY.title, lang)}</h1>

        {view && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setView(null)}>
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-black text-purple-900 truncate">{view.title}</h3>
                <button type="button" onClick={() => setView(null)} className="p-2 rounded-full bg-gray-100">
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                {view.type === "game" && view.data?.html && (
                  <iframe title={view.title} srcDoc={view.data.html} sandbox="allow-scripts" className="w-full h-80 rounded-xl border" />
                )}
                {view.type === "story" && (
                  <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{view.data?.story || view.preview}</p>
                )}
                {view.type === "drawing" && view.preview && (
                  <img src={view.preview} alt="" className="w-full rounded-xl" />
                )}
                {view.type === "character" && view.preview && (
                  <div className="space-y-2">
                    <img src={view.preview} alt="" className="w-full rounded-xl" />
                    <p className="text-sm text-gray-600">{view.data?.description}</p>
                  </div>
                )}
                {!["game", "story", "drawing", "character"].includes(view.type) && (
                  <p className="text-sm text-gray-700">{view.preview || JSON.stringify(view.data)?.slice(0, 500)}</p>
                )}
              </div>
            </div>
          </div>
        )}

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
                {item.preview && !["drawing", "character"].includes(item.type) && (
                  <p className="text-xs opacity-80 mt-1 line-clamp-2">{item.preview}</p>
                )}
                <p className="text-[10px] opacity-60 mt-2">
                  {new Date(item.createdAt).toLocaleDateString(lang === "he" ? "he-IL" : "en")}
                </p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setView(item)}
                    className="flex-1 py-2 rounded-xl bg-white text-purple-700 text-xs font-bold flex items-center justify-center gap-1">
                    <Play className="w-3 h-3" /> {pickL(COPY.open, lang)}
                  </button>
                  <button type="button" onClick={() => shareItem(item)}
                    className="px-3 py-2 rounded-xl bg-green-500/40 font-bold">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
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
