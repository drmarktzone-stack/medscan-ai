/**
 * Demo / full-access bootstrap — unlock Pro + credits for testing & diagnosis.
 * Enabled via VITE_FREEAI_DEMO_PRO=true (local .env or GitHub Actions build).
 */

import { activatePro, isPro as isProTier } from "./subscription.js";
import { resetQuota } from "./projectQuota.js";
import { loadApiKeys, saveApiKey, loadCreditState, saveCreditState } from "./creditStore.js";
import { ALL_PROVIDERS } from "../data/providers.js";

const BOOTSTRAP_KEY = "freeai_demo_bootstrapped_v1";

export function isDemoProEnv() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_FREEAI_DEMO_PRO === "true") {
    return true;
  }
  return false;
}

/** Pro tier OR demo env flag */
export function hasFullAccess() {
  return isProTier() || isDemoProEnv();
}

/**
 * One-time session bootstrap: Pro activation, quota reset, credit boost, Groq key from env.
 * Safe to call on every FreeAI layout mount — runs heavy work once per browser profile.
 */
export function bootstrapFullAccess() {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };

  const demo = isDemoProEnv();
  const already = localStorage.getItem(BOOTSTRAP_KEY) === "1";

  if (!demo && !already && isProTier()) {
    return { ok: true, mode: "pro", skipped: true };
  }

  if (demo || !already) {
    activatePro({ email: "demo@freeai.local", paymentRef: "demo-full-access" });
    resetQuota();

    const groqFromEnv =
      typeof import.meta !== "undefined" ? import.meta.env?.VITE_GROQ_API_KEY : null;
    if (groqFromEnv) {
      saveApiKey("groq", groqFromEnv);
    }

    if (demo) {
      boostAllCredits();
    }

    localStorage.setItem(BOOTSTRAP_KEY, "1");
    return { ok: true, mode: demo ? "demo-pro" : "pro", fullAccess: true };
  }

  return { ok: true, mode: isProTier() ? "pro" : "free", skipped: true };
}

function boostAllCredits() {
  const state = loadCreditState();
  for (const p of ALL_PROVIDERS) {
    if (!state[p.id]) continue;
    const boost = Math.max(p.defaultCredits * 5, 500);
    state[p.id].remaining = boost;
    state[p.id].enabled = true;
  }
  saveCreditState(state);
}

export function getAccessLabel(locale = "he") {
  const lang = locale === "en" || locale === "ar" ? locale : "he";
  if (hasFullAccess()) {
    return lang === "he" ? "גרסה מלאה · Pro" : lang === "ar" ? "كامل · Pro" : "Full · Pro";
  }
  return lang === "he" ? "חינם" : lang === "ar" ? "مجاني" : "Free";
}
