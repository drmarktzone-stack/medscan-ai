/**
 * Image quality gate — pure ImageData, no DOM, no network.
 *
 * A blurred, dark, or glare-washed photo is the biggest single source of a
 * wrong read. Measure it before any engine runs, and say in words what is
 * wrong so the clinician can re-shoot instead of trusting a bad draft.
 * Nothing here names a diagnosis.
 */

import { isImageDataLike, failClosed, toGrayscale } from "./imagePreprocess.js";

const round2 = (x) => (x == null ? null : Math.round(Number(x) * 100) / 100);

/** Variance of the 4-neighbour Laplacian. Low variance = out of focus. */
export function laplacianVariance(gray, w, h) {
  if (!gray?.length || w < 3 || h < 3) return null;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += v;
      sumSq += v * v;
      n += 1;
    }
  }
  if (!n) return null;
  const mean = sum / n;
  return round2(sumSq / n - mean * mean);
}

export function exposureStats(gray) {
  let sum = 0;
  let dark = 0;
  let bright = 0;
  for (let i = 0; i < gray.length; i++) {
    const g = gray[i];
    sum += g;
    if (g <= 12) dark += 1;
    if (g >= 245) bright += 1;
  }
  const n = gray.length || 1;
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < gray.length; i++) variance += (gray[i] - mean) ** 2;
  return {
    mean_luminance: round2(mean),
    contrast_sd: round2(Math.sqrt(variance / n)),
    clipped_dark_fraction: round2(dark / n),
    clipped_bright_fraction: round2(bright / n),
  };
}

/** Per-modality gates. ECG paper needs fine line detail, so it demands more focus. */
const THRESHOLDS = {
  ecg: { minEdge: 500, sharp: 90, contrast: 18, glare: 0.06, darkClip: 0.35 },
  skin: { minEdge: 320, sharp: 55, contrast: 14, glare: 0.1, darkClip: 0.3 },
  radiology: { minEdge: 400, sharp: 40, contrast: 16, glare: 0.12, darkClip: 0.55 },
};

const REASON_HE = {
  too_small: (n) => `רזולוציה נמוכה מדי (${n} פיקסלים בצלע הקצרה) — פרטים דקים אובדים.`,
  blurred: "התמונה מטושטשת או לא בפוקוס — מדידה מהפיקסלים אינה אמינה.",
  low_contrast: "ניגודיות נמוכה — קשה להפריד בין המבנים לרקע.",
  glare: "החזרי אור/בוהק על חלק מהתמונה — אזור זה אינו נקרא.",
  underexposed: "התמונה כהה מדי — חלק מהשדה אבוד.",
};

/**
 * @param {{width:number,height:number,data:ArrayLike<number>}} imageData
 * @param {{ modality?: 'ecg'|'skin'|'radiology' }} [opts]
 */
export function assessImageQuality(imageData, { modality = "skin" } = {}) {
  if (!isImageDataLike(imageData)) return failClosed("invalid_image");
  const grayPack = toGrayscale(imageData);
  if (!grayPack.ok) return grayPack;

  const { width: w, height: h, gray } = grayPack;
  const th = THRESHOLDS[modality] || THRESHOLDS.skin;
  const sharpness = laplacianVariance(gray, w, h);
  const exposure = exposureStats(gray);
  const minEdge = Math.min(w, h);

  const issues = [];
  if (minEdge < th.minEdge) issues.push({ key: "too_small", text_he: REASON_HE.too_small(minEdge) });
  if (sharpness != null && sharpness < th.sharp) issues.push({ key: "blurred", text_he: REASON_HE.blurred });
  if (exposure.contrast_sd != null && exposure.contrast_sd < th.contrast) {
    issues.push({ key: "low_contrast", text_he: REASON_HE.low_contrast });
  }
  if (exposure.clipped_bright_fraction > th.glare) issues.push({ key: "glare", text_he: REASON_HE.glare });
  if (exposure.clipped_dark_fraction > th.darkClip) issues.push({ key: "underexposed", text_he: REASON_HE.underexposed });

  const blocking = issues.some((i) => i.key === "blurred" || i.key === "low_contrast");
  const verdict = blocking ? "unusable" : issues.length ? "borderline" : "good";

  return {
    ok: true,
    modality,
    verdict,
    usable: verdict !== "unusable",
    width_px: w,
    height_px: h,
    min_edge_px: minEdge,
    sharpness,
    ...exposure,
    issues,
    issues_he: issues.map((i) => i.text_he),
    verification_status: "measured",
    note_he: "מדד איכות תמונה בפיקסלים. אינו פענוח ואינו אבחנה.",
  };
}

/** One sentence for the report header. */
export function qualitySummaryHe(quality) {
  if (!quality?.ok) return "לא ניתן היה למדוד את איכות התמונה.";
  if (quality.verdict === "good") return "איכות התמונה מספיקה למדידה בפיקסלים.";
  if (quality.verdict === "borderline") return `איכות גבולית: ${quality.issues_he.join(" ")}`;
  return `איכות לא מספקת: ${quality.issues_he.join(" ")} צלמו שוב באיכות טובה יותר.`;
}
