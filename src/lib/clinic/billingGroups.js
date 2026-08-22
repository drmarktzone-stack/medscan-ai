/**
 * Future paid tools — catalog only.
 * Paywall stays off until the physician announces which tools are charged together.
 */

export const VISION_BILLING_GROUP = Object.freeze({
  id: "vision",
  paywall_enabled: false,
  routes: Object.freeze(["/ecg", "/ecg-compare", "/skin", "/radiology"]),
  label_he: "דימות — קבוצת תשלום עתידית (עדיין פתוחה לבדיקה)",
});

export function isVisionBillingRoute(path) {
  return VISION_BILLING_GROUP.routes.includes(String(path || ""));
}

export function visionPaywallOn() {
  return VISION_BILLING_GROUP.paywall_enabled === true;
}
