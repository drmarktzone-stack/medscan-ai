/**
 * Medical service types for appointment navigation.
 * Maps follow-up items and clinical contexts to booking categories.
 */

export const SERVICE_IDS = Object.freeze([
  "pediatrician",
  "specialist",
  "imaging",
  "hearing",
  "lab",
  "urgent_care",
  "emergency",
  "mental_health",
  "physio",
  "dental",
  "other",
]);

export const URGENCY_LEVELS = Object.freeze(["emergency", "urgent", "routine"]);

/** Follow-up store type → default service. */
export const FOLLOWUP_TO_SERVICE = Object.freeze({
  results: "pediatrician",
  specialist: "specialist",
  hitchayvut: "imaging",
  referral: "specialist",
  imaging: "imaging",
  other: "other",
});

/** Clinical severity from analysis tools → urgency hint. */
export function urgencyFromSeverity(severity) {
  if (severity === "urgent" || severity === "critical") return "urgent";
  if (severity === "emergency") return "emergency";
  return "routine";
}

export const SERVICE_META = Object.freeze({
  pediatrician: {
    id: "pediatrician",
    labelKey: "appt.service_pediatrician",
    descKey: "appt.service_pediatrician_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_id", "appt.prep_symptoms", "appt.prep_meds"],
  },
  specialist: {
    id: "specialist",
    labelKey: "appt.service_specialist",
    descKey: "appt.service_specialist_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_referral", "appt.prep_id", "appt.prep_prior_results"],
  },
  imaging: {
    id: "imaging",
    labelKey: "appt.service_imaging",
    descKey: "appt.service_imaging_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_referral", "appt.prep_hitchayvut", "appt.prep_prior_imaging"],
  },
  hearing: {
    id: "hearing",
    labelKey: "appt.service_hearing",
    descKey: "appt.service_hearing_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_referral", "appt.prep_id"],
  },
  lab: {
    id: "lab",
    labelKey: "appt.service_lab",
    descKey: "appt.service_lab_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_id", "appt.prep_fasting_if_needed"],
  },
  urgent_care: {
    id: "urgent_care",
    labelKey: "appt.service_urgent",
    descKey: "appt.service_urgent_desc",
    defaultUrgency: "urgent",
    prepKeys: ["appt.prep_id", "appt.prep_symptoms"],
  },
  emergency: {
    id: "emergency",
    labelKey: "appt.service_emergency",
    descKey: "appt.service_emergency_desc",
    defaultUrgency: "emergency",
    prepKeys: [],
  },
  mental_health: {
    id: "mental_health",
    labelKey: "appt.service_mental",
    descKey: "appt.service_mental_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_referral", "appt.prep_id"],
  },
  physio: {
    id: "physio",
    labelKey: "appt.service_physio",
    descKey: "appt.service_physio_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_referral", "appt.prep_id"],
  },
  dental: {
    id: "dental",
    labelKey: "appt.service_dental",
    descKey: "appt.service_dental_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_id"],
  },
  other: {
    id: "other",
    labelKey: "appt.service_other",
    descKey: "appt.service_other_desc",
    defaultUrgency: "routine",
    prepKeys: ["appt.prep_id"],
  },
});

export function serviceFromFollowUpType(followUpType) {
  return FOLLOWUP_TO_SERVICE[followUpType] || "other";
}

export function serviceMeta(serviceId) {
  return SERVICE_META[serviceId] || SERVICE_META.other;
}

/** User-facing time windows — we cannot query real slots without APIs. */
export const PREFERRED_SLOTS = Object.freeze([
  { id: "morning", labelKey: "appt.slot_morning" },
  { id: "afternoon", labelKey: "appt.slot_afternoon" },
  { id: "evening", labelKey: "appt.slot_evening" },
]);
