/**
 * Bit (ביט) — manual transfer flow for static/PWA host.
 * Full checkout iframe requires Tranzila/Hyp/Grow merchant account.
 */

import {
  formatIsraeliMobile,
  getBitMerchantPhone,
  getVisionPriceIls,
} from "./paymentConfig.js";

export function bitPaymentSummary({ amountIls = getVisionPriceIls(), note = "MedScan Vision" } = {}) {
  const phone = getBitMerchantPhone();
  if (!phone) return { ok: false, reason: "bit_not_configured" };
  return {
    ok: true,
    phone,
    phoneDisplay: formatIsraeliMobile(phone),
    amountIls,
    note,
  };
}

/** Best-effort open Bit on mobile; fallback is copy + instructions. */
export function openBitApp() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const candidates = isAndroid
    ? [
        "intent://bit#Intent;scheme=bit;package=com.bankhapoalim.bit;end",
        "https://play.google.com/store/apps/details?id=com.bankhapoalim.bit",
      ]
    : isIOS
      ? ["bit://", "https://apps.apple.com/il/app/bit/id1090928871"]
      : ["https://www.bitpay.co.il/"];
  for (const url of candidates) {
    try {
      window.location.href = url;
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("clipboard_unavailable"));
}

const PENDING_KEY = "medscan_bit_pending_v1";

export function markBitPaymentPending({ amountIls, phone }) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      amountIls,
      phone,
      at: new Date().toISOString(),
    }));
  } catch {
    /* ignore */
  }
}

export function clearBitPaymentPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function readBitPaymentPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
