import React, { useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, FlaskConical, Wrench, Star, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import LabExperimentPanel from "../components/labs/LabExperimentPanel.jsx";
import LabCelebrate from "../components/labs/LabCelebrate.jsx";
import { pickL } from "../lib/locale.js";
import { LAB_CATEGORIES, getLabCategory } from "../data/labsCatalog.js";
import { completeExperiment, loadLabProgress, getLabLevel, isExperimentDone } from "../lib/labProgress.js";
import { saveCreation, unlockLabAchievement } from "../lib/kidsStore.js";
import { R } from "@/freeai/lib/routes.js";
import { logActivity } from "../lib/activityLog.js";

const COPY = {
  hubTitle: { he: "מעבדות FreeAI", en: "FreeAI Labs", ar: "مختبرات FreeAI" },
  hubSub: {
    he: "כימיה • פיזיקה • מטבח • עיצוב — ניסויים שממכרים!",
    en: "Chemistry • Physics • Kitchen • Design — addictive experiments!",
    ar: "تجارب ممتعة!",
  },
  tools: { he: "כלי המעבדה", en: "Lab tools", ar: "أدوات" },
  experiments: { he: "ניסויים", en: "Experiments", ar: "تجارب" },
  pickExp: { he: "בחר ניסוי!", en: "Pick an experiment!", ar: "!" },
  level: { he: "רמה", en: "Level", ar: "مستوى" },
  done: { he: "הושלם", en: "Done", ar: "تم" },
};

export default function KidsLabsPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [activeExp, setActiveExp] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const progress = loadLabProgress();
  const lvl = getLabLevel(progress.xp);

  const category = categoryId ? getLabCategory(categoryId) : null;

  const handleComplete = useCallback((xp) => {
    if (!category || !activeExp) return;
    const result = completeExperiment(category.id, activeExp.id, xp || activeExp.xp || 15);
    if (result.firstTime) {
      setCelebrate(result);
      unlockLabAchievement();
      logActivity("lab_complete", { category: category.id, experiment: activeExp.id });
    }
  }, [category, activeExp]);

  const handleSave = useCallback((item) => {
    saveCreation(item);
  }, []);

  // Hub view
  if (!categoryId) {
    return (
      <KidsLayout>
        <div className="space-y-6">
          <div className="kids-glass-card p-5 sm:p-6 text-center space-y-2">
            <div className="text-5xl kids-float">🔬</div>
            <h1 className="text-2xl sm:text-3xl font-black">{pickL(COPY.hubTitle, lang)}</h1>
            <p className="text-sm opacity-90 font-semibold">{pickL(COPY.hubSub, lang)}</p>
          </div>
          <div className="kids-glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="font-black">{pickL(COPY.level, lang)} {lvl.level}</span>
            </div>
            <div className="flex-1 mx-4 h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 transition-all" style={{ width: `${(lvl.into / 50) * 100}%` }} />
            </div>
            <span className="text-sm font-bold">{progress.xp} XP</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {LAB_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`${R.kidsLabs}/${cat.id}`}
                className={`block p-5 rounded-3xl bg-gradient-to-br ${cat.color} border-2 border-white/30 shadow-xl hover:scale-[1.03] transition-all kids-lab-card`}
              >
                <span className="text-4xl">{cat.icon}</span>
                <p className="font-black text-xl mt-2">{pickL(cat.name, lang)}</p>
                <p className="text-sm opacity-90 mt-1">{pickL(cat.tagline, lang)}</p>
                <p className="text-xs font-bold mt-3 opacity-80">{cat.experiments.length} {pickL(COPY.experiments, lang)} ✨</p>
              </Link>
            ))}
          </div>
        </div>
      </KidsLayout>
    );
  }

  if (!category) {
    return (
      <KidsLayout>
        <p className="text-center py-10">
          <Link to={R.kidsLabs} className="underline font-bold">{pickL(COPY.hubTitle, lang)}</Link>
        </p>
      </KidsLayout>
    );
  }

  const exp = activeExp || category.experiments[0];

  return (
    <KidsLayout>
      <LabCelebrate show={!!celebrate} result={celebrate} onClose={() => setCelebrate(null)} lang={lang} />

      <div className="space-y-5">
        <button type="button" onClick={() => (activeExp ? setActiveExp(null) : navigate(R.kidsLabs))}
          className="flex items-center gap-2 text-sm font-bold opacity-90 hover:opacity-100">
          <ArrowRight className="w-4 h-4" /> {pickL(COPY.hubTitle, lang)}
        </button>

        <div className={`rounded-3xl p-5 bg-gradient-to-br ${category.color} border-2 border-white/30 shadow-xl`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-2xl font-black">{pickL(category.name, lang)}</h1>
              <p className="text-sm opacity-90">{pickL(category.tagline, lang)}</p>
            </div>
          </div>
        </div>

        <div className="kids-glass-card p-4">
          <h3 className="font-black text-sm mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> {pickL(COPY.tools, lang)}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {category.tools.map((t) => (
              <span key={t.id} className="shrink-0 px-3 py-2 rounded-xl bg-white/15 text-sm font-bold">
                {t.icon} {pickL(t.name, lang)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-black text-lg mb-3 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" /> {pickL(COPY.experiments, lang)}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {category.experiments.map((e) => {
              const done = isExperimentDone(category.id, e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setActiveExp(e)}
                  className={`shrink-0 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    exp?.id === e.id ? "bg-white text-purple-700 scale-105 shadow-lg" : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {e.icon} {pickL(e.name, lang)}
                  {done && <Star className="w-3 h-3 inline ml-1 text-yellow-300 fill-yellow-300" />}
                </button>
              );
            })}
          </div>
        </div>

        {exp && (
          <LabExperimentPanel
            experimentId={exp.id}
            lang={lang}
            onComplete={handleComplete}
            onSave={handleSave}
          />
        )}
      </div>
    </KidsLayout>
  );
}
