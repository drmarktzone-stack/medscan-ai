/**
 * Family care profile — HMO, city, optional child label.
 * Stored locally; never sent to a server unless the user exports backup.
 */

export const CARE_PROFILE_KEY = "medscan_care_profile_v1";

export const HMO_IDS = Object.freeze([
  "clalit",
  "maccabi",
  "meuhedet",
  "leumit",
  "private_only",
  "unknown",
]);

export const ISRAEL_REGIONS = Object.freeze([
  "north",
  "haifa",
  "sharon",
  "center",
  "jerusalem",
  "south",
  "negev",
]);

function clip(value, max = 80) {
  return String(value || "").trim().slice(0, max);
}

export function emptyCareProfile() {
  return {
    hmo: "",
    city: "",
    region: "",
    childLabel: "",
    updatedAt: null,
  };
}

export function normalizeCareProfile(raw = {}) {
  return {
    hmo: HMO_IDS.includes(raw.hmo) ? raw.hmo : "",
    city: clip(raw.city, 60),
    region: ISRAEL_REGIONS.includes(raw.region) ? raw.region : "",
    childLabel: clip(raw.childLabel, 40),
    updatedAt: raw.updatedAt || null,
  };
}

export function loadCareProfile(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return emptyCareProfile();
  try {
    const raw = store.getItem(CARE_PROFILE_KEY);
    return raw ? normalizeCareProfile(JSON.parse(raw)) : emptyCareProfile();
  } catch {
    return emptyCareProfile();
  }
}

export function saveCareProfile(profile, storage) {
  const next = normalizeCareProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (store) store.setItem(CARE_PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function careProfileComplete(profile) {
  const p = normalizeCareProfile(profile);
  return Boolean(p.hmo && p.hmo !== "unknown");
}
