/**
 * node src/lib/medscan/knowledge/onDeviceAtlasHints.test.mjs
 */
import { skinMorphologyAtlasHints, radiologyMorphologyAtlasHints } from "./onDeviceAtlasHints.js";
import { assembleSkinResult } from "../engines/skinResultBuilder.js";
import { assembleRadiologyResult } from "../engines/radiologyResultBuilder.js";
import { onDeviceSkinEngine, onDeviceRadiologyEngine } from "../../clinic/onDeviceVision.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

function makeRgba(w, h, pixel) {
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

console.log("\nOn-device atlas hints\n");

t("עור: נגע לא סימטרי מחזיר דפוסי ייחוס ולא אבחנה", () => {
  const img = makeRgba(80, 80, (x, y) => {
    const dx = x - 40;
    const dy = y - 40;
    if (dx * dx + dy * dy < 14 * 14) return [30, 20, 15];
    return [220, 185, 160];
  });
  const engine = onDeviceSkinEngine(img);
  const ui = assembleSkinResult(engine, [], { fileUrl: "blob:test", locale: "he" });
  assert(ui.matchedCases.length > 0, "expected reference rows");
  assert(ui.matchedCases.every((m) => m.reference_only), JSON.stringify(ui.matchedCases));
  assert(!/מלנומה/.test(ui.summary), "summary must stay incomplete headline");
});

t("רדיולוגיה: מדידות מחזירות ייחוס ולא שורת primary_impression", () => {
  const img = makeRgba(64, 64, (x, y) => {
    if (x >= 28 && x <= 36) return [230, 230, 230];
    if (x < 22 || x > 42) return [20, 20, 25];
    return [90, 90, 95];
  });
  const engine = onDeviceRadiologyEngine(img);
  const ui = assembleRadiologyResult(engine, [], { fileUrl: "blob:test", locale: "he" });
  assert(!(ui.matchedCases || []).some((m) => /אין פענוח מלא/.test(m.title || "")), JSON.stringify(ui.matchedCases));
  if (ui.matchedCases.length) {
    assert(ui.matchedCases.every((m) => m.reference_only));
  }
});

t("hints מסומנים reference_only", () => {
  const hints = skinMorphologyAtlasHints({
    ok: true,
    borders: { irregular: true },
    color: { variegated: true, cluster_count: 4 },
    asymmetry_index: 0.4,
    satellite_lesions: { count: 1 },
    distribution: { occupied_quadrants: 1 },
  });
  assert(hints.length > 0);
  assert(hints[0].reference_only === true);
  assert(hints[0].confidence <= 50);
});

t("רדיולוגיה: מרקם מוגבר מצביע לדפוסי חזה", () => {
  const hints = radiologyMorphologyAtlasHints({
    ok: true,
    densities: { lucent_like: 0.4, intermediate_like: 0.4, dense_like: 0.05 },
    pulmonary_infiltrate_texture: { elevated: true },
    bone_structure: { connected_components: 1 },
  });
  assert(hints.some((h) => /תסנין|consolidation|lobar/i.test(h.title + h.diagnosis)), JSON.stringify(hints));
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
