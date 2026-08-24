import React, { useEffect, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Sparkles, LayoutDashboard, Route, Mail, Crown, Megaphone,
  Coins, CalendarRange, Palette,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { captureReferral } from "@/freeai/lib/marketingTracker.js";
import { bootstrapFullAccess, getAccessLabel, hasFullAccess } from "@/freeai/lib/demoMode.js";
import { pickL } from "@/freeai/kids/lib/locale.js";
import { R } from "@/freeai/lib/routes.js";
import { getCreditsDashboard } from "@/freeai/lib/planner.js";

const NAV = [
  { to: R.hub, label: { he: "בית", en: "Home", ar: "الرئيسية" }, icon: LayoutDashboard, end: true },
  { to: R.create, label: { he: "יצירה", en: "Create", ar: "إبداع" }, icon: Sparkles, end: false },
  { to: R.providers, label: { he: "קרדיטים", en: "Credits", ar: "رصيد" }, icon: Coins, end: false },
  { to: R.planner, label: { he: "מתכנן", en: "Planner", ar: "مخطط" }, icon: CalendarRange, end: false },
  { to: R.studio, label: { he: "סטודיו", en: "Studio", ar: "استوديو" }, icon: Palette, end: false },
  { to: R.passport, label: { he: "Passport", en: "Passport", ar: "Passport" }, icon: Mail, end: false },
  { to: R.kids, label: { he: "Kids 🌟", en: "Kids 🌟", ar: "أطفال 🌟" }, icon: Sparkles, end: false },
  { to: R.pricing, label: { he: "Pro ₪20", en: "Pro ₪20", ar: "Pro ₪20" }, icon: Crown, end: false },
  { to: R.marketing, label: { he: "שיווק", en: "Marketing", ar: "تسويق" }, icon: Megaphone, end: false },
];

const MOBILE_NAV = [R.hub, R.create, R.providers, R.kids];

export default function FreeAILayout({ children }) {
  const { lang, dir } = useI18n();
  const dashboard = useMemo(() => getCreditsDashboard(), []);
  const mobileItems = NAV.filter((item) => MOBILE_NAV.includes(item.to));

  useEffect(() => {
    captureReferral();
    bootstrapFullAccess();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to={R.hub} className="flex items-center gap-2 font-black text-lg shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              FreeAI Hub
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 mr-auto flex-wrap">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {pickL(label, lang)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 mr-auto lg:mr-0">
            <Link
              to={R.providers}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
              title={pickL({ he: "קרדיטים חינמיים זמינים", en: "Free credits available", ar: "رصيد مجاني متاح" }, lang)}
            >
              <Coins className="w-3 h-3" />
              {dashboard.grandTotal.toLocaleString()}+
            </Link>
            {hasFullAccess() && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/40 text-amber-200">
                <Crown className="w-3 h-3" />
                {getAccessLabel(lang)}
              </span>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      <nav className="fixed bottom-4 inset-x-0 z-30 px-4 lg:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-0.5 p-1 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10">
          {mobileItems.map(({ to, label, icon: Icon, end }) => (
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
        FreeAI Hub — {pickL({ he: "אגרגטור קרדיטים חינמיים + יצירה + Kids", en: "Free credits aggregator + create + Kids", ar: "مجمع رصيد مجاني + إبداع + أطفال" }, lang)}
      </footer>
    </div>
  );
}
