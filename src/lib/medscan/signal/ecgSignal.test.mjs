/**
 * node src/lib/medscan/signal/ecgSignal.test.mjs
 */
import {
  parseEcgSignalFile, parseEcgCsv, parseAecgXml, parseMuseXml,
  canonicalLead, deriveLimbLeads, unitScaleToMv, signalReasonHe,
} from "./ecgSignalFile.js";
import { measureEcgSignal, measureReasonHe } from "./ecgSignalMeasure.js";
import { assembleEcgResult } from "../engines/ecgResultBuilder.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

const FS = 500;
const SECONDS = 10;
const N = FS * SECONDS;

/**
 * Synthetic beat: P wave, QRS, T wave, with an optional ST shift in mV.
 * Deliberately simple and fully specified so the expected measurements are known.
 */
function synthLead({ hr = 60, stMv = 0, tMv = 0.3, qrsMs = 90, prMs = 160, qtMs = 380, rMv = 1.2, qMv = 0 } = {}) {
  const out = new Float32Array(N);
  const rr = Math.round((60 / hr) * FS);
  const qrsN = Math.round((qrsMs / 1000) * FS);
  const prN = Math.round((prMs / 1000) * FS);
  const qtN = Math.round((qtMs / 1000) * FS);
  const pN = Math.round(0.08 * FS);

  for (let r = rr; r + qtN < N; r += rr) {
    const qrsOnset = r - Math.round(qrsN / 2);
    const qrsOffset = qrsOnset + qrsN;

    // P wave: half-sine ending 40ms before QRS onset.
    const pEnd = qrsOnset - Math.round(0.04 * FS);
    const pStart = pEnd - pN;
    const pPeakMv = 0.15;
    for (let i = Math.max(0, pStart); i < pEnd; i++) {
      out[i] += pPeakMv * Math.sin((Math.PI * (i - pStart)) / pN);
    }
    void prN;

    // Q dip then R spike then S return.
    const qN = qMv > 0 ? Math.round(0.03 * FS) : 0;
    for (let i = 0; i < qN; i++) out[qrsOnset + i] -= qMv * Math.sin((Math.PI * i) / qN);
    const rStart = qrsOnset + qN;
    const rN = Math.max(2, qrsOffset - rStart);
    for (let i = 0; i < rN; i++) out[rStart + i] += rMv * Math.sin((Math.PI * i) / rN);

    // ST segment: flat shift from the J point until the T wave starts.
    const tStart = qrsOffset + Math.round(0.08 * FS);
    for (let i = qrsOffset; i < tStart && i < N; i++) out[i] += stMv;

    // T wave: half-sine riding on the ST level, ending at the QT boundary.
    const tEnd = qrsOnset + qtN;
    const tN = Math.max(2, tEnd - tStart);
    for (let i = 0; i < tN && tStart + i < N; i++) {
      out[tStart + i] += stMv * (1 - i / tN) + tMv * Math.sin((Math.PI * i) / tN);
    }
  }
  return out;
}

function csvFrom(leadMap, { fs = FS } = {}) {
  const names = Object.keys(leadMap);
  const rows = [`# sample_rate: ${fs}`, names.join(",")];
  const len = Math.min(...names.map((n) => leadMap[n].length));
  for (let i = 0; i < len; i++) {
    rows.push(names.map((n) => leadMap[n][i].toFixed(4)).join(","));
  }
  return rows.join("\n");
}

/** 12 leads, with a chosen ST shift applied to a chosen territory. */
function twelveLead({ hr = 60, stMv = 0, territory = [] } = {}) {
  const map = {};
  for (const lead of ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]) {
    const elevated = territory.includes(lead);
    map[lead] = synthLead({
      hr,
      stMv: elevated ? stMv : 0,
      rMv: lead === "aVR" ? -0.6 : 1.2,
    });
  }
  return map;
}

console.log("\nECG digital signal — file parsing\n");

t("שם הובלה מנורמל מכל הכתיבים", () => {
  assert(canonicalLead("AVF") === "aVF");
  assert(canonicalLead("lead II") === "II");
  assert(canonicalLead("MDC_ECG_LEAD_V3") === "V3");
  assert(canonicalLead("nonsense") === null);
});

t("יחידות מתח מומרות למילי-וולט", () => {
  assert(unitScaleToMv("uV") === 0.001);
  assert(unitScaleToMv("mV") === 1);
  assert(unitScaleToMv("V") === 1000);
  assert(unitScaleToMv("furlong") === null);
});

t("קובץ ריק או קצר נכשל סגור", () => {
  assert(parseEcgSignalFile("").ok === false);
  assert(parseEcgCsv("I,II\n0.1,0.2").ok === false);
  assert(signalReasonHe("sample_rate_unknown").includes("קצב דגימה"));
});

t("CSV עם כותרת וקצב דגימה נקרא", () => {
  const p = parseEcgCsv(csvFrom(twelveLead()));
  assert(p.ok === true, JSON.stringify(p));
  assert(p.sample_rate_hz === FS);
  assert(p.leads_present.length === 12);
  assert(p.duration_sec >= 9);
  assert(p.units === "mV");
});

t("CSV בלי קצב דגימה נדחה ולא ממציא קצב", () => {
  const lines = csvFrom(twelveLead()).split("\n").slice(1).join("\n");
  const p = parseEcgCsv(lines);
  assert(p.ok === false);
  assert(p.reason === "sample_rate_unknown");
});

t("CSV עם ציר זמן מסיק קצב דגימה", () => {
  const map = twelveLead();
  const names = Object.keys(map);
  const rows = [["time_s", ...names].join(",")];
  for (let i = 0; i < N; i++) {
    rows.push([(i / FS).toFixed(5), ...names.map((n) => map[n][i].toFixed(4))].join(","));
  }
  const p = parseEcgCsv(rows.join("\n"));
  assert(p.ok === true, JSON.stringify(p.reason));
  assert(p.sample_rate_hz === FS, "inferred " + p.sample_rate_hz);
});

t("שתי הובלות בלבד — יתר הובלות הגפיים נגזרות", () => {
  const map = twelveLead();
  const p = parseEcgCsv(csvFrom({ I: map.I, II: map.II }));
  assert(p.ok === true);
  assert(p.leads_present.includes("III"));
  assert(p.leads_present.includes("aVF"));
  assert(p.leads_derived.includes("aVR"));
});

t("גזירת גפיים מקיימת את חוק איינטהובן", () => {
  const I = Float32Array.from([0.2, 0.4]);
  const II = Float32Array.from([0.5, 0.9]);
  const d = deriveLimbLeads({ I, II });
  assert(Math.abs(d.III[0] - 0.3) < 1e-6);
  assert(Math.abs(d.aVR[0] - -0.35) < 1e-6);
});

t("HL7 aECG נקרא עם scale ו-increment", () => {
  const digits = Array.from({ length: 1200 }, (_, i) => Math.round(Math.sin(i / 5) * 400)).join(" ");
  const xml = `<AnnotatedECG>
    <sequence><code code="TIME_ABSOLUTE"/><value><increment value="0.002" unit="s"/></value></sequence>
    <sequence><code code="MDC_ECG_LEAD_I"/><value><scale value="0.0025" unit="mV"/><digits>${digits}</digits></value></sequence>
    <sequence><code code="MDC_ECG_LEAD_II"/><value><scale value="0.0025" unit="mV"/><digits>${digits}</digits></value></sequence>
  </AnnotatedECG>`;
  const p = parseAecgXml(xml);
  assert(p.ok === true, JSON.stringify(p));
  assert(p.sample_rate_hz === 500);
  assert(p.source === "hl7_aecg");
  assert(Math.abs(p.leads.I[10] - Math.round(Math.sin(2) * 400) * 0.0025) < 1e-6);
});

t("GE MUSE base64 נקרא ומומר ממיקרו-וולט", () => {
  const n = 1200;
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(i / 5) * 100), i * 2);
  const b64 = buf.toString("base64");
  const xml = `<RestingECG><Waveform><SampleBase>500</SampleBase>
    <LeadData><LeadID>I</LeadID><LeadAmplitudeUnitsPerBit>4.88</LeadAmplitudeUnitsPerBit><LeadAmplitudeUnits>uV</LeadAmplitudeUnits><WaveFormData>${b64}</WaveFormData></LeadData>
    <LeadData><LeadID>II</LeadID><LeadAmplitudeUnitsPerBit>4.88</LeadAmplitudeUnitsPerBit><LeadAmplitudeUnits>uV</LeadAmplitudeUnits><WaveFormData>${b64}</WaveFormData></LeadData>
  </Waveform></RestingECG>`;
  const p = parseMuseXml(xml);
  assert(p.ok === true, JSON.stringify(p));
  assert(p.sample_rate_hz === 500);
  const expected = Math.round(Math.sin(10 / 5) * 100) * 4.88 * 0.001;
  assert(Math.abs(p.leads.I[10] - expected) < 1e-5, p.leads.I[10] + " vs " + expected);
});

t("XML לא נתמך נדחה במקום להתפרש כ-CSV", () => {
  const p = parseEcgSignalFile("<Something><Else/></Something>", { filename: "x.xml" });
  assert(p.ok === false);
  assert(p.reason === "unsupported_xml");
});

console.log("\nECG digital signal — measurement\n");

t("אות תקין: HR, PR, QRS, QT ו-QTc נמדדים בטווח הצפוי", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60 })));
  const m = measureEcgSignal(p, { ageYears: 40, sex: "male" });
  assert(m.ok === true, JSON.stringify(m));
  const iv = m.measured.intervals;
  assert(Math.abs(m.measured.rate.hr_bpm - 60) <= 3, "HR=" + m.measured.rate.hr_bpm);
  assert(iv.qrs_ms > 60 && iv.qrs_ms < 130, "QRS=" + iv.qrs_ms);
  assert(iv.pr_ms > 100 && iv.pr_ms < 220, "PR=" + iv.pr_ms);
  assert(iv.qt_ms > 300 && iv.qt_ms < 460, "QT=" + iv.qt_ms);
  assert(m.measured.qtc.bazett > 300 && m.measured.qtc.bazett < 480, "QTc=" + m.measured.qtc.bazett);
  assert(m.measured.measurement_source === "digital_signal");
});

t("אות תקין אינו מייצר דפוס STEMI", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60 })));
  const m = measureEcgSignal(p, { ageYears: 40, sex: "male" });
  const keys = m.pathologyMatch.candidates.map((c) => c.key);
  assert(!keys.includes("stemi"), "false STEMI on a clean signal: " + keys.join(","));
});

t("עליית ST תחתונה 0.3mV → STEMI תחתון מהקריטריון הקיים", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60, stMv: 0.3, territory: ["II", "III", "aVF"] })));
  const m = measureEcgSignal(p, { ageYears: 55, sex: "male" });
  assert(m.ok === true, JSON.stringify(m.reason));
  const elevated = m.perception.morphology.st_elevation_leads.map((e) => e.lead);
  assert(elevated.includes("II") && elevated.includes("III"), "measured STE leads: " + elevated.join(","));
  const stemi = m.pathologyMatch.candidates.find((c) => c.key === "stemi");
  assert(stemi, "STEMI must match: " + m.pathologyMatch.candidates.map((c) => c.key).join(","));
  assert(stemi.territory === "inferior", "territory=" + stemi.territory);
  assert(m.pathologyMatch.maxSeverity === "red");
});

t("מדידת ST מדווחת מ״מ אמיתיים מהמילי-וולט", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60, stMv: 0.2, territory: ["V2", "V3", "V4"] })));
  const m = measureEcgSignal(p, { ageYears: 60, sex: "female" });
  const v3 = m.signal.st_detail.V3;
  assert(v3, "V3 ST measured");
  assert(Math.abs(v3.j_mm - 2) <= 0.6, "0.2mV should read ~2mm, got " + v3.j_mm);
});

t("עליית ST בליד בודד אינה STEMI", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60, stMv: 0.3, territory: ["V3"] })));
  const m = measureEcgSignal(p, { ageYears: 50, sex: "male" });
  const keys = m.pathologyMatch.candidates.map((c) => c.key);
  assert(!keys.includes("stemi"), "single lead must not be STEMI: " + keys.join(","));
});

t("אות שטוח נכשל סגור ולא מדווח תקין", () => {
  const flat = new Float32Array(N);
  const p = parseEcgCsv(csvFrom({ I: flat, II: flat }));
  const m = measureEcgSignal(p);
  assert(m.ok === false, JSON.stringify(m));
  assert(measureReasonHe(m.reason).length > 5);
});

t("תוצאת האות עוברת ל-UI כמדידה, לא כטיוטה לא-שמישה", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60, stMv: 0.3, territory: ["II", "III", "aVF"] })));
  const m = measureEcgSignal(p, { ageYears: 55, sex: "male" });
  const ui = assembleEcgResult(m, [], { sex: "male", locale: "he" });
  assert(ui.severity === "urgent", "severity=" + ui.severity);
  assert(!/אין פענוח מלא/.test(ui.summary), ui.summary);
  assert(/HR=/.test(ui.analysis), "measured block present");
  assert(ui.measurements.some((x) => x.parameter === "QRS"));
});

t("אות תקין אינו מסומן כלא-שלם", () => {
  const p = parseEcgCsv(csvFrom(twelveLead({ hr: 60 })));
  const m = measureEcgSignal(p, { ageYears: 40, sex: "male" });
  const ui = assembleEcgResult(m, [], { sex: "male", locale: "he" });
  assert(!/אין פענוח מלא/.test(ui.summary), ui.summary);
  assert(ui.severity === "normal" || ui.severity === "moderate", ui.severity);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
