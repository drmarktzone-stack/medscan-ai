/**
 * Project quota — 2 free full projects per user (Pro = unlimited).
 */

import { isPro } from "./subscription.js";

const QUOTA_KEY = "freeai_project_quota_v1";
const MAX_FREE_PROJECTS = 2;
const PRO_MAX = 999;

function hasFullAccess() {
  if (isPro()) return true;
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_FREEAI_DEMO_PRO === "true";
}

export function getQuotaState() {
  if (typeof window === "undefined") return { used: 0, max: MAX_FREE_PROJECTS, remaining: MAX_FREE_PROJECTS };
  if (hasFullAccess()) {
    return { used: 0, max: PRO_MAX, remaining: PRO_MAX, unlimited: true };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(QUOTA_KEY) || "{}");
    const used = raw.used || 0;
    return { used, max: MAX_FREE_PROJECTS, remaining: Math.max(0, MAX_FREE_PROJECTS - used) };
  } catch {
    return { used: 0, max: MAX_FREE_PROJECTS, remaining: MAX_FREE_PROJECTS };
  }
}

export function canStartFullProject() {
  if (hasFullAccess()) {
    return { ok: true, remaining: PRO_MAX, unlimited: true };
  }
  const q = getQuotaState();
  if (q.remaining <= 0) {
    return {
      ok: false,
      messageHe: `השתמשת ב-${q.max} הפרויקטים החינמיים. המתן לאיפוס חודשי או הוסף ספקים.`,
      messageEn: `You used all ${q.max} free projects. Wait for monthly reset or add providers.`,
    };
  }
  return { ok: true, remaining: q.remaining };
}

export function consumeProjectQuota() {
  if (hasFullAccess()) return getQuotaState();
  const q = getQuotaState();
  const next = { used: q.used + 1, resetAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(next));
  }
  return getQuotaState();
}

export function resetQuota() {
  if (typeof window !== "undefined") {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({ used: 0 }));
  }
}
