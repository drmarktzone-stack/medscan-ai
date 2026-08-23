/**
 * Child emergency profile — local only. Used for 101/ER script and emergency card.
 */

import { loadCareProfile } from "./careProfile.js";

export const EMERGENCY_PROFILE_KEY = "medscan_emergency_profile_v1";

const HMO_LABEL_HE = Object.freeze({
  clalit: "כללית",
  maccabi: "מכבי",
  meuhedet: "מאוחדת",
  leumit: "לאומית",
  private_only: "פרטי",
});

function clip(v, max = 200) {
  return String(v || "").trim().slice(0, max);
}

export function emptyEmergencyProfile() {
  return {
    childName: "",
    birthDate: "",
    weightKg: "",
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    regularMeds: "",
    emergencyContact: "",
    emergencyPhone: "",
    pediatrician: "",
    hmoNotes: "",
    updatedAt: null,
  };
}

export function normalizeEmergencyProfile(raw = {}) {
  const w = Number(raw.weightKg);
  return {
    childName: clip(raw.childName, 60),
    birthDate: clip(raw.birthDate, 12),
    weightKg: Number.isFinite(w) && w > 0 ? String(w) : clip(raw.weightKg, 8),
    bloodType: clip(raw.bloodType, 8),
    allergies: clip(raw.allergies, 300),
    chronicConditions: clip(raw.chronicConditions, 300),
    regularMeds: clip(raw.regularMeds, 300),
    emergencyContact: clip(raw.emergencyContact, 80),
    emergencyPhone: clip(raw.emergencyPhone, 20),
    pediatrician: clip(raw.pediatrician, 80),
    hmoNotes: clip(raw.hmoNotes, 200),
    updatedAt: raw.updatedAt || null,
  };
}

export function loadEmergencyProfile(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return emptyEmergencyProfile();
  try {
    const raw = store.getItem(EMERGENCY_PROFILE_KEY);
    return raw ? normalizeEmergencyProfile(JSON.parse(raw)) : emptyEmergencyProfile();
  } catch {
    return emptyEmergencyProfile();
  }
}

export function saveEmergencyProfile(profile, storage) {
  const next = normalizeEmergencyProfile({ ...profile, updatedAt: new Date().toISOString() });
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (store) store.setItem(EMERGENCY_PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function emergencyProfileReady(profile) {
  const p = normalizeEmergencyProfile(profile);
  return Boolean(p.childName && (p.weightKg || p.birthDate));
}

/**
 * Build a script for MDA 101 / ER intake. Deterministic — no LLM.
 */
export function buildEmergencyScript({ profile, careProfile, currentSituation = "", lang = "he" } = {}) {
  const p = normalizeEmergencyProfile(profile);
  const care = careProfile || loadCareProfile();
  const hmoLabel = HMO_LABEL_HE[care.hmo] || (lang === "he" ? "לא צוין" : "not set");
  const lines = [];

  if (lang === "he") {
    lines.push("שלום, אני מתקשר/ת בנוגע לילד/ה:");
    lines.push("");
    lines.push(`שם: ${p.childName || "—"}`);
    if (p.birthDate) lines.push(`תאריך לידה: ${p.birthDate}`);
    if (p.weightKg) lines.push(`משקל: ${p.weightKg} ק"ג`);
    if (care.city) lines.push(`עיר: ${care.city}`);
    lines.push(`קופה: ${hmoLabel}`);
    if (p.bloodType) lines.push(`סוג דם: ${p.bloodType}`);
    if (p.allergies) lines.push(`רגישויות: ${p.allergies}`);
    if (p.chronicConditions) lines.push(`מחלות רקע: ${p.chronicConditions}`);
    if (p.regularMeds) lines.push(`תרופות קבועות: ${p.regularMeds}`);
    lines.push("");
    lines.push("מה קורה עכשיו:");
    lines.push(currentSituation.trim() || "— (תארו: תסמינים, מתי התחיל, חום אם יש)");
    lines.push("");
    lines.push("אנא שלחו אמבולנס / הנחיה — הילד/ה בפיקוחי.");
    if (p.emergencyContact) lines.push(`איש קשר: ${p.emergencyContact}${p.emergencyPhone ? ` · ${p.emergencyPhone}` : ""}`);
  } else {
    lines.push("Hello, I am calling about a child:");
    lines.push("");
    lines.push(`Name: ${p.childName || "—"}`);
    if (p.birthDate) lines.push(`DOB: ${p.birthDate}`);
    if (p.weightKg) lines.push(`Weight: ${p.weightKg} kg`);
    if (care.city) lines.push(`City: ${care.city}`);
    lines.push(`HMO: ${care.hmo || "not set"}`);
    if (p.allergies) lines.push(`Allergies: ${p.allergies}`);
    if (p.chronicConditions) lines.push(`Conditions: ${p.chronicConditions}`);
    if (p.regularMeds) lines.push(`Meds: ${p.regularMeds}`);
    lines.push("");
    lines.push("Current situation:");
    lines.push(currentSituation.trim() || "— (symptoms, onset, fever if any)");
    lines.push("");
    lines.push("Please advise / send ambulance — child is with me.");
  }

  return {
    script: lines.join("\n"),
    phone101: "101",
    phoneEr: "100",
    ready: emergencyProfileReady(p),
  };
}

export function mergeFromPatientSession(session, profile, storage) {
  const cur = normalizeEmergencyProfile(profile);
  const next = normalizeEmergencyProfile({
    ...cur,
    childName: cur.childName || session?.patientName || "",
    weightKg: cur.weightKg || session?.weight || "",
  });
  return saveEmergencyProfile(next, storage);
}
