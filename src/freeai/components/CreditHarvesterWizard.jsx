import React, { useState, useEffect, useCallback } from "react";
import {
  Mail, Loader2, CheckCircle2, ExternalLink, Copy, ChevronRight,
  Sparkles, Zap, Shield, AlertCircle,
} from "lucide-react";
import { startHarvest, getHarvestProgress, buildHarvestPlan } from "../lib/creditHarvester.js";
import { loadPassport, getPrimaryEmail } from "../lib/creditPassport.js";
import {
  initOrchestrator, getCurrentStep, openCurrentSignup,
  advanceOrchestrator, skipCurrentStep, getStepInstructions, loadOrchestratorState,
} from "../lib/signupOrchestrator.js";
import { calculateCreditScore } from "../lib/creditScore.js";
import { formatSavings } from "../lib/savingsCalculator.js";

export default function CreditHarvesterWizard({ locale = "he", onComplete }) {
  const [email, setEmail] = useState(() => getPrimaryEmail() || "");
  const [phase, setPhase] = useState(() => getPrimaryEmail() ? "wizard" : "email");
  const [plan, setPlan] = useState(null);
  const [step, setStep] = useState(null);
  const [progress, setProgress] = useState(() => getHarvestProgress());
  const [score, setScore] = useState(() => calculateCreditScore());
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  const refresh = useCallback(() => {
    setProgress(getHarvestProgress());
    setScore(calculateCreditScore());
    setStep(getCurrentStep());
    const em = getPrimaryEmail();
    if (em) setPlan(buildHarvestPlan(em));
  }, []);

  useEffect(() => {
    if (phase === "wizard") {
      refresh();
    }
  }, [phase, refresh]);

  const handleStart = () => {
    const result = startHarvest(email);
    if (!result.ok) return;
    setPlan(result.plan);
    initOrchestrator(email);
    setPhase("wizard");
    refresh();
  };

  const handleOpenSignup = async () => {
    await openCurrentSignup();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    const result = advanceOrchestrator();
    refresh();
    if (result.done) {
      setDone(true);
      onComplete?.(result.state);
    }
  };

  const handleSkip = () => {
    skipCurrentStep();
    refresh();
  };

  if (phase === "email") {
    return (
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              {locale === "he" ? "מלקט קרדיטים חכם" : "Smart Credit Harvester"}
            </h2>
            <p className="text-sm text-white/50">
              {locale === "he"
                ? "הזן מייל — נפתח לך את כל הקרדיטים החינמיים"
                : "Enter email — unlock all free credits"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-emerald-400/80 bg-emerald-500/10 rounded-lg p-3 mb-4">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {locale === "he"
              ? "המייל נשמר רק במכשיר שלך. נפתח לך הרשמה לכל פlatform — אתה מאשר ומסיים (CAPTCHA/אימות מייל)."
              : "Email stored locally only. We open signup for each platform — you confirm (CAPTCHA/email verify)."}
          </span>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-xl bg-black/40 border border-white/15 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-3"
          dir="ltr"
        />

        <button
          type="button"
          onClick={handleStart}
          disabled={!email.includes("@")}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {locale === "he"
            ? `התחל לאסוף ${plan?.claimableCredits?.toLocaleString() || "10,000+"} קרדיטים`
            : "Start harvesting credits"}
        </button>

        <p className="text-center text-xs text-white/30 mt-3">
          {locale === "he" ? "30+ פlatforms · Google Labs · Bolt · v0 · Leonardo..." : "30+ platforms"}
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-xl font-black text-emerald-300">
          {locale === "he" ? "איסוף הקרדיטים הושלם!" : "Credit harvest complete!"}
        </h3>
        <p className="text-emerald-400/80 text-sm mt-2">
          {locale === "he"
            ? `Credit Score: ${score.gradeHe} (${score.score}/100) · ${score.runway.totalCredits.toLocaleString()} קרדיטים`
            : `Credit Score: ${score.grade} (${score.score}/100)`}
        </p>
        <p className="text-white/50 text-xs mt-2">
          {locale === "he"
            ? `מספיק ל-${score.runway.fullProjectsEstimate} פרויקטים שלמים`
            : `Enough for ${score.runway.fullProjectsEstimate} full projects`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-white">
            {locale === "he" ? "Credit Passport" : "Credit Passport"}
          </span>
          <span className="text-xs text-violet-400 font-bold">
            {score.gradeHe || score.grade} · {score.score}/100
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/50">
          <span>{progress.claimed}/{progress.total} {locale === "he" ? "פlatforms" : "platforms"}</span>
          <span>{progress.percent}%</span>
        </div>
      </div>

      {/* Current step */}
      {step && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold">
              {step.index + 1}/{step.total}
            </span>
            <span className="text-sm font-bold text-white">
              {step.type === "oauth_cluster"
                ? (locale === "he" ? step.labelHe : step.labelEn)
                : (locale === "he" ? step.name : step.nameEn)}
            </span>
            {step.icon && <span>{step.icon}</span>}
          </div>

          <p className="text-xs text-white/60 whitespace-pre-line mb-4">
            {getStepInstructions(step, locale)}
          </p>

          <div className="flex items-center gap-2 text-xs text-white/40 mb-4 bg-black/20 rounded-lg px-3 py-2">
            <Mail className="w-3 h-3" />
            <span dir="ltr">{email}</span>
            <button type="button" onClick={() => navigator.clipboard?.writeText(email)} className="mr-auto text-violet-400">
              <Copy className="w-3 h-3" />
            </button>
            {copied && <span className="text-emerald-400">{locale === "he" ? "הועתק!" : "Copied!"}</span>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenSignup}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold flex items-center justify-center gap-1 hover:bg-violet-500"
            >
              <ExternalLink className="w-4 h-4" />
              {locale === "he" ? "פתח הרשמה" : "Open signup"}
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1 hover:bg-emerald-500"
            >
              <CheckCircle2 className="w-4 h-4" />
              {locale === "he" ? "סיימתי ✓" : "Done ✓"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-2.5 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5"
            >
              {locale === "he" ? "דלג" : "Skip"}
            </button>
          </div>

          <p className="text-xs text-amber-400/70 mt-3 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            {locale === "he"
              ? `+${step.credits?.toLocaleString() || "?"} קרדיטים אחרי אישור`
              : `+${step.credits?.toLocaleString() || "?"} credits after confirm`}
          </p>
        </div>
      )}

      {/* Remaining steps preview */}
      {plan && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <p className="text-xs text-white/40 mb-2">
            {locale === "he" ? "נותרו:" : "Remaining:"} {plan.unclaimedCount} ·
            {locale === "he" ? " פוטנציאל:" : " potential:"} {plan.claimableCredits.toLocaleString()} {locale === "he" ? "קרדיטים" : "credits"}
          </p>
          <div className="flex flex-wrap gap-1">
            {plan.steps.slice(0, 8).map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                {s.type === "oauth_cluster" ? s.icon : (s.nameEn || s.name)?.slice(0, 12)}
              </span>
            ))}
            {plan.steps.length > 8 && (
              <span className="text-[10px] text-white/30">+{plan.steps.length - 8}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditScoreBadge({ locale = "he" }) {
  const score = calculateCreditScore();
  const colors = {
    S: "from-yellow-400 to-amber-500",
    A: "from-emerald-400 to-green-500",
    B: "from-sky-400 to-blue-500",
    C: "from-orange-400 to-amber-500",
    D: "from-red-400 to-orange-500",
    F: "from-gray-400 to-gray-500",
  };
  const gradeLetter = score.grade.charAt(0);
  const gradient = colors[gradeLetter] || colors.F;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white text-lg`}>
        {gradeLetter}
      </div>
      <div>
        <div className="text-sm font-bold text-white">
          {locale === "he" ? "Credit Score" : "Credit Score"}: {score.score}/100
        </div>
        <div className="text-xs text-white/50">
          {score.runway.totalCredits.toLocaleString()} {locale === "he" ? "קרדיטים ·" : "credits ·"}
          {score.runway.fullProjectsEstimate} {locale === "he" ? "פרויקטים" : "projects"}
        </div>
      </div>
    </div>
  );
}
