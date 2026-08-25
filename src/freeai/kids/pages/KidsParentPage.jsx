import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import KidsLayout from "../components/KidsLayout.jsx";
import { pickL } from "../lib/locale.js";
import {
  hasParentPin, setParentPin, verifyParentPin, isParentUnlocked, lockParentSession,
} from "../lib/parentMode.js";
import { getActivityStats } from "../lib/activityLog.js";
import { loadStreak } from "../lib/streak.js";
import { loadGallery, loadAchievements, loadKidsProfile } from "../lib/kidsStore.js";
import { R } from "@/freeai/lib/routes.js";
import { Shield, Lock, BarChart3, LogOut } from "lucide-react";

const COPY = {
  title: { he: "אזור הורים", en: "Parent zone", ar: "منطقة الوالدين" },
  pin: { he: "קוד PIN (4–6 ספרות)", en: "PIN code (4–6 digits)", ar: "رمز PIN" },
  enter: { he: "כניסה", en: "Enter", ar: "دخول" },
  setup: { he: "הגדר PIN לראשונה", en: "Set PIN first time", ar: "تعيين PIN" },
  stats: { he: "סטטיסטיקה (7 ימים)", en: "Stats (7 days)", ar: "إحصائيات" },
  hub: { he: "FreeAI Hub — קרדיטים", en: "FreeAI Hub — credits", ar: "FreeAI Hub" },
};

export default function KidsParentPage() {
  const { lang } = useI18n();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(isParentUnlocked());
  const [err, setErr] = useState(false);

  const tryUnlock = () => {
    const ok = verifyParentPin(pin);
    if (ok) {
      setUnlocked(true);
      setErr(false);
    } else {
      setErr(true);
    }
  };

  const setupFirst = () => {
    if (setParentPin(pin)) {
      setUnlocked(true);
    } else setErr(true);
  };

  if (!unlocked) {
    return (
      <KidsLayout>
        <div className="max-w-sm mx-auto space-y-4 bg-white/20 rounded-3xl p-6 border-2 border-white/30">
          <Shield className="w-12 h-12 mx-auto text-white" />
          <h1 className="text-xl font-black text-center">{pickL(COPY.title, lang)}</h1>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 rounded-xl text-purple-900 font-bold text-center text-xl tracking-widest"
            placeholder="••••"
          />
          {err && <p className="text-red-200 text-sm text-center">{lang === "he" ? "PIN שגוי" : "Wrong PIN"}</p>}
          <button
            type="button"
            onClick={hasParentPin() ? tryUnlock : setupFirst}
            className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {hasParentPin() ? pickL(COPY.enter, lang) : pickL(COPY.setup, lang)}
          </button>
        </div>
      </KidsLayout>
    );
  }

  const stats = getActivityStats(7);
  const streak = loadStreak();
  const gallery = loadGallery();
  const achievements = loadAchievements();
  const profile = loadKidsProfile();

  return (
    <KidsLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> {pickL(COPY.title, lang)}
          </h1>
          <button type="button" onClick={() => { lockParentSession(); setUnlocked(false); }}
            className="p-2 rounded-xl bg-white/20">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: lang === "he" ? "שם" : "Name", val: profile.name || "—" },
            { label: lang === "he" ? "כיתה" : "Grade", val: profile.grade },
            { label: lang === "he" ? "רצף" : "Streak", val: `${streak.count || 0} 🔥` },
            { label: lang === "he" ? "יצירות" : "Creations", val: gallery.length },
            { label: lang === "he" ? "הישגים" : "Badges", val: achievements.length },
            { label: lang === "he" ? "פעילות" : "Activity", val: stats.total },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/20 rounded-2xl p-4">
              <div className="text-xs opacity-80">{label}</div>
              <div className="text-xl font-black">{val}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/15 rounded-2xl p-4">
          <h2 className="font-bold mb-2">{pickL(COPY.stats, lang)}</h2>
          <ul className="text-sm space-y-1">
            {Object.entries(stats.byType).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="font-bold">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link to={R.hub}
          className="block text-center py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold">
          {pickL(COPY.hub, lang)} →
        </Link>
      </div>
    </KidsLayout>
  );
}
