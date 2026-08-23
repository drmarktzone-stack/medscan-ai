/**
 * Marketing URLs and share copy — no secrets; phone for WhatsApp support via env.
 */

import { normalizeIsraeliMobile } from "./paymentConfig.js";
import { absoluteAppPath } from "./standalone.js";

const DEFAULT_SITE = "https://drmarktzone-stack.github.io/medscan-ai";

export function getPublicSiteUrl() {
  const fromEnv = String(import.meta.env?.VITE_PUBLIC_SITE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const base = import.meta.env?.BASE_URL || "/";
    return `${window.location.origin}${String(base).replace(/\/$/, "") || ""}`.replace(/\/$/, "") || window.location.origin;
  }
  return DEFAULT_SITE;
}

export function marketingPath(path) {
  return absoluteAppPath(path, import.meta.env?.BASE_URL || "/");
}

export function getSupportWhatsApp() {
  const raw = import.meta.env?.VITE_SUPPORT_WHATSAPP || import.meta.env?.VITE_BIT_MERCHANT_PHONE || "";
  const n = normalizeIsraeliMobile(raw);
  if (!n) return null;
  return `972${n.slice(1)}`;
}

export function buildShareMessages(lang = "he") {
  const site = getPublicSiteUrl();
  const start = `${site}${marketingPath("/start")}`;
  const checkout = `${site}${marketingPath("/checkout")}`;
  const parent = `${site}${marketingPath("/parent")}`;

  if (lang === "en") {
    return {
      clinician: `MedScan AI — pediatric decision support (not a diagnosis).\nFree text tools + on-device imaging draft.\nTry: ${start}`,
      parent: `MedScan for parents — visit prep, emergency card, daycare return.\nFree: ${parent}`,
      upgrade: `MedScan Vision — full ECG/skin/radiology workflow.\nPay with Bit: ${checkout}`,
    };
  }

  return {
    clinician: `MedScan AI — תמיכה בהחלטות קליניות לרופאי ילדים (לא אבחנה).\nכלים חינמיים + טיוטת דימות במכשיר.\nכנסו: ${start}`,
    parent: `MedScan להורים — הכנה לביקור, כרטיס חירום, חזרה לגן.\nחינם: ${parent}`,
    upgrade: `MedScan Vision — דימות מלא (אק״ג / עור / רדיולוגיה).\nתשלום בביט: ${checkout}`,
  };
}

export function whatsAppShareUrl(text, phoneE164 = null) {
  const q = encodeURIComponent(text);
  if (phoneE164) return `https://wa.me/${phoneE164}?text=${q}`;
  return `https://wa.me/?text=${q}`;
}

export function copyMarketingLink(path = "/start") {
  const url = `${getPublicSiteUrl()}${marketingPath(path)}`;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(url);
  }
  return Promise.reject(new Error("clipboard_unavailable"));
}
