import React, { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { BookOpen, Palette, Gamepad2, Images, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { bootstrapFullAccess } from "@/freeai/lib/demoMode.js";
import { pickL } from "../lib/locale.js";
import { R } from "@/freeai/lib/routes.js";

const NAV = [
  { to: R.kids, icon: Home, end: true, label: { he: "בית", en: "Home", ar: "الرئيسية" } },
  { to: R.kidsStudy, icon: BookOpen, end: false, label: { he: "לימוד", en: "Study", ar: "دراسة" } },
  { to: R.kidsBody, icon: HeartIcon, end: false, label: { he: "גוף", en: "Body", ar: "جسم" } },
  { to: R.kidsCreate, icon: Palette, end: false, label: { he: "יצירה", en: "Create", ar: "إبداع" } },
  { to: R.kidsGame, icon: Gamepad2, end: false, label: { he: "משחקים", en: "Games", ar: "ألعاب" } },
  { to: R.kidsGallery, icon: Images, end: false, label: { he: "היצירות שלי", en: "My work", ar: "إبداعاتي" } },
];

function HeartIcon(props) {
  return <span className="text-base leading-none" {...props}>❤️</span>;
}

export default function KidsLayout({ children }) {
  const { lang, dir } = useI18n();

  useEffect(() => { bootstrapFullAccess(); }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white"
      dir={dir}
    >
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to={R.kids} className="flex items-center gap-2 font-black text-lg shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/30 flex items-center justify-center text-xl shadow-lg">
              🌟
            </div>
            <div>
              <div className="text-sm opacity-80 leading-none">FreeAI</div>
              <div className="leading-tight">Kids</div>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {NAV.map(({ to, icon: Icon, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive ? "bg-white text-purple-700 shadow-md" : "text-white/90 hover:bg-white/20"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {pickL(label, lang)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">{children}</main>

      <nav className="fixed bottom-3 inset-x-0 z-30 px-3 sm:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-6 gap-0.5 p-1.5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl">
          {NAV.map(({ to, icon: Icon, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 rounded-xl text-[9px] font-bold ${
                  isActive ? "bg-white text-purple-700" : "text-white"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {pickL(label, lang).slice(0, 8)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
