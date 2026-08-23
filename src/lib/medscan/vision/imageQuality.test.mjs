/**
 * node src/lib/medscan/vision/imageQuality.test.mjs
 */
import { assessImageQuality, laplacianVariance, qualitySummaryHe } from "./imageQuality.js";
import { onDeviceEcgReading, onDeviceSkinEngine } from "../../clinic/onDeviceVision.js";
import { assembleEcgResult } from "../engines/ecgResultBuilder.js";
import { atlasByKey, withAtlasFallback, ECG_ATLAS, SKIN_ATLAS, RADIOLOGY_ATLAS } from "../knowledge/referenceAtlas.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

function makeImage(w, h, pixel) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

/** Crisp alternating bars, inside the exposure range — high Laplacian energy. */
const sharpImage = (w = 640, h = 640) => makeImage(w, h, (x) => (x % 2 === 0 ? [40, 40, 40] : [225, 225, 225]));
/** Smooth gradient — nothing in focus. */
const blurredImage = (w = 640, h = 640) => makeImage(w, h, (x) => {
  const v = 110 + Math.round(20 * Math.sin(x / 40));
  return [v, v, v];
});

console.log("\nImage quality gate\n");

t("קלט לא תקין נכשל סגור", () => {
  assert(assessImageQuality(null).ok === false);
  assert(assessImageQuality({ width: 2, height: 2, data: new Uint8ClampedArray(16) }).ok === false);
});

t("תמונה חדה מקבלת שונות לפלסיאן גבוהה", () => {
  const q = assessImageQuality(sharpImage(), { modality: "skin" });
  assert(q.ok === true);
  assert(q.sharpness > 1000, "sharpness=" + q.sharpness);
  assert(q.verdict === "good", JSON.stringify(q.issues_he));
});

t("תמונה מטושטשת מסומנת כלא שמישה", () => {
  const q = assessImageQuality(blurredImage(), { modality: "skin" });
  assert(q.ok === true);
  assert(q.usable === false, "blurred must be unusable: " + q.sharpness);
  assert(q.issues.some((i) => i.key === "blurred"));
  assert(/צלמו שוב/.test(qualitySummaryHe(q)));
});

t("תמונה קטנה מדי לאק״ג מסומנת ברזולוציה", () => {
  const q = assessImageQuality(sharpImage(200, 200), { modality: "ecg" });
  assert(q.issues.some((i) => i.key === "too_small"), JSON.stringify(q.issues_he));
});

t("בוהק נרחב מסומן", () => {
  const img = makeImage(400, 400, (x, y) => (y < 300 ? [252, 252, 252] : (x % 2 ? [40, 40, 40] : [225, 225, 225])));
  const q = assessImageQuality(img, { modality: "skin" });
  assert(q.issues.some((i) => i.key === "glare"), JSON.stringify(q.issues_he));
});

t("לפלסיאן מחזיר null לתמונה זעירה", () => {
  assert(laplacianVariance(new Uint8Array(4), 2, 2) === null);
});

t("אק״ג מטושטש לא מריץ סריקת ST ולא נקרא תקין", () => {
  const reading = onDeviceEcgReading({ imageData: blurredImage(600, 600) });
  assert(reading.image_quality.usable === false);
  assert(reading.pixel_screen.ok === false);
  assert(reading.pixel_screen.reason === "image_quality_insufficient");
  const ui = assembleEcgResult(reading, [], { locale: "he" });
  assert(!/ללא ממצא פתולוגי/.test(ui.summary), ui.summary);
  assert(ui.severity !== "normal");
});

t("עור: אזהרת איכות נכנסת לטיוטה", () => {
  const engine = onDeviceSkinEngine(blurredImage(400, 400));
  assert(engine.image_quality.verdict === "unusable");
  assert(engine.warnings.some((w) => /מטושטשת|איכות/.test(w)), JSON.stringify(engine.warnings));
});

console.log("\nReference atlas\n");

t("לכל שלוש המודאליות יש מקרי ייחוס", () => {
  assert(ECG_ATLAS.length >= 8);
  assert(SKIN_ATLAS.length >= 5);
  assert(RADIOLOGY_ATLAS.length >= 5);
});

t("אף רשומת ייחוס אינה נושאת תמונה בלי רישיון", () => {
  for (const e of [...ECG_ATLAS, ...SKIN_ATLAS, ...RADIOLOGY_ATLAS]) {
    assert(!e.image_url, "seed entry must not ship an image: " + e.key);
    assert(e.verification_status === "draft_needs_verification", e.key);
  }
});

t("חיפוש לפי מפתח מחזיר את דפוס הייחוס", () => {
  assert(atlasByKey("ecg", "stemi").diagnosis === "STEMI pattern");
  assert(atlasByKey("ecg", "no_such_key") === null);
  assert(atlasByKey("skin", "melanoma").urgent === true);
});

t("מאגר מארח קודם לזרע", () => {
  const merged = withAtlasFallback("ecg", [{ title: "hosted", diagnosis: "STEMI", image_url: "http://x/a.png" }]);
  assert(merged[0].title === "hosted");
  assert(merged.length === ECG_ATLAS.length + 1);
});

t("STEMI מקבל ייחוס טקסטואלי גם כשאין תמונה במאגר", () => {
  const reading = {
    measured: { measurable: true, rate: { hr_bpm: 70 }, intervals: {}, qtc: {}, axis: {} },
    interpretation: { rhythm: { rhythm_he: "קצב סינוס" }, interval_warnings: [] },
    perception: { morphology: { st_elevation_leads: [{ lead: "II", mm: 3 }] } },
    pathologyMatch: {
      candidates: [{ key: "stemi", name_he: "דפוס STEMI", name_en: "STEMI pattern", severity: "red", score: 90, criteria: [] }],
      maxSeverity: "red",
      mustNotMiss: [],
    },
  };
  const ui = assembleEcgResult(reading, [], { locale: "he" });
  const row = ui.matchedCases[0];
  assert(row.kb_reference, "reference name attached: " + JSON.stringify(row));
  assert(!row.image_url, "no image without a license");
  assert(/contiguous/i.test(row.reference_features), row.reference_features);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
