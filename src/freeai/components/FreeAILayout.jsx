import React, { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sparkles, LayoutDashboard, Route, Settings, Mail, ArrowRight, Crown, Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { captureReferral } from "@/freeai/lib/marketingTracker.js";
import { bootstrapFullAccess, getAccessLabel, hasFullAccess } from "@/freeai/lib/demoMode.js";
import { pickL } from "@/freeai/kids/lib/locale.js";

const NAV = [
  { to: "/freeai/kids", label: { he: "Kids 🌟", en: "Kids 🌟", ar: "أطفال 🌟" }, icon: Sparkles, end: false },
  { to: "/freeai/create", label: { he: "יצירה", en: "Create", ar: "إبداع" }, icon: Sparkles, end: false },
  { to: "/freeai/pricing", label: { he: "Pro ₪20", en: "Pro ₪20", ar: "Pro ₪20" }, icon: Crown, end: false },
  { to: "/freeai", label: { he: "בית", en: "Home", ar: "الرئيسية" }, icon: LayoutDashboard, end: true },
  { to: "/freeai/passport", label: { he: "Passport", en: "Passport", ar: "Passport" }, icon: Mail, end: false },
  { to: "/freeai/studio", label: { he: "סטודיו", en: "Studio", ar: "استوديو" }, icon: Route, end: false },
  { to: "/freeai/marketing", label: { he: "שיווק", en: "Marketing", ar: "تسويق" }, icon: Megaphone, end: false },
];

export default function FreeAILayout({ children }) {
  const { lang, dir } = useI18n();
  const locale = lang;
  const Arrow = dir === "rtl" ? ArrowRight : ArrowRight;

  useEffect(() => {
    captureReferral();
    bootstrapFullAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/freeai" className="flex items-center gap-2 font-black text-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              FreeAI Hub
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 mr-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {pickL(label, lang)}
              </NavLink>
            ))}
          </nav>

          {hasFullAccess() && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/40 text-amber-200">
              <Crown className="w-3 h-3" />
              {getAccessLabel(locale)}
            </span>
          )}

          <Link
            to="/"
            className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"
          >
            MedScan
            <Arrow className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      <nav className="fixed bottom-4 inset-x-0 z-30 px-4 sm:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-0.5 p-1 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
          {NAV.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all ${
                  isActive ? "bg-violet-600 text-white" : "text-white/60"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {pickL(label, lang).slice(0, 8)}
            </NavLink>
          ))}
        </div>
      </nav>

      <footer className="max-w-5xl mx-auto px-4 py-8 pb-24 text-center text-xs text-white/30">
        FreeAI Hub — {pickL({ he: "מנצל קרדיטים חינמיים מכל כלי ה-AI", en: "Maximizes free credits across all AI tools", ar: "يستغل credits مجانية من كل أدوات AI" }, lang)}
      </footer>
    </div>
  );
}
