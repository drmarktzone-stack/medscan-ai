import React, { useState, useEffect, useCallback } from "react";
import {
  Code2, Palette, Package, Rocket, Loader2, CheckCircle2, AlertTriangle,
  Download, ExternalLink, ChevronRight, Sparkles, RefreshCw,
} from "lucide-react";
import { runFullPipeline, runUrgentMode, STAGES } from "../lib/pipelineEngine.js";
import { getQuotaState } from "../lib/projectQuota.js";
import { addSavings, formatSavings, calcProjectSavings } from "../lib/savingsCalculator.js";
import { applyBrandToPrompt, loadBrandKit } from "../lib/brandKit.js";
import { generateAllProviderPrompts } from "../lib/smartPrompt.js";
import { downloadCsv } from "../lib/csvImport.js";
import ResultImage from "./ResultImage.jsx";

const STAGE_META = {
  code: { icon: Code2, labelHe: "קוד", labelEn: "Code", color: "from-blue-500 to-cyan-500" },
  design: { icon: Palette, labelHe: "עיצוב", labelEn: "Design", color: "from-purple-500 to-pink-500" },
  wrap: { icon: Package, labelHe: "עיטוף", labelEn: "Wrap", color: "from-orange-500 to-amber-500" },
  deploy: { icon: Rocket, labelHe: "Deploy", labelEn: "Deploy", color: "from-green-500 to-emerald-500" },
};

export default function PipelineWorkspace({ locale = "he", template, urgent = false, onComplete }) {
  const [description, setDescription] = useState(template?.descHe || "");
  const [running, setRunning] = useState(false);
  const [state, setState] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [error, setError] = useState(null);
  const [providerFlash, setProviderFlash] = useState(null);
  const quota = getQuotaState();

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setState(null);

    const brand = loadBrandKit();
    const input = {
      name: template?.titleHe || description.slice(0, 40) || "My Project",
      description: applyBrandToPrompt(description, brand),
      templateId: template?.id,
      pipeline: template?.pipeline,
      brand,
    };

    try {
      setCurrentStage(STAGES[0]);
      const result = urgent
        ? await runUrgentMode(input)
        : await runFullPipeline(input);

      if (result.ok) {
        setState(result.state);
        const saved = calcProjectSavings(template?.id || "landing");
        addSavings(saved);
        onComplete?.(result);
      } else {
        setError(result.messageHe && locale === "he" ? result.messageHe : (result.messageEn || result.reason));
        if (result.state) setState(result.state);
      }
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setRunning(false);
      setCurrentStage(null);
    }
  }, [description, template, urgent, locale, onComplete]);

  useEffect(() => {
    if (state?.providerLog?.length) {
      const last = state.providerLog[state.providerLog.length - 1];
      const [stage, provider] = last.split(":");
      setProviderFlash({ stage, provider });
      const t = setTimeout(() => setProviderFlash(null), 2000);
      return () => clearTimeout(t);
    }
  }, [state?.providerLog]);

  const downloadProject = () => {
    const html = state?.stageResults?.wrap?.html || state?.stageResults?.deploy?.html;
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Quota badge */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">
          {locale === "he"
            ? `${quota.remaining}/${quota.max} פרויקטים חינמיים נותרו`
            : `${quota.remaining}/${quota.max} free projects remaining`}
        </span>
        {providerFlash && (
          <span className="text-violet-400 text-xs animate-pulse flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {locale === "he" ? "מעבר אוטומטי לספק..." : "Auto-switching provider..."}
          </span>
        )}
      </div>

      {/* Pipeline stages visual */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map((stage, i) => {
          const meta = STAGE_META[stage];
          const Icon = meta.icon;
          const isActive = currentStage === stage;
          const isDone = state?.stageResults?.[stage];
          const isCurrent = state?.currentStage === stage;

          return (
            <React.Fragment key={stage}>
              {i > 0 && <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shrink-0 transition-all ${
                isActive ? "bg-violet-600 text-white scale-105" :
                isDone ? "bg-emerald-500/20 text-emerald-300" :
                isCurrent && state?.status === "paused" ? "bg-amber-500/20 text-amber-300" :
                "bg-white/5 text-white/50"
              }`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                {locale === "he" ? meta.labelHe : meta.labelEn}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Input */}
      {!state && (
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={locale === "he"
              ? "תאר את הפרויקט שלך... למשל: \"חנות אונליין לתכשיטים עם 10 תמונות מוצר\""
              : "Describe your project... e.g. \"Online jewelry store with 10 product images\""}
            className="w-full h-24 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            dir="auto"
            disabled={running}
          />
          <button
            type="button"
            onClick={run}
            disabled={running || (!description.trim() && !template)}
            className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold disabled:opacity-40 hover:opacity-90 flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {locale === "he" ? `שלב ${STAGE_META[currentStage]?.labelHe || "..."}...` : `Stage ${currentStage || "..."}...`}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {urgent
                  ? (locale === "he" ? "🚨 מצב דחוף — 10 דקות" : "🚨 Urgent — 10 min")
                  : (locale === "he" ? "▶ בנה פרויקט שלם — חינם" : "▶ Build full project — free")}
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-500/10 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p>{error}</p>
            {state?.status === "paused" && (
              <button type="button" onClick={run} className="mt-2 text-violet-400 underline text-xs">
                {locale === "he" ? "נסה שוב" : "Retry"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results per stage */}
      {state?.stageResults && (
        <div className="space-y-4">
          {STAGES.map((stage) => {
            const result = state.stageResults[stage];
            if (!result) return null;
            const meta = STAGE_META[stage];

            return (
              <div key={stage} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {locale === "he" ? meta.labelHe : meta.labelEn}
                  {result.provider && (
                    <span className="text-xs text-white/40 font-normal">via {result.provider}</span>
                  )}
                </h3>

                {stage === "code" && result.code && (
                  <div className="relative">
                    <pre className="text-xs text-green-300 bg-black/40 rounded-lg p-3 overflow-x-auto max-h-48">
                      {result.code.slice(0, 800)}{result.code.length > 800 ? "..." : ""}
                    </pre>
                    {result.needsBrowser && result.externalUrl && (
                      <a href={result.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400">
                        <ExternalLink className="w-3 h-3" />
                        {locale === "he" ? "פתח בכלי מתקדם" : "Open in advanced tool"}
                      </a>
                    )}
                  </div>
                )}

                {stage === "design" && result.images?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {result.images.map((img) => (
                      <ResultImage
                        key={img.id}
                        src={img.url}
                        fallbackUrl={img.fallbackUrl}
                        prompt={img.prompt}
                        className="rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {stage === "wrap" && (
                  <p className="text-sm text-white/60">
                    {locale === "he" ? `עיצוב: ${result.theme}, RTL: ${result.rtl ? "כן" : "לא"}` : `Theme: ${result.theme}`}
                  </p>
                )}

                {stage === "deploy" && (
                  <div className="text-sm text-white/70 whitespace-pre-line">
                    {locale === "he" ? result.instructionsHe : result.instructionsEn}
                    {result.deployUrl && (
                      <a href={result.deployUrl} target="_blank" rel="noopener noreferrer"
                        className="block mt-2 text-violet-400">
                        → {result.deployUrl}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {state.status === "completed" && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-emerald-300 text-lg">
                {locale === "he" ? "הפרויקט מוכן!" : "Project ready!"}
              </h3>
              {state.savingsIls > 0 && (
                <p className="text-emerald-400/80 text-sm mt-1">
                  {locale === "he" ? "חסכת" : "You saved"} {formatSavings(state.savingsIls, locale)}
                </p>
              )}
              <div className="flex gap-2 justify-center mt-4">
                <button type="button" onClick={downloadProject}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {locale === "he" ? "הורד HTML" : "Download HTML"}
                </button>
                <button type="button" onClick={() => { setState(null); setError(null); }}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/70 text-sm">
                  {locale === "he" ? "פרויקט חדש" : "New project"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ComparePromptsPanel({ input, locale = "he", taskType = "image" }) {
  const prompts = generateAllProviderPrompts(input || "modern product photo", taskType);
  if (!input) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <h4 className="text-sm font-bold text-white">
        {locale === "he" ? "Prompt מותאם לכל ספק:" : "Prompt per provider:"}
      </h4>
      {prompts.map((p) => (
        <div key={p.providerId} className="text-xs bg-black/20 rounded-lg p-2">
          <span className="text-violet-400 font-medium">{p.providerId}:</span>
          <span className="text-white/70 mr-2">{p.prompt}</span>
        </div>
      ))}
    </div>
  );
}

export function downloadProjectHtml(html, name = "index.html") {
  downloadCsv(html, name);
}
