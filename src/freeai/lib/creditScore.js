/**
 * AI Credit Score — calculates user's "runway" for free project completion.
 */

import { ALL_PROVIDERS } from "../data/providers.js";
import { loadCreditState } from "./creditStore.js";
import { getClaimedProviderIds, loadPassport } from "./creditPassport.js";
import { getHarvestProgress } from "./creditHarvester.js";

/**
 * @returns {{ score: number; grade: string; gradeHe: string; runway: object; recommendations: object[] }}
 */
export function calculateCreditScore() {
  const creditState = loadCreditState();
  const claimed = new Set(getClaimedProviderIds());
  const passport = loadPassport();

  let totalCredits = 0;
  let codeCredits = 0;
  let designCredits = 0;
  let deployCredits = 0;
  let videoCredits = 0;
  let activeProviders = 0;

  for (const p of ALL_PROVIDERS) {
    if (creditState[p.id]?.enabled === false) continue;
    const rem = creditState[p.id]?.remaining ?? 0;
    if (rem <= 0 && !claimed.has(p.id)) continue;

    const effective = rem > 0 ? rem : (claimed.has(p.id) ? p.defaultCredits : 0);
    totalCredits += effective;
    activeProviders += 1;

    if (p.capabilities.includes("code")) codeCredits += effective;
    if (p.capabilities.includes("image") || p.capabilities.includes("design")) designCredits += effective;
    if (p.capabilities.includes("deploy") || p.capabilities.includes("host")) deployCredits += effective;
    if (p.capabilities.includes("video")) videoCredits += effective;
  }

  const harvest = getHarvestProgress();
  const emailBonus = passport?.email ? 10 : 0;
  const rawScore = Math.min(100, Math.round(
    (totalCredits / 500) * 40 +
    (activeProviders / ALL_PROVIDERS.length) * 30 +
    harvest.percent * 0.2 +
    emailBonus
  ));

  const grade = scoreToGrade(rawScore);

  const recommendations = [];
  if (!passport?.email) {
    recommendations.push({
      priority: "critical",
      messageHe: "הזן מייל כדי לפתוח את מלקט הקרדיטים",
      messageEn: "Enter email to unlock credit harvester",
      action: "harvest",
    });
  }
  if (codeCredits < 50) {
    recommendations.push({
      priority: "high",
      messageHe: "Claim Bolt.new / v0 / Groq לקרדיטי קוד",
      messageEn: "Claim Bolt.new / v0 / Groq for code credits",
      action: "harvest_code",
    });
  }
  if (designCredits < 100) {
    recommendations.push({
      priority: "high",
      messageHe: "Claim Google ImageFX + Leonardo לתמונות",
      messageEn: "Claim Google ImageFX + Leonardo for images",
      action: "harvest_design",
    });
  }
  if (harvest.percent < 50) {
    recommendations.push({
      priority: "medium",
      messageHe: `עוד ${harvest.total - harvest.claimed} פlatforms לclaim — ${Math.round((100 - harvest.percent))}% פוטנציאל לא מנוצל`,
      messageEn: `${harvest.total - harvest.claimed} platforms left to claim`,
      action: "harvest",
    });
  }

  return {
    score: rawScore,
    grade: grade.en,
    gradeHe: grade.he,
    runway: {
      totalCredits,
      codeCredits,
      designCredits,
      deployCredits,
      videoCredits,
      activeProviders,
      fullProjectsEstimate: Math.floor(Math.min(codeCredits / 10, designCredits / 20, deployCredits / 5)),
    },
    harvest,
    recommendations,
  };
}

function scoreToGrade(score) {
  if (score >= 90) return { en: "S", he: "S — גאון" };
  if (score >= 75) return { en: "A", he: "A — מעולה" };
  if (score >= 60) return { en: "B", he: "B — טוב" };
  if (score >= 40) return { en: "C", he: "C — בסיסי" };
  if (score >= 20) return { en: "D", he: "D — חלש" };
  return { en: "F", he: "F — התחל Harvest" };
}

/**
 * Estimate if user can complete a project type.
 */
export function canCompleteProject(type = "full") {
  const { runway } = calculateCreditScore();
  const reqs = {
    full: { code: 10, design: 30, deploy: 5 },
    landing: { code: 5, design: 10, deploy: 3 },
    images: { design: 20 },
    video: { video: 5, design: 10 },
  };
  const req = reqs[type] || reqs.full;

  const gaps = [];
  if (req.code && runway.codeCredits < req.code) gaps.push("code");
  if (req.design && runway.designCredits < req.design) gaps.push("design");
  if (req.deploy && runway.deployCredits < req.deploy) gaps.push("deploy");
  if (req.video && runway.videoCredits < req.video) gaps.push("video");

  return {
    ok: gaps.length === 0,
    gaps,
    runway,
  };
}
