/**
 * Pediatric age as years + months + optional days (not a single exclusive unit).
 */

function assignAge(patient, raw, key) {
  if (String(raw ?? "").trim() === "") return;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 0) patient[key] = n;
}

export function parseAgeParts({ ageYears = "", ageMonths = "", ageDays = "" } = {}) {
  const patient = {};
  assignAge(patient, ageYears, "age_years");
  assignAge(patient, ageMonths, "age_months");
  assignAge(patient, ageDays, "age_days");
  return patient;
}

export function hasAgeParts(parts) {
  return Object.keys(parseAgeParts(parts)).length > 0;
}
