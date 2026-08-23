/**
 * Credit Passport — user's email identity + claimed provider accounts.
 * Stored locally only; never sent to our servers.
 */

const PASSPORT_KEY = "freeai_credit_passport_v1";
let memoryPassport = null;

/** @typedef {{ email: string; altEmails: string[]; claimedProviders: Record<string, { claimedAt: string; credits: number; verified: boolean }>; oauthLinked: Record<string, boolean>; harvestStartedAt?: string; harvestCompletedAt?: string }} Passport */

export function loadPassport() {
  if (memoryPassport) return memoryPassport;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PASSPORT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePassport(passport) {
  memoryPassport = passport;
  if (typeof window !== "undefined") {
    localStorage.setItem(PASSPORT_KEY, JSON.stringify(passport));
  }
}

/** @param {string} email */
export function saveEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, reason: "invalid_email" };

  const existing = loadPassport() || {};
  const passport = {
    ...existing,
    email: normalized,
    altEmails: existing.altEmails || [],
    claimedProviders: existing.claimedProviders || {},
    oauthLinked: existing.oauthLinked || {},
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writePassport(passport);
  return { ok: true, passport };
}

export function addAltEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, reason: "invalid_email" };
  const passport = loadPassport();
  if (!passport?.email) return { ok: false, reason: "no_primary_email" };

  const alts = new Set(passport.altEmails || []);
  if (normalized === passport.email) return { ok: false, reason: "same_as_primary" };
  alts.add(normalized);
  passport.altEmails = [...alts];
  passport.updatedAt = new Date().toISOString();
  writePassport(passport);
  return { ok: true, passport };
}

/** @param {string} providerId @param {number} [credits] */
export function markProviderClaimed(providerId, credits) {
  const passport = loadPassport();
  if (!passport) return { ok: false, reason: "no_passport" };

  passport.claimedProviders[providerId] = {
    claimedAt: new Date().toISOString(),
    credits: credits ?? 0,
    verified: true,
  };
  passport.updatedAt = new Date().toISOString();
  writePassport(passport);
  return { ok: true, passport };
}

export function unmarkProvider(providerId) {
  const passport = loadPassport();
  if (!passport) return;
  delete passport.claimedProviders[providerId];
  writePassport(passport);
}

export function linkOAuth(provider, linked = true) {
  const passport = loadPassport();
  if (!passport) return { ok: false };
  passport.oauthLinked[provider] = linked;
  writePassport(passport);
  return { ok: true, passport };
}

export function getClaimedProviderIds() {
  const passport = loadPassport();
  if (!passport) return [];
  return Object.keys(passport.claimedProviders || {});
}

export function isProviderClaimed(providerId) {
  return getClaimedProviderIds().includes(providerId);
}

export function getPrimaryEmail() {
  return loadPassport()?.email || null;
}

export function getAllEmails() {
  const p = loadPassport();
  if (!p?.email) return [];
  return [p.email, ...(p.altEmails || [])];
}

function normalizeEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export function clearPassport() {
  memoryPassport = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(PASSPORT_KEY);
  }
}

/**
 * Generate email alias variants for multi-account strategy (e.g. user+freeai1@gmail.com).
 * Gmail and many providers ignore +suffix — user must verify ToS themselves.
 */
export function generateEmailAliases(baseEmail, count = 3) {
  const [local, domain] = baseEmail.split("@");
  if (!local || !domain) return [];
  return Array.from({ length: count }, (_, i) => `${local}+freeai${i + 1}@${domain}`);
}
