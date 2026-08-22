/**
 * On-device draft from pixels when Claude/Base44 vision is unavailable.
 * Measurements and morphology only. No named diagnosis.
 */

import { extractDermatologyFeatures } from "../medscan/vision/dermatologyFeatures.js";
import { extractRadiologyFeatures } from "../medscan/vision/radiologyFeatures.js";
import { VISION_BILLING_GROUP } from "./billingGroups.js";

const DRAFT = "draft_needs_verification";
const NEXT = [
  "טיוטה מהתמונה במכשיר זה — דורשת אימות רופא. אינה אבחנה.",
  "כלי הדימות יוכלו להיכנס יחד לקבוצת התשלום כשתכריזו על כך.",
];

export function onDeviceSkinEngine(imageData, { language = "he" } = {}) {
  const morphology = imageData ? extractDermatologyFeatures(imageData) : { ok: false, reason: "no_image" };
  const mean = morphology.color?.mean_rgb;
  const color = morphology.ok && mean
    ? `RGB ${mean.r}/${mean.g}/${mean.b}`
    : "לא נמדד";
  const structured = {
    is_relevant: true,
    interpretable: Boolean(morphology.ok),
    confidence: 30,
    clinical_urgency: "Normal",
    primary_impression: "מדידה מורפולוגית מהתמונה במכשיר — טיוטה, אינה אבחנת עור.",
    dermatological_descriptors: {
      primary_lesions: [],
      secondary_lesions: [],
      configuration: morphology.borders?.irregular ? "גבול לא סדיר במדידת פיקסלים" : "גבול יחסית סדיר במדידת פיקסלים",
      distribution_pattern: morphology.ok
        ? `${morphology.distribution?.occupied_quadrants ?? 0} רביעים בשדה`
        : "לא נמדד",
      color_and_border: color,
    },
    differential_diagnoses: [],
    critical_red_flags: [],
    recommended_next_steps: NEXT,
    dermoscopy: { is_dermoscopic: false },
  };
  return {
    abstain: false,
    structured,
    morphology,
    warnings: morphology.ok ? [] : [`מדידה מורפולוגית נכשלה (${morphology.reason || "unknown"}) — אין ניחוש נגע.`],
    confidence: 30,
    uncertaintyLevel: "high",
    dermoscopy: null,
    suspected_allergens: [],
    on_device: true,
    billing_group: VISION_BILLING_GROUP.id,
    verification_status: DRAFT,
    locale: language,
  };
}

export function onDeviceRadiologyEngine(imageData, { language = "he" } = {}) {
  const morphology = imageData ? extractRadiologyFeatures(imageData) : { ok: false, reason: "no_image" };
  const dens = morphology.densities || {};
  const structured = {
    is_relevant: true,
    interpretable: Boolean(morphology.ok),
    confidence: 30,
    clinical_urgency: "Normal",
    primary_impression: "מדידת צפיפויות יחסיות מהתמונה במכשיר — טיוטה, אינה פענוח רדיולוגי.",
    image_metadata: {
      modality_detected: "לא נקבע בלי מנוע ראייה",
      anatomical_region: "לא נקבע",
      technical_quality: morphology.ok ? "פיקסלים נקראו במכשיר" : "לא ניתן לקרוא",
    },
    systematic_findings: morphology.ok
      ? [
        { anatomical_zone: "ספקטרום פיקסלים", status: "Measured", description: `לוסנטי ${dens.lucent_like ?? "—"} / בינוני ${dens.intermediate_like ?? "—"} / צפוף ${dens.dense_like ?? "—"}` },
        { anatomical_zone: "מבנה בהיר (חשד גרמי)", status: "Measured", description: `${morphology.bone_structure?.connected_components ?? 0} רכיבים מחוברים` },
        { anatomical_zone: "מרקם לוסנטי", status: "Draft", description: morphology.pulmonary_infiltrate_texture?.elevated ? "שונות מקומית מוגברת (טיוטה, לא תסנין)" : "לא מוגבר במדידה זו" },
      ]
      : [],
    key_abnormalities: [],
    differential_diagnoses: [],
    critical_red_flags: [],
    measurements: [],
    regions: [],
    recommended_next_steps: NEXT,
  };
  return {
    abstain: false,
    structured,
    morphology,
    measurement_eval: [],
    warnings: morphology.ok ? [] : [`מדידת הדמיה נכשלה (${morphology.reason || "unknown"}) — אין ניחוש ממצא.`],
    confidence: 30,
    uncertaintyLevel: "high",
    on_device: true,
    billing_group: VISION_BILLING_GROUP.id,
    verification_status: DRAFT,
    locale: language,
  };
}

export function onDeviceEcgReading({ digitize = null, language = "he" } = {}) {
  const hr = Number(digitize?.hr_measured ?? digitize?.rate?.hr_bpm);
  const hasHr = digitize?.ok === true && Number.isFinite(hr);
  return {
    abstain: false,
    measured: {
      measurable: hasHr,
      rate: hasHr ? { hr_bpm: hr } : {},
      intervals: {},
      qtc: {},
      axis: {},
    },
    perception: {
      quality: { is_ecg: true, interpretable: hasHr },
      calibration: { reliable: Boolean(digitize?.ok) },
    },
    interpretation: {
      summary_he: hasHr
        ? `דופק משוער מהתמונה במכשיר: ${hr} לדקה — טיוטה בלבד, לא פענוח אק״ג.`
        : "לא זוהו כיול ונקודות-ציון בביטחון. אין מספרי PR/QRS/QT מהתמונה.",
      interval_warnings: ["טיוטה במכשיר. אינה פענוח אק״ג ואינה אבחנה."],
    },
    pathologyMatch: { candidates: [], maxSeverity: "normal", mustNotMiss: [] },
    on_device: true,
    billing_group: VISION_BILLING_GROUP.id,
    verification_status: DRAFT,
    locale: language,
  };
}
