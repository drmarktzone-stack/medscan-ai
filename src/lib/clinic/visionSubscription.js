/**
 * Vision subscription — device-local until backend billing exists.
 * States: none → pending (paid, awaiting verify) → active (unlock code / grant).
 */

const STORAGE_KEY = "medscan_vision_sub_v1";
const DEFAULT_DAYS = 30;

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRaw(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getVisionSubscriptionState() {
  const row = readRaw();
  if (!row?.status) return { status: "none" };
  if (row.status === "active" && row.expiresAt) {
    if (new Date(row.expiresAt) < new Date()) {
      return { status: "expired", ...row };
    }
  }
  return row;
}

export function hasVisionAccess() {
  const s = getVisionSubscriptionState();
  return s.status === "active";
}

export function isVisionPendingVerification() {
  return getVisionSubscriptionState().status === "pending";
}

export function setVisionPending({ amountIls, phone } = {}) {
  writeRaw({
    status: "pending",
    amountIls,
    phone,
    at: new Date().toISOString(),
  });
}

export function grantVisionAccess({ days = DEFAULT_DAYS, source = "unlock" } = {}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Math.max(1, Number(days) || DEFAULT_DAYS));
  writeRaw({
    status: "active",
    source,
    grantedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

export function revokeVisionAccess() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function visionAccessDaysRemaining() {
  const s = getVisionSubscriptionState();
  if (s.status !== "active" || !s.expiresAt) return 0;
  const ms = new Date(s.expiresAt) - new Date();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
