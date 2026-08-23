/**
 * Paid vision tools — paywall auto-on in standalone when Bit merchant is configured.
 */

import { normalizeIsraeliMobile } from "./paymentConfig.js";
import { isStandaloneBuild } from "./standalone.js";

export const VISION_BILLING_GROUP = Object.freeze({
  id: "vision",
  routes: Object.freeze(["/ecg", "/ecg-compare", "/skin", "/radiology"]),
  label_he: "דימות — MedScan Vision (מנוי)",
});

export function isVisionBillingRoute(path) {
  return VISION_BILLING_GROUP.routes.includes(String(path || ""));
}

export function readVisionPaywallFlag(env = {}) {
  const forced = env.VITE_VISION_PAYWALL;
  if (forced === "false" || forced === "0") return false;
  if (forced === "true" || forced === "1") return true;
  const phone = normalizeIsraeliMobile(env.VITE_BIT_MERCHANT_PHONE || "");
  return Boolean(phone);
}

export function visionPaywallOn(env) {
  if (!isStandaloneBuild(env)) return false;
  const e = env ?? (typeof import.meta !== "undefined" ? import.meta.env : {});
  return readVisionPaywallFlag(e);
}
