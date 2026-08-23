/**
 * On-device draft from pixels when Claude/Base44 vision is unavailable.
 * Measurements and morphology only. No named diagnosis.
 */

import { extractDermatologyFeatures } from "../medscan/vision/dermatologyFeatures.js";
import { extractRadiologyFeatures } from "../medscan/vision/radiologyFeatures.js";
import { digitizeFromImageData } from "../ecgDigitize.js";
import { screenEcgImageData } from "../medscan/signal/ecgImageScreen.js";
import { assessImageQuality, qualitySummaryHe } from "../medscan/vision/imageQuality.js";
import { INCOMPLETE_HEADLINE_HE, INCOMPLETE_GUIDELINE_HE } from "./incompleteVision.js";
import { VISION_BILLING_GROUP } from "./billingGroups.js";

const DRAFT = "draft_needs_verification";
const NEXT = [
  "טיוטה מהתמונה במכשיר זה — דורשת אימות רופא. אינה אבחנה.",
  "כלי הדימות יוכלו להיכנס יחד לקבוצת התשלום כשתכריזו על כך.",
];

export function onDeviceSkinEngine(imageData, { language = "he" } = {}) {
  const quality = imageData ? assessImageQuality(imageData, { modality: "skin" }) : { ok: false, reason: "no_image" };
  const morphology = imageData ? extractDermatologyFeatures(imageData) : { ok: false, reason: "no_image" };
  const mean = morphology.color?.mean_rgb;
  const color = morphology.ok && mean
    ? `RGB ${mean.r}/${mean.g}/${mean.b}`
    : "לא נמדד";
  const structured = {
    is_relevant: true,
    interpretable: Boolean(morphology.ok),
    confidence: 30,
    clinical_urgency: "Unknown",
    primary_impression: INCOMPLETE_HEADLINE_HE.skin,
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
    image_quality: quality.ok ? quality : null,
  };
  return {
    abstain: false,
    structured,
    morphology,
    image_quality: quality.ok ? quality : null,
    warnings: [
      ...(morphology.ok ? [] : [`מדידה מורפולוגית נכשלה (${morphology.reason || "unknown"}) — אין ניחוש נגע.`]),
      ...(quality.ok && quality.verdict !== "good" ? [qualitySummaryHe(quality)] : []),
    ],
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
  const quality = imageData ? assessImageQuality(imageData, { modality: "radiology" }) : { ok: false, reason: "no_image" };
  const morphology = imageData ? extractRadiologyFeatures(imageData) : { ok: false, reason: "no_image" };
  const dens = morphology.densities || {};
  const structured = {
    is_relevant: true,
    interpretable: Boolean(morphology.ok),
    confidence: 30,
    clinical_urgency: "Unknown",
    primary_impression: INCOMPLETE_HEADLINE_HE.radiology,
    image_metadata: {
      modality_detected: "לא נקבע בלי מנוע ראייה",
      anatomical_region: "לא נקבע",
      technical_quality: quality.ok ? qualitySummaryHe(quality) : (morphology.ok ? "פיקסלים נקראו במכשיר" : "לא ניתן לקרוא"),
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
    image_quality: quality.ok ? quality : null,
  };
  return {
    abstain: false,
    structured,
    morphology,
    image_quality: quality.ok ? quality : null,
    measurement_eval: [],
    warnings: [
      ...(morphology.ok ? [] : [`מדידת הדמיה נכשלה (${morphology.reason || "unknown"}) — אין ניחוש ממצא.`]),
      ...(quality.ok && quality.verdict !== "good" ? [qualitySummaryHe(quality)] : []),
    ],
    confidence: 30,
    uncertaintyLevel: "high",
    on_device: true,
    billing_group: VISION_BILLING_GROUP.id,
    verification_status: DRAFT,
    locale: language,
  };
}

function stScreenCandidate(screen) {
  const elev = Boolean(screen?.possible_st_elevation);
  const dep = Boolean(screen?.possible_st_depression);
  if (!elev && !dep) return null;
  return {
    key: "st_change_screen",
    name_he: elev ? "חשד לשינוי מקטע ST בתמונה" : "חשד לשקיעת ST בתמונה",
    name_en: "Uncalibrated ST-segment change on image (screen)",
    severity: "red",
    score: 40,
    criteria: [{ ok: true, text: "סמן פיקסלים יחסי אחרי שיא R — לא מדידת מ״מ" }],
    note_he: INCOMPLETE_GUIDELINE_HE.ecg,
  };
}

export function onDeviceEcgReading({ digitize = null, imageData = null, language = "he" } = {}) {
  const quality = imageData ? assessImageQuality(imageData, { modality: "ecg" }) : { ok: false, reason: "no_image" };
  const usable = quality.ok ? quality.usable : false;
  const fromPixels = (!digitize || digitize.ok === false) && imageData && usable
    ? digitizeFromImageData(imageData)
    : null;
  const cal = (digitize && digitize.ok !== false && digitize) || fromPixels || digitize || null;
  const screen = imageData && usable
    ? screenEcgImageData(imageData, { digitize: cal })
    : { ok: false, reason: quality.ok ? "image_quality_insufficient" : "no_image" };
  const hr = Number(cal?.hr_measured ?? cal?.rate?.hr_bpm);
  const hasHr = cal?.ok === true && Number.isFinite(hr);
  const candidate = stScreenCandidate(screen);
  const candidates = candidate ? [candidate] : [];
  const incomplete = !hasHr || !screen.ok || !candidate;

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
      quality: {
        is_ecg: true,
        interpretable: hasHr || Boolean(screen.ok),
        issues_he: quality.ok ? quality.issues_he : [],
        image_quality: quality.ok ? quality : null,
      },
      calibration: {
        reliable: Boolean(cal?.ok && cal?.calibration?.px_per_small_box),
        paper_speed_mm_s: cal?.calibration?.speed_mm_s,
        sample_rate_hz: cal?.calibration?.sample_rate_hz,
        grid_source: cal?.quality?.grid_source || cal?.calibration?.grid_source,
      },
      morphology: {
        st_elevation_leads: [],
        st_depression_leads: [],
        pixel_st_screen: screen,
      },
    },
    interpretation: {
      summary_he: candidate
        ? `${candidate.name_he}. טיוטה מהתמונה במכשיר — לא אבחנת אוטם.`
        : hasHr
          ? `דופק משוער מהתמונה במכשיר: ${hr} לדקה. ${INCOMPLETE_HEADLINE_HE.ecg}`
          : INCOMPLETE_HEADLINE_HE.ecg,
      interval_warnings: [
        "טיוטה במכשיר. אינה פענוח אק״ג ואינה אבחנה.",
        INCOMPLETE_GUIDELINE_HE.ecg,
        ...(quality.ok && quality.verdict !== "good" ? [qualitySummaryHe(quality)] : []),
      ],
    },
    pathologyMatch: {
      candidates,
      maxSeverity: candidate ? "red" : "incomplete",
      mustNotMiss: candidates,
    },
    incomplete_read: incomplete,
    on_device: true,
    billing_group: VISION_BILLING_GROUP.id,
    verification_status: DRAFT,
    locale: language,
    image_quality: quality.ok ? quality : null,
    pixel_screen: screen,
    digitize: cal || null,
  };
}
