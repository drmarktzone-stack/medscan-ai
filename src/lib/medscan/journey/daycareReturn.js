/**
 * Can the child return to gan/school tomorrow?
 * Deterministic triage — needs_verification; follows common Israeli gan norms, not law.
 */

const isNum = (x) => typeof x === "number" && Number.isFinite(x);

export function ageInMonths({ ageYears, ageMonths, ageDays }) {
  const y = Number(ageYears) || 0;
  const m = Number(ageMonths) || 0;
  const d = Number(ageDays) || 0;
  return y * 12 + m + (d > 0 ? 0.25 : 0);
}

/**
 * @param {object} p
 * @param {number} [p.ageYears]
 * @param {number} [p.ageMonths]
 * @param {number} [p.feverC] current or last 24h max
 * @param {boolean} [p.feverFree24h]
 * @param {boolean} [p.vomiting]
 * @param {boolean} [p.diarrhea]
 * @param {boolean} [p.rash]
 * @param {boolean} [p.rashSpreading]
 * @param {boolean} [p.eyeDischarge]
 * @param {boolean} [p.cough]
 * @param {boolean} [p.lethargic]
 * @param {boolean} [p.onAntibiotics]
 * @param {number} [p.abxDays] days on antibiotics
 * @param {boolean} [p.doctorCleared]
 */
export function evaluateDaycareReturn(p = {}) {
  const months = ageInMonths(p);
  const infant = months < 3;
  const toddler = months < 12;

  const red = [];
  const yellow = [];
  const green = [];

  if (p.lethargic) red.push("gan.red_lethargy");
  if (isNum(p.feverC) && p.feverC >= 38.5 && !p.feverFree24h) red.push("gan.red_fever");
  if (infant && isNum(p.feverC) && p.feverC >= 38.0) red.push("gan.red_infant_fever");
  if (p.vomiting && !p.feverFree24h) yellow.push("gan.yellow_vomit");
  if (p.diarrhea && !p.feverFree24h) yellow.push("gan.yellow_diarrhea");
  if (p.rashSpreading) red.push("gan.red_rash_spread");
  if (p.eyeDischarge && !p.doctorCleared) yellow.push("gan.yellow_eye");
  if (p.cough && toddler && !p.feverFree24h) yellow.push("gan.yellow_cough_young");

  if (p.onAntibiotics && (p.abxDays == null || p.abxDays < 1)) {
    yellow.push("gan.yellow_abx_start");
  }

  let verdict;
  let verdictKey;
  let ganNoteKey;

  if (red.length) {
    verdict = "stay_home";
    verdictKey = "gan.verdict_stay";
    ganNoteKey = "gan.note_stay";
  } else if (yellow.length && !p.doctorCleared) {
    verdict = "maybe";
    verdictKey = "gan.verdict_maybe";
    ganNoteKey = "gan.note_maybe";
  } else if (p.feverFree24h || p.doctorCleared) {
    verdict = "likely_ok";
    verdictKey = "gan.verdict_ok";
    ganNoteKey = "gan.note_ok";
  } else if (isNum(p.feverC) && p.feverC < 38 && !p.vomiting && !p.diarrhea) {
    verdict = "likely_ok";
    verdictKey = "gan.verdict_ok_mild";
    ganNoteKey = "gan.note_ok_mild";
  } else {
    verdict = "maybe";
    verdictKey = "gan.verdict_maybe";
    ganNoteKey = "gan.note_maybe";
  }

  return {
    verdict,
    verdictKey,
    ganNoteKey,
    red,
    yellow,
    green,
    disclaimer: "gan.disclaimer",
    needsVerification: true,
  };
}

export function ganMessageForGanenet(result, childName, t) {
  const name = childName || t("gan.child_default");
  const status = t(result.ganNoteKey);
  return t("gan.message_template", { name, status });
}
