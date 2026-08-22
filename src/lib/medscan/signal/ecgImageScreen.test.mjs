/**
 * node src/lib/medscan/signal/ecgImageScreen.test.mjs
 */
import { screenEcgImageData } from "./ecgImageScreen.js";
import { digitizeFromImageData } from "../../ecgDigitize.js";
import { onDeviceEcgReading } from "../../clinic/onDeviceVision.js";
import { assembleEcgResult } from "../engines/ecgResultBuilder.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

function fillWhite(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 236;
    data[i + 2] = 236;
    data[i + 3] = 255;
  }
}

function ink(data, w, h, x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const i = (y * w + x) * 4;
  data[i] = 18;
  data[i + 1] = 18;
  data[i + 2] = 18;
}

function makeTraceImage({ elevate = false } = {}) {
  const w = 480;
  const h = 220;
  const data = new Uint8ClampedArray(w * h * 4);
  fillWhite(data);
  const period = 80;
  for (let x = 0; x < w; x++) {
    const phase = x % period;
    let y = 150;
    if (phase >= 18 && phase <= 22) y = 36;
    else if (elevate && phase > 22 && phase < 52) y = 88;
    ink(data, w, h, x, y);
    ink(data, w, h, x, y + 1);
  }
  return { width: w, height: h, data };
}

console.log("\nECG image ST screen\n");

t("בלי פיקסלים — אין סריקה", () => {
  assert(screenEcgImageData(null).ok === false);
  assert(screenEcgImageData({}).ok === false);
});

t("עליית ST אחרי R בכמה פעימות — סמן חשד, בלי שם אוטם", () => {
  const s = screenEcgImageData(makeTraceImage({ elevate: true }));
  assert(s.ok === true);
  assert(s.possible_st_elevation === true, JSON.stringify(s.bands));
  assert(s.note_he.includes("אינה אבחנת אוטם"));
});

t("קו בסיס בלי עלייה — אין חשד ST", () => {
  const s = screenEcgImageData(makeTraceImage({ elevate: false }));
  assert(s.ok === true);
  assert(s.possible_st_elevation === false, JSON.stringify(s.bands));
});

t("כיול רשת ורודה מחזיר מרווח משבצת", () => {
  const w = 200;
  const h = 80;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const grid = x % 8 === 0;
      data[i] = grid ? 220 : 255;
      data[i + 1] = grid ? 160 : 255;
      data[i + 2] = grid ? 160 : 255;
      data[i + 3] = 255;
    }
  }
  for (let x = 0; x < w; x++) {
    const y = 40 + Math.round(8 * Math.sin(x / 6));
    const i = (y * w + x) * 4;
    data[i] = 10; data[i + 1] = 10; data[i + 2] = 10;
  }
  const d = digitizeFromImageData({ width: w, height: h, data });
  assert(d.quality?.grid_px === 8 || d.calibration?.px_per_small_box === 8, JSON.stringify(d));
});

t("בלי תמונה הכלי לא כותב שאין ממצא", () => {
  const ui = assembleEcgResult(onDeviceEcgReading({}), [], { locale: "he" });
  assert(!/ללא ממצא פתולוגי/.test(ui.summary));
});

t("תמונת עליית ST במכשיר עולה דגל ולא נקראת תקינה", () => {
  const reading = onDeviceEcgReading({ imageData: makeTraceImage({ elevate: true }) });
  const ui = assembleEcgResult(reading, [], { locale: "he" });
  assert(reading.pathologyMatch.candidates.some((c) => c.key === "st_change_screen"));
  assert(ui.severity === "urgent", ui.severity);
  assert(!/ללא ממצא פתולוגי/.test(ui.summary));
  assert(!/STEMI|myocardial infarction/i.test(ui.summary));
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
