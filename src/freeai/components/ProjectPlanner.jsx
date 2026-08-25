import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Route, CheckCircle2, AlertTriangle, ExternalLink, Play, Loader2 } from "lucide-react";
import { parseProjectDescription, buildProjectPlan } from "../lib/planner.js";
import { useCredits } from "../lib/creditStore.js";
import { generatePollinationsBatch } from "../lib/generators/pollinations.js";
import { withImageFallback } from "../lib/visualFallback.js";
import ResultImage from "./ResultImage.jsx";

export default function ProjectPlanner({ locale = "he" }) {
  const [searchParams] = useSearchParams();
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [generatingStep, setGeneratingStep] = useState(null);
  const [stepResults, setStepResults] = useState({});

  const applyPlan = useCallback((tasks) => {
    setPlan(buildProjectPlan(tasks, locale));
    setCompletedSteps(new Set());
    setStepResults({});
  }, [locale]);

  // Studio hands off a parsed CSV catalog through the URL so the planner can
  // turn it straight into a credit allocation.
  useEffect(() => {
    const raw = searchParams.get("tasks");
    if (!raw) return;
    try {
      const tasks = JSON.parse(raw);
      if (!Array.isArray(tasks) || tasks.length === 0) return;
      setDescription(
        locale === "he"
          ? `קטלוג מיובא — ${tasks.length} פריטים`
          : `Imported catalog — ${tasks.length} items`,
      );
      applyPlan(tasks);
    } catch {
      /* malformed hand-off: fall back to manual entry */
    }
  }, [searchParams, applyPlan, locale]);

  const analyze = () => {
    applyPlan(parseProjectDescription(description));
  };

  const markDone = (step) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const runInApp = async (stepData) => {
    if (!stepData.canGenerateHere || !stepData.prompt) return;
    setGeneratingStep(stepData.step);
    try {
      useCredits(stepData.providerId, stepData.units);
      const batch = generatePollinationsBatch(stepData.prompt, stepData.units);
      setStepResults((prev) => ({ ...prev, [stepData.step]: batch.images.map((img) => withImageFallback(img, stepData.prompt)) }));
      markDone(stepData.step);
    } finally {
      setGeneratingStep(null);
    }
  };

  const progress = useMemo(() => {
    if (!plan?.steps?.length) return 0;
    return Math.round((completedSteps.size / plan.steps.length) * 100);
  }, [plan, completedSteps]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-fuchsia-400" />
        <h2 className="text-lg font-bold text-white">
          {locale === "he" ? "מתכנן פרויקט חינמי" : "Free project planner"}
        </h2>
      </div>

      <p className="text-sm text-white/60 mb-4">
        {locale === "he"
          ? "תאר את הפרויקט — למשל: \"10 תמונות מוצר + 2 וידאו פרסומת\". הכלי יבנה תוכנית שמנצלת את כל הקרדיטים החינמיים."
          : "Describe your project — e.g. \"10 product images + 2 promo videos\". The tool builds a plan using all free credits."}
      </p>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={locale === "he"
          ? "10 תמונות לפוסטים באינסטגרם + עיצוב באנר + וידאו קצר מהתמונות"
          : "10 Instagram post images + banner design + short video from images"}
        className="w-full h-20 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
        dir="auto"
      />

      <button
        type="button"
        onClick={analyze}
        disabled={!description.trim()}
        className="mt-3 px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90"
      >
        {locale === "he" ? "בנה תוכנית" : "Build plan"}
      </button>

      {plan && (
        <div className="mt-6 space-y-4">
          <div className={`flex items-start gap-2 text-sm rounded-xl p-3 ${plan.fullyCovered ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
            {plan.fullyCovered ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{locale === "he" ? plan.summaryHe : plan.summaryEn}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white/60">{progress}%</span>
          </div>

          <ol className="space-y-3">
            {plan.steps.map((step) => {
              const done = completedSteps.has(step.step);
              const results = stepResults[step.step];
              return (
                <li
                  key={step.step}
                  className={`rounded-xl border p-4 transition-all ${done ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-black/20"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"}`}>
                      {done ? "✓" : step.step}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">
                        {step.units}× {step.taskType} → {step.providerName}
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {locale === "he" ? step.instructionHe : step.instructionEn}
                      </p>
                      <div className="text-[10px] text-white/40 mt-1">
                        {step.creditCost} {locale === "he" ? "קרדיטים" : "credits"} · {step.accessMode}
                      </div>

                      {results?.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {results.map((img) => (
                            <ResultImage
                              key={img.id}
                              src={img.url}
                              fallbackUrl={img.fallbackUrl}
                              prompt={img.prompt}
                              className="w-20 h-20 rounded-lg shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {step.canGenerateHere && !done && (
                          <button
                            type="button"
                            onClick={() => runInApp(step)}
                            disabled={generatingStep === step.step}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-500 disabled:opacity-50"
                          >
                            {generatingStep === step.step
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Play className="w-3 h-3" />}
                            {locale === "he" ? "יצור כאן" : "Generate here"}
                          </button>
                        )}
                        {step.generateUrl && !step.canGenerateHere && (
                          <a
                            href={step.generateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {locale === "he" ? "פתח כלי" : "Open tool"}
                          </a>
                        )}
                        {!done && (
                          <button
                            type="button"
                            onClick={() => markDone(step.step)}
                            className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-xs hover:bg-white/5"
                          >
                            {locale === "he" ? "סמן בוצע" : "Mark done"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {plan.gaps.length > 0 && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <h4 className="text-sm font-bold text-red-300 mb-2">
                {locale === "he" ? "פערים בכיסוי" : "Coverage gaps"}
              </h4>
              {plan.gaps.map((g, i) => (
                <p key={i} className="text-xs text-red-200/80">
                  {locale === "he" ? g.messageHe : g.messageEn}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
