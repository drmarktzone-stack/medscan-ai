/**
 * Credit Harvester — orchestrates claiming free credits across all providers.
 * Opens signup flows with email pre-fill where supported; tracks progress.
 */

import { ALL_PROVIDERS, getProvider } from "../data/providers.js";
import { loadPassport, markProviderClaimed, saveEmail, getClaimedProviderIds } from "./creditPassport.js";
import { resetProviderCredits, setCredits } from "./creditStore.js";

/** Signup URL builders — best-effort email prefill per platform */
const SIGNUP_URL_BUILDERS = {
  google_imagefx: (email) => `https://labs.google/fx/tools/image-fx`,
  google_whisk: (email) => `https://labs.google/fx/tools/whisk`,
  google_veo: (email) => `https://labs.google/fx/tools/video-fx`,
  google_ai_studio: (email) => `https://aistudio.google.com`,
  leonardo: (email) => `https://app.leonardo.ai/auth/login`,
  ideogram: (email) => `https://ideogram.ai/login`,
  bing_creator: (email) => `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=04b07795-8ddb-461a-bbee-02f9e1bf7b46&response_type=code&scope=openid&redirect_uri=https://designer.microsoft.com`,
  adobe_firefly: (email) => `https://auth.services.adobe.com/en_US/index.html`,
  canva_ai: (email) => `https://www.canva.com/signup/`,
  huggingface: (email) => `https://huggingface.co/join?email=${encodeURIComponent(email)}`,
  replicate: (email) => `https://replicate.com/signin`,
  runway: (email) => `https://app.runwayml.com/login`,
  pika: (email) => `https://pika.art/login`,
  luma: (email) => `https://lumalabs.ai/dream-machine`,
  kling: (email) => `https://klingai.com/user/login`,
  meta_ai: (email) => `https://www.meta.ai/`,
  bolt_new: (email) => `https://bolt.new/`,
  v0_dev: (email) => `https://v0.dev/login?email=${encodeURIComponent(email)}`,
  lovable: (email) => `https://lovable.dev/login`,
  replit: (email) => `https://replit.com/signup?email=${encodeURIComponent(email)}`,
  cursor_free: (email) => `https://cursor.com/api/auth/login`,
  windsurf: (email) => `https://codeium.com/windsurf/signup?email=${encodeURIComponent(email)}`,
  github_copilot: (email) => `https://github.com/signup?email=${encodeURIComponent(email)}`,
  groq: (email) => `https://console.groq.com/login?email=${encodeURIComponent(email)}`,
  deepseek: (email) => `https://platform.deepseek.com/sign_up?email=${encodeURIComponent(email)}`,
  openrouter_free: (email) => `https://openrouter.ai/sign-up?email=${encodeURIComponent(email)}`,
  blackbox: (email) => `https://www.blackbox.ai/pricing`,
  netlify: (email) => `https://app.netlify.com/signup?email=${encodeURIComponent(email)}`,
  vercel: (email) => `https://vercel.com/signup?email=${encodeURIComponent(email)}`,
  cloudflare_pages: (email) => `https://dash.cloudflare.com/sign-up?email=${encodeURIComponent(email)}`,
  github_pages: (email) => `https://github.com/signup?email=${encodeURIComponent(email)}`,
};

/** OAuth providers that share one login for multiple tools */
const OAUTH_CLUSTERS = {
  google: {
    labelHe: "Google (מכסה ImageFX, Whisk, Veo, AI Studio)",
    labelEn: "Google (covers ImageFX, Whisk, Veo, AI Studio)",
    providers: ["google_imagefx", "google_whisk", "google_veo", "google_ai_studio"],
    signupUrl: () => "https://accounts.google.com/signup",
    icon: "🔵",
  },
  github: {
    labelHe: "GitHub (מכסה Copilot, Pages, Codespaces)",
    labelEn: "GitHub (covers Copilot, Pages, Codespaces)",
    providers: ["github_copilot", "github_pages"],
    signupUrl: (email) => `https://github.com/signup?email=${encodeURIComponent(email)}`,
    icon: "⚫",
  },
  microsoft: {
    labelHe: "Microsoft (מכסה Designer, Bing Creator)",
    labelEn: "Microsoft (covers Designer, Bing Creator)",
    providers: ["bing_creator"],
    signupUrl: () => "https://signup.live.com",
    icon: "🟦",
  },
};

/**
 * Build full harvest plan for an email.
 * @param {string} email
 */
export function buildHarvestPlan(email) {
  const claimed = new Set(getClaimedProviderIds());
  const steps = [];
  let totalCredits = 0;
  let claimableCredits = 0;

  for (const cluster of Object.values(OAUTH_CLUSTERS)) {
    const unclaimed = cluster.providers.filter((id) => !claimed.has(id));
    if (unclaimed.length === 0) continue;

    let clusterCredits = 0;
    for (const id of unclaimed) {
      const p = getProvider(id);
      if (p) clusterCredits += p.defaultCredits;
    }

    steps.push({
      type: "oauth_cluster",
      clusterId: Object.keys(OAUTH_CLUSTERS).find((k) => OAUTH_CLUSTERS[k] === cluster),
      labelHe: cluster.labelHe,
      labelEn: cluster.labelEn,
      icon: cluster.icon,
      signupUrl: cluster.signupUrl(email),
      providerIds: unclaimed,
      credits: clusterCredits,
      email,
    });
    claimableCredits += clusterCredits;
  }

  for (const p of ALL_PROVIDERS) {
    if (claimed.has(p.id)) {
      totalCredits += p.defaultCredits;
      continue;
    }

    const inCluster = Object.values(OAUTH_CLUSTERS).some((c) => c.providers.includes(p.id));
    if (inCluster) continue;

    const signupUrl = buildSignupUrl(p.id, email);
    steps.push({
      type: "individual",
      providerId: p.id,
      name: p.nameHe,
      nameEn: p.name,
      signupUrl,
      credits: p.defaultCredits,
      resetPeriod: p.resetPeriod,
      capabilities: p.capabilities,
      email,
      copyEmail: true,
    });
    claimableCredits += p.defaultCredits;
  }

  totalCredits += claimableCredits;

  return {
    email,
    steps,
    totalSteps: steps.length,
    claimableCredits,
    totalPotentialCredits: totalCredits,
    claimedCount: claimed.size,
    unclaimedCount: steps.length,
  };
}

export function buildSignupUrl(providerId, email) {
  const builder = SIGNUP_URL_BUILDERS[providerId];
  const p = getProvider(providerId);
  if (builder) return builder(email);
  return p?.url || p?.generateUrl || "#";
}

/**
 * Mark a harvest step complete — activates credits in our tracker.
 * @param {string|string[]} providerIds
 */
export function completeHarvestStep(providerIds) {
  const ids = Array.isArray(providerIds) ? providerIds : [providerIds];
  for (const id of ids) {
    const p = getProvider(id);
    if (!p) continue;
    markProviderClaimed(id, p.defaultCredits);
    resetProviderCredits(id);
  }
  return { ok: true, activated: ids };
}

/**
 * Auto-harvest simulation — activates all API providers that need no signup.
 */
export function autoActivateZeroSignupProviders() {
  const activated = [];
  for (const p of ALL_PROVIDERS) {
    if (p.accessMode === "api" && !p.needsKey && p.defaultCredits > 0) {
      markProviderClaimed(p.id, p.defaultCredits);
      resetProviderCredits(p.id);
      activated.push(p.id);
    }
  }
  return activated;
}

/**
 * Start harvest session for email.
 */
export function startHarvest(email) {
  const saved = saveEmail(email);
  if (!saved.ok) return saved;

  autoActivateZeroSignupProviders();
  const plan = buildHarvestPlan(email);

  const passport = loadPassport();
  if (passport) {
    passport.harvestStartedAt = new Date().toISOString();
    if (typeof window !== "undefined") {
      localStorage.setItem("freeai_credit_passport_v1", JSON.stringify(passport));
    }
  }

  return { ok: true, plan, passport: saved.passport };
}

/**
 * Get harvest progress percentage.
 */
export function getHarvestProgress() {
  const claimed = getClaimedProviderIds();
  const total = ALL_PROVIDERS.length;
  const autoNoSignup = ALL_PROVIDERS.filter((p) => p.accessMode === "api" && !p.needsKey).length;
  const pct = Math.round(((claimed.length + autoNoSignup) / total) * 100);
  return {
    claimed: claimed.length,
    total,
    percent: Math.min(100, pct),
    autoActive: autoNoSignup,
  };
}

/**
 * Recommended next signup step.
 */
export function getNextHarvestStep() {
  const email = loadPassport()?.email;
  if (!email) return null;
  const plan = buildHarvestPlan(email);
  return plan.steps[0] || null;
}

export { OAUTH_CLUSTERS };
