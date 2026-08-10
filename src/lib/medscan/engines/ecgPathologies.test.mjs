/**
 * Tests for the deterministic ECG pathology matcher.
 * Run: node src/lib/medscan/engines/ecgPathologies.test.mjs
 */
import { matchPathologies, buildPathologyBlock, ECG_PATHOLOGIES } from "./ecgPathologies.js";

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log("  ✓ " + name); pass++; }
  catch (e) { console.log("  ✗ " + name + "\n      " + e.message); fail++; }
};
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
const has = (match, key) => match.candidates.some((c) => c.key === key);

console.log("\nECG Pathology Matcher (deterministic)\n");

t("תרשים תקין — אין דפוס פתולוגי (לא פריקרדיטיס, לא STEMI)", () => {
  const f = { hr: 75, pr_ms: 150, qrs_ms: 90, qtc_ms: 410, axis_deg: 45,
    rhythm_regular: true, p_before_qrs: true, conduction_type: "narrow",
    st_elev: [], st_dep: [], t_inv: [], path_q: [], pr_depression: false, age_years: 30 };
  const m = matchPathologies(f);
  assert(m.candidates.length === 0, "normal ECG should match nothing, got: " + m.candidates.map(c=>c.key).join(","));
  assert(m.maxSeverity === "normal", "severity should be normal");
  assert(!has(m, "pericarditis_pattern"), "must NOT flag pericarditis on normal");
});

t("STEMI תחתון — עליית ST ב-II/III/aVF", () => {
  const f = { conduction_type: "narrow", st_elev: [{lead:"II",mm:2},{lead:"III",mm:2.5},{lead:"aVF",mm:2}] };
  const m = matchPathologies(f);
  assert(has(m, "stemi"), "should detect STEMI");
  const s = m.candidates.find(c=>c.key==="stemi");
  assert(s.territory === "inferior", "territory should be inferior, got " + s.territory);
  assert(s.severity === "red", "STEMI severity red");
  assert(m.mustNotMiss.length >= 1, "STEMI in mustNotMiss");
});

t("עליית ST בליד בודד — לא STEMI (דורש ≥2 סמוכים)", () => {
  const f = { conduction_type: "narrow", st_elev: [{lead:"III",mm:2}] };
  const m = matchPathologies(f);
  assert(!has(m, "stemi"), "single lead STE should not be STEMI");
});

t("LBBB + עליית ST — לא STEMI דחוף, אלא Sgarbossa", () => {
  const f = { conduction_type: "LBBB", qrs_ms: 140, v1_pattern:"dominant_s", lateral_broad_r:true,
    st_elev: [{lead:"II",mm:2},{lead:"III",mm:2},{lead:"aVF",mm:2}] };
  const m = matchPathologies(f);
  assert(!has(m, "stemi"), "STEMI must be suppressed under LBBB");
  assert(has(m, "stemi_in_lbbb_sgarbossa"), "should emit Sgarbossa candidate");
  assert(has(m, "lbbb"), "should also flag LBBB");
});

t("פריקרדיטיס — עליית ST מפושטת + ירידת PR", () => {
  const f = { conduction_type: "narrow", pr_depression: true,
    st_elev: [{lead:"II",mm:1.5},{lead:"aVF",mm:1.5},{lead:"V5",mm:1.5},{lead:"I",mm:1}] };
  const m = matchPathologies(f);
  assert(has(m, "pericarditis_pattern"), "should detect pericarditis pattern");
});

t("עליית ST מפושטת בלי ירידת PR — לא פריקרדיטיס", () => {
  const f = { conduction_type: "narrow", pr_depression: false,
    st_elev: [{lead:"II",mm:1.5},{lead:"aVF",mm:1.5},{lead:"V5",mm:1.5}] };
  const m = matchPathologies(f);
  assert(!has(m, "pericarditis_pattern"), "no PR depression → no pericarditis");
});

t("QTc מוארך >500 — דגל אדום (Torsades)", () => {
  const m = matchPathologies({ qtc_ms: 520 });
  assert(has(m, "long_qt"), "should flag long QT");
  assert(m.candidates.find(c=>c.key==="long_qt").severity === "red", "QTc>500 red");
});

t("QTc גבולי 470 — צהוב", () => {
  const m = matchPathologies({ qtc_ms: 470 });
  assert(m.candidates.find(c=>c.key==="long_qt").severity === "yellow", "QTc 470 yellow");
});

t("חסם AV דרגה 1 — PR>200", () => {
  const m = matchPathologies({ pr_ms: 240, p_before_qrs: true });
  assert(has(m, "first_degree_av_block"), "PR 240 → 1st deg AV block");
});

t("טכיקרדיה סינוסלית לפי גיל — תינוק HR 170", () => {
  const m = matchPathologies({ hr: 170, p_before_qrs: true, age_years: 0.5 });
  assert(has(m, "sinus_tachycardia"), "infant HR170 → sinus tach");
  const m2 = matchPathologies({ hr: 170, p_before_qrs: true, age_years: 30 });
  assert(has(m2, "sinus_tachycardia"), "adult HR170 → sinus tach");
  const m3 = matchPathologies({ hr: 90, p_before_qrs: true, age_years: 0.5 });
  assert(!has(m3, "sinus_tachycardia"), "infant HR90 is NOT tachy");
});

t("פרפור עליות — לא-סדיר בלי P", () => {
  const m = matchPathologies({ rhythm_regular: false, p_before_qrs: false });
  assert(has(m, "atrial_fibrillation"), "irregular no-P → AF");
});

t("היפוך T ילדי (V1-V3, גיל<16) — מסומן כתקין-לגיל", () => {
  const m = matchPathologies({ t_inv: ["V1","V2","V3"], age_years: 8 });
  const c = m.candidates.find(x=>x.key==="t_inversion");
  assert(c && c.severity === "normal", "juvenile T pattern should be normal-for-age");
  const m2 = matchPathologies({ t_inv: ["V4","V5","V6"], age_years: 40 });
  assert(m2.candidates.find(x=>x.key==="t_inversion").severity === "yellow", "adult lateral T inv yellow");
});

t("buildPathologyBlock — ריק → הודעת 'בגבולות הנורמה'", () => {
  const s = buildPathologyBlock(matchPathologies({ hr: 70, pr_ms: 150, qrs_ms: 90, qtc_ms: 410, p_before_qrs:true, rhythm_regular:true, conduction_type:"narrow" }));
  assert(/לא זוהה דפוס/.test(s), "empty block message");
});

t("כל ערך בקטלוג — source_anchor ו-name_he קיימים", () => {
  for (const p of ECG_PATHOLOGIES) {
    assert(p.source_anchor && p.name_he && typeof p.evaluate === "function", "missing field in " + p.key);
  }
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail > 0) process.exit(1);
