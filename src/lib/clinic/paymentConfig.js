/**
 * Payment configuration — secrets via env only (never commit phone/API keys).
 */

export function normalizeIsraeliMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9 && digits.startsWith("5")) return `0${digits}`;
  return digits.length >= 9 ? digits : null;
}

export function formatIsraeliMobile(display) {
  const n = normalizeIsraeliMobile(display);
  if (!n || n.length !== 10) return display || "";
  return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
}

export function getBitMerchantPhone() {
  const fromEnv = import.meta.env?.VITE_BIT_MERCHANT_PHONE || "";
  return normalizeIsraeliMobile(fromEnv);
}

export function getVisionPriceIls() {
  const n = Number(import.meta.env?.VITE_VISION_PRICE_ILS ?? 49);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 49;
}

export function isBitConfigured() {
  return Boolean(getBitMerchantPhone());
}

export function getGrowConfig() {
  const userId = String(import.meta.env?.VITE_GROW_USER_ID || "").trim();
  const pageCode = String(import.meta.env?.VITE_GROW_BIT_PAGE_CODE || "").trim();
  return userId && pageCode ? { userId, pageCode } : null;
}

export function getStripePaymentLink() {
  return String(import.meta.env?.VITE_STRIPE_PAYMENT_LINK || "").trim() || null;
}
