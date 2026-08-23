/**
 * Pre-visit checklists by service type — reduces broken visits and anxiety.
 * needs_verification — facility-specific rules may differ.
 */

import { SERVICE_META } from "./appointmentCatalog.js";

/** @typedef {{ id: string, labelKey: string, critical?: boolean }} PrepItem */

/** Extended checklist items beyond short prepKeys in SERVICE_META. */
export const VISIT_PREP_ITEMS = Object.freeze({
  pediatrician: [
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "symptoms", labelKey: "prep.item_symptoms_log", critical: true },
    { id: "meds", labelKey: "prep.item_meds_list" },
    { id: "allergies", labelKey: "prep.item_allergies" },
    { id: "prior_labs", labelKey: "prep.item_prior_labs" },
    { id: "questions", labelKey: "prep.item_questions_list", critical: true },
    { id: "child_comfort", labelKey: "prep.item_child_comfort" },
  ],
  specialist: [
    { id: "referral", labelKey: "prep.item_referral_valid", critical: true },
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "prior_imaging", labelKey: "prep.item_prior_imaging_disc" },
    { id: "prior_reports", labelKey: "prep.item_prior_reports" },
    { id: "meds", labelKey: "prep.item_meds_list" },
    { id: "questions", labelKey: "prep.item_questions_list", critical: true },
  ],
  imaging: [
    { id: "referral", labelKey: "prep.item_referral_valid", critical: true },
    { id: "hitchayvut", labelKey: "prep.item_hitchayvut", critical: true },
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "fasting", labelKey: "prep.item_fasting_check" },
    { id: "contrast_allergy", labelKey: "prep.item_contrast_allergy", critical: true },
    { id: "metal_implants", labelKey: "prep.item_metal_implants" },
    { id: "sedation_plan", labelKey: "prep.item_sedation_plan" },
    { id: "adult_escort", labelKey: "prep.item_adult_escort", critical: true },
    { id: "prior_disc", labelKey: "prep.item_prior_imaging_disc" },
  ],
  hearing: [
    { id: "referral", labelKey: "prep.item_referral_valid", critical: true },
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "no_noise_exposure", labelKey: "prep.item_quiet_before_test" },
    { id: "ear_health", labelKey: "prep.item_no_active_otitis" },
    { id: "questions", labelKey: "prep.item_questions_list" },
  ],
  lab: [
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "fasting", labelKey: "prep.item_fasting_check" },
    { id: "hydration", labelKey: "prep.item_hydration" },
    { id: "request_form", labelKey: "prep.item_lab_request", critical: true },
    { id: "timing", labelKey: "prep.item_morning_draw" },
  ],
  urgent_care: [
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "symptoms_now", labelKey: "prep.item_symptoms_now", critical: true },
    { id: "meds", labelKey: "prep.item_meds_list" },
    { id: "allergies", labelKey: "prep.item_allergies", critical: true },
    { id: "red_flags", labelKey: "prep.item_red_flags_review", critical: true },
  ],
  emergency: [
    { id: "call_101", labelKey: "prep.item_call_101", critical: true },
    { id: "do_not_drive_alone", labelKey: "prep.item_escort_emergency", critical: true },
  ],
  mental_health: [
    { id: "referral", labelKey: "prep.item_referral_valid" },
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "school_reports", labelKey: "prep.item_school_reports" },
    { id: "prior_eval", labelKey: "prep.item_prior_eval" },
    { id: "questions", labelKey: "prep.item_questions_list" },
  ],
  physio: [
    { id: "referral", labelKey: "prep.item_referral_valid", critical: true },
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "comfortable_clothes", labelKey: "prep.item_comfort_clothes" },
    { id: "imaging_if_any", labelKey: "prep.item_prior_imaging_disc" },
  ],
  dental: [
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "pain_log", labelKey: "prep.item_dental_pain_log" },
    { id: "meds", labelKey: "prep.item_meds_list" },
  ],
  other: [
    { id: "id", labelKey: "prep.item_id", critical: true },
    { id: "referral", labelKey: "prep.item_referral_if_needed" },
    { id: "questions", labelKey: "prep.item_questions_list" },
  ],
});

export const PREP_CHECK_STATE_KEY = "medscan_prep_check_v1";

export function prepItemsForService(serviceId) {
  return VISIT_PREP_ITEMS[serviceId] || VISIT_PREP_ITEMS.other;
}

export function prepProgress(serviceId, checkedIds = []) {
  const items = prepItemsForService(serviceId);
  const set = new Set(checkedIds || []);
  const critical = items.filter((i) => i.critical);
  const criticalDone = critical.filter((i) => set.has(i.id)).length;
  const totalDone = items.filter((i) => set.has(i.id)).length;
  return {
    total: items.length,
    done: totalDone,
    criticalTotal: critical.length,
    criticalDone,
    ready: critical.length === 0 ? totalDone === items.length : criticalDone === critical.length,
    pct: items.length ? Math.round((totalDone / items.length) * 100) : 0,
  };
}

export function loadPrepChecks(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return {};
  try {
    const raw = store.getItem(PREP_CHECK_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Keyed by serviceId — array of checked item ids. */
export function savePrepChecks(state, storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (store) store.setItem(PREP_CHECK_STATE_KEY, JSON.stringify(state || {}));
  return state;
}

export function togglePrepItem(serviceId, itemId, storage) {
  const all = loadPrepChecks(storage);
  const cur = new Set(all[serviceId] || []);
  if (cur.has(itemId)) cur.delete(itemId);
  else cur.add(itemId);
  all[serviceId] = [...cur];
  savePrepChecks(all, storage);
  return all[serviceId];
}

export function serviceLabelKey(serviceId) {
  return SERVICE_META[serviceId]?.labelKey || SERVICE_META.other.labelKey;
}
