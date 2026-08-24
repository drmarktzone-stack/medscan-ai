import React, { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BookOpen, Palette, Gamepad2, Images, Home, Coins, Shield, Brain, Flame, FlaskConical,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { bootstrapFullAccess } from "@/freeai/lib/demoMode.js";
import { pickL } from "../lib/locale.js";
import { R } from "@/freeai/lib/routes.js";
import { loadStreak } from "../lib/streak.js";
import { logActivity } from "../lib/activityLog.js";
import KidsMagicBackground from "./KidsMagicBackground.jsx";

const NAV = [
  { to: R.kids, icon: Home, end: true, label: { he: "בית", en: "Home", ar: "الرئيسية" } },
  { to: R.kidsChat, icon: Brain, end: false, label: { he: "שאל AI", en: "Ask AI", ar: "اسأل AI" }, highlight: true },
  { to: R.kidsDaily, icon: Flame, end: false, label: { he: "יומי", en: "Daily", ar: "يومي" } },
  { to: R.kidsLabs, icon: FlaskConical, end: false, label: { he: "מעבדות", en: "Labs", ar: "مختبرات" } },
  { to: R.kidsStudy, icon: BookOpen, end: false, label: { he: "לימוד", en: "Study", ar: "دراسة" } },
  { to: R.kidsBody, icon: HeartIcon, end: false, label: { he: "גוף", en: "Body", ar: "جسم" } },
  { to: R.kidsCreate, icon: Palette, end: false, label: { he: "יצירה", en: "Create", ar: "إبداع" } },
  { to: R.kidsGame, icon: Gamepad2, end: false, label: { he: "משחקים", en: "Games", ar: "ألعاب" } },
  { to: R.kidsGallery, icon: Images, end: false, label: { he: "גלריה", en: "Gallery", ar: "معرض" } },
];

const MOBILE = [R.kids, R.kidsChat, R.kidsDaily, R.kidsLabs, R.kidsStudy, R.kidsCreate];

function HeartIcon(props) {
  return <span className="text-base leading-none" {...props}>❤️</span>;
}

export default function KidsLayout({ children }) {
  const { lang, dir } = useI18n();
  const location = useLocation();
  const streak = loadStreak();

  useEffect(() => {
    bootstrapFullAccess();
  }, []);

  useEffect(() => {
    const seg = location.pathname.split("/").pop() || "kids";
    logActivity(`page_${seg}`);
  }, [location.pathname]);

  const mobileNav = NAV.filter((n) => MOBILE.includes(n.to));

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-x-hidden"
      dir={dir}
    >
      <KidsMagicBackground />
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to={R.kids} className="flex items-center gap-2 font-black text-lg shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/30 flex items-center justify-center text-xl shadow-lg kids-pulse-soft">
              🌟
            </div>
            <div>
              <div className="text-sm opacity-80 leading-none">FreeAI</div>
              <div className="leading-tight">Kids</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 flex-1 flex-wrap">
            {NAV.map(({ to, icon: Icon, end, label, highlight }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white text-purple-700 shadow-md"
                      : highlight
                        ? "bg-yellow-400/30 hover:bg-yellow-400/40"
                        : "text-white/90 hover:bg-white/20"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {pickL(label, lang)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 mr-auto md:mr-0">
            {(streak.count || 0) > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/40 text-xs font-bold">
                🔥 {streak.count}
              </span>
            )}
            <Link to={R.kidsParent} className="p-2 rounded-xl bg-white/20 hover:bg-white/30" title="Parent">
              <Shield className="w-4 h-4" />
            </Link>
            <Link to={R.hub} className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30">
              <Coins className="w-3.5 h-3.5" /> Hub
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 relative z-10">{children}</main>

      <nav className="fixed bottom-3 inset-x-0 z-30 px-2 md:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-6 gap-0.5 p-1.5 rounded-2xl bg-white/25 backdrop-blur-xl border border-white/30 shadow-xl">
          {mobileNav.map(({ to, icon: Icon, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 rounded-xl text-[8px] font-bold ${
                  isActive ? "bg-white text-purple-700 scale-105" : "text-white"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {pickL(label, lang).slice(0, 6)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
