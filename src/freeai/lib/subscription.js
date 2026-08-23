/**
 * FreeAI Pro subscription — ₪20/month
 * Payment URL from env; tracks tier locally until backend billing exists.
 */

const SUB_KEY = "freeai_subscription_v1";
const WAITLIST_KEY = "freeai_waitlist_v1";

export const PRICING = {
  free: {
    id: "free",
    priceIls: 0,
    labelHe: "חינם",
    labelEn: "Free",
    projectsPerMonth: 2,
    featuresHe: ["2 פרויקטים/חודש", "יצירת תמונות בסיסית", "Credit Passport", "Studio"],
    featuresEn: ["2 projects/month", "Basic image gen", "Credit Passport", "Studio"],
  },
  pro: {
    id: "pro",
    priceIls: 20,
    labelHe: "Pro",
    labelEn: "Pro",
    projectsPerMonth: 999,
    featuresHe: [
      "פרויקטים ללא הגבלה",
      "כל 30+ ספקי AI",
      "Credit Harvester מלא",
      "Pipeline קוד→עיצוב→deploy",
      "Brand Kit + CSV import",
      "תור לילה + Credit Score",
      "תמיכה בעדיפות",
    ],
    featuresEn: [
      "Unlimited projects",
      "All 30+ AI providers",
      "Full Credit Harvester",
      "Code→design→deploy pipeline",
      "Brand Kit + CSV import",
      "Night queue + Credit Score",
      "Priority support",
    ],
  },
};

export function getPaymentUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_FREEAI_PAYMENT_URL) {
    return import.meta.env.VITE_FREEAI_PAYMENT_URL;
  }
  return null;
}

export function loadSubscription() {
  if (typeof window === "undefined") return { tier: "free", ...PRICING.free };
  try {
    const raw = JSON.parse(localStorage.getItem(SUB_KEY) || "{}");
    const tier = raw.tier === "pro" && !isExpired(raw) ? "pro" : "free";
    return { ...raw, tier, ...(tier === "pro" ? PRICING.pro : PRICING.free) };
  } catch {
    return { tier: "free", ...PRICING.free };
  }
}

function isExpired(sub) {
  if (!sub.expiresAt) return false;
  return new Date(sub.expiresAt) < new Date();
}

export function activatePro({ email, paymentRef } = {}) {
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  const sub = {
    tier: "pro",
    email,
    paymentRef,
    activatedAt: new Date().toISOString(),
    expiresAt: expires.toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  }
  return sub;
}

export function isPro() {
  return loadSubscription().tier === "pro";
}

export function joinWaitlist(email) {
  const list = loadWaitlist();
  if (!email || list.some((e) => e.email === email)) return { ok: false, reason: "duplicate" };
  list.push({ email, at: new Date().toISOString() });
  if (typeof window !== "undefined") {
    localStorage.setItem(WAITLIST_KEY, JSON.stringify(list));
  }
  return { ok: true };
}

export function loadWaitlist() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Savings pitch for marketing */
export function valueProposition(locale = "he") {
  if (locale === "he") {
    return {
      headline: "כל כלי ה-AI — ₪20 בלבד",
      sub: "ChatGPT + Midjourney + Bolt + Canva + Google Labs — בממשק אחד",
      savings: "חוסך ₪500+ בחודש",
      cta: "נסו חינם · Pro רק ₪20/חודש",
    };
  }
  return {
    headline: "All AI tools — only ₪20",
    sub: "ChatGPT + Midjourney + Bolt + Canva + Google Labs — one interface",
    savings: "Saves ₪500+/month",
    cta: "Try free · Pro only ₪20/month",
  };
}
