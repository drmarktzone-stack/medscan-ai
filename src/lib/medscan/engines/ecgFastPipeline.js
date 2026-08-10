/**
 * ============================================================================
 *  MedScan AI — ECG FAST Pipeline (single vision pass, deterministic core)
 * ============================================================================
 *  Purpose: replace the old ECG path (3–4 serial Opus vision calls → ~5 min)
 *  with ONE vision perception pass followed by pure-code interpretation.
 *
 *  Flow:
 *    0. upload/resolve image + fetch KB cases (parallel)
 *    1. ONE perception call  → pixel geometry + morphology (no ms, no diagnosis)
 *    2. CODE: measurements (ecgMicroMeasure) → fundamentals (rhythm/conduction/
 *       axis/intervals) → pathology match (ecgPathologies, criteria-gated)
 *    3. CODE: compare matched patterns against the ECGCase KB (keyword overlap)
 *    4. CODE: assemble the full result the UI already renders + persist
 *
 *  Nothing critical is guessed by the LLM: every millisecond/HR/QTc/axis is
 *  computed in code; every pathology is gated on explicit criteria. The model
 *  only PERCEIVES pixel geometry and morphology. This is the "define findings →
 *  compute closest morphology → match KB → say the diagnosis" design.
 * ============================================================================
 */

import { base44 } from "@/api/base44Client";
import { downscaleImageFile } from "@/lib/imageOptimize";
import { DIAGNOSIS_MODEL } from "@/lib/aiConfig";
import { createVisionInvokeLLM } from "@/lib/medscan/llmAdapter";
import { runEcgMicroReading, buildMeasuredBlock } from "./ecgPerception.js";

const abstainErrors = {
  he: (r) => `לא ניתן להפיק פענוח אמין: ${r} נא להעלות תמונה מתאימה, חדה וברורה.`,
  en: (r) => `Cannot produce a reliable reading: ${r} Please upload a suitable, sharp, clear image.`,
  ar: (r) => `تعذّر إنتاج قراءة موثوقة: ${r} يرجى رفع صورة مناسبة وواضحة.`,
};

/* ---- helpers --------------------------------------------------------------- */
const tok = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 2);
const STOP = new Set(["the", "and", "ecg", "ekg", "pattern", "syndrome", "with", "due", "acute", "type", "wave", "waves", "block", "old", "new"]);

function qtcStatusFrom(qtc, sex) {
  if (typeof qtc !== "number") return null;
  const female = /female|נקבה|אישה|^f/i.test(sex || "");
  const upper = female ? 460 : 450;
  if (qtc < 340) return "Short";
  if (qtc > 500) return "Prolonged";
  if (qtc > upper) return "Prolonged";
  if (qtc >= 430) return "Borderline";
  return "Normal";
}

/** Deterministic KB comparison: for each matched pattern find the closest ECGCase by keyword overlap. */
function matchKbCases(candidates, cases) {
  const out = [];
  for (const c of candidates) {
    const ct = tok(c.name_en).filter((w) => !STOP.has(w));
    let best = null;
    for (const cs of cases || []) {
      const dset = new Set([...tok(cs.diagnosis), ...tok(cs.title)]);
      const overlap = ct.filter((w) => dset.has(w)).length;
      if (overlap > 0 && (!best || overlap > best.overlap)) best = { cs, overlap };
    }
    out.push({
      title: best ? best.cs.title : c.name_he,
      diagnosis: best ? best.cs.diagnosis : c.name_en,
      confidence: Math.round(c.score || 0),
      reasoning: `${c.criteria.map((x) => `${x.ok === false ? "✗" : x.ok === null ? "?" : "✓"} ${x.text}`).join(" · ")}${c.note_he ? " — " + c.note_he : ""}`,
      image_url: best ? best.cs.image_url : undefined,
      _severity: c.severity,
    });
  }
  return out;
}

/** Map deterministic severity → the UI's 5-level severity + urgency. */
function mapSeverity(pathologyMatch) {
  const max = pathologyMatch?.maxSeverity || "normal";
  if (max === "red") return { severity: "urgent", urgency: "Emergency" };
  if (max === "yellow") return { severity: "moderate", urgency: "Normal" };
  return { severity: "normal", urgency: "Normal" };
}

/** Build the ECG_STRUCTURED_SCHEMA-shaped object the ECGInterpretationCard renders. */
function buildStructured(reading, { sex, urgency }) {
  const m = reading.measured || {};
  const iv = m.intervals || {};
  const rate = m.rate || {};
  const qtc = m.qtc || {};
  const axis = m.axis || {};
  const interp = reading.interpretation || {};
  const obs = reading.perception?.morphology || {};
  const cal = reading.perception?.calibration || {};

  const st_deviations = [];
  for (const e of obs.st_elevation_leads || []) if (e?.lead) st_deviations.push({ lead: e.lead, mm: e.mm, direction: "elevation" });
  for (const e of obs.st_depression_leads || []) if (e?.lead) st_deviations.push({ lead: e.lead, mm: e.mm, direction: "depression" });

  const cand = reading.pathologyMatch?.candidates || [];
  const critical_rule_out = cand
    .filter((c) => c.severity === "red")
    .map((c) => ({ pattern_key: c.key, status: "met", evidence: c.criteria.map((x) => x.text).join("; ") }));

  return {
    structured: {
      is_ecg: true,
      interpretable: m.measurable !== false,
      technical_check: {
        quality: reading.perception?.quality?.interpretable === false ? "Poor" : "Good",
        speed_mm_s: cal.paper_speed_mm_s ?? 25,
        calibration_mm_mv: cal.gain_mm_mv ?? 10,
        artifacts: (reading.perception?.quality?.issues_he || []).join(", ") || "ללא",
      },
      rhythm_and_rate: {
        heart_rate_bpm: rate.hr_bpm,
        rhythm_type: interp.rhythm?.rhythm_he || "—",
        regularity: obs && reading.perception?.rhythm?.regular === false ? "Irregular" : "Regular",
        p_wave_present: reading.perception?.rhythm?.p_before_each_qrs !== false,
      },
      axis: { degrees: axis.degrees, interpretation: axis.label_he || interp.axis?.label_he || "" },
      intervals: {
        pr_ms: iv.pr_ms, qrs_ms: iv.qrs_ms, qt_ms: iv.qt_ms,
        qtc_bazett_ms: qtc.bazett, qtc_fridericia_ms: qtc.fridericia,
        qtc_status: qtcStatusFrom(qtc.bazett, sex),
      },
      st_deviations,
      wave_and_segment_morphology: {
        st_segment: st_deviations.length ? st_deviations.map((d) => `${d.lead} ${d.direction} ${d.mm ?? "?"}mm`).join(", ") : "ללא סטייה משמעותית",
        t_waves: (obs.t_inversion_leads || []).length ? `היפוך ב-${(obs.t_inversion_leads || []).join(", ")}` : (obs.peaked_t_leads || []).length ? `מחודדים ב-${obs.peaked_t_leads.join(", ")}` : "תקינים",
        q_waves: (obs.pathological_q_leads || []).length ? `Q פתולוגי ב-${(obs.pathological_q_leads || []).join(", ")}` : "ללא Q פתולוגי",
      },
      primary_findings: cand.map((c) => c.name_he),
      clinical_urgency: urgency,
      critical_rule_out,
      confidence: m.measurable === false ? 40 : 85,
      reasoning: interp.summary_he || "",
    },
    confidence: m.measurable === false ? 40 : 85,
    warnings: [...(interp.interval_warnings || [])],
    uncertaintyLevel: m.measurable === false ? "high" : null,
  };
}

/** Build the human-readable Markdown analysis in code (no LLM). */
function buildAnalysisMd(reading, kbMatches, lang) {
  const m = reading.measured || {};
  const interp = reading.interpretation || {};
  const cand = reading.pathologyMatch?.candidates || [];
  const lines = [];

  lines.push(`## מדידות (מחושבות בקוד)`);
  lines.push(buildMeasuredBlock(m));
  lines.push("");
  lines.push(`## יסודות`);
  if (interp.rhythm?.rhythm_he) lines.push(`- **קצב:** ${interp.rhythm.rhythm_he}`);
  if (interp.conduction?.he) lines.push(`- **הולכה:** ${interp.conduction.he}${interp.conduction.discordance_expected ? " (discordance צפוי — הערך לפי Sgarbossa)" : ""}`);
  if (m.axis?.label_he) lines.push(`- **ציר:** ${m.axis.degrees ?? "?"}° (${m.axis.label_he})`);
  (interp.interval_warnings || []).forEach((w) => lines.push(`- ⚠ ${w}`));
  lines.push("");

  lines.push(`## דפוסים שקריטריוניהם התקיימו (מנוע דטרמיניסטי)`);
  if (cand.length === 0) {
    lines.push(`המדידות בגבולות הנורמה ואף קריטריון פתולוגי מגדיר לא התקיים → **בגבולות הנורמה / ללא ממצא חד-משמעי**.`);
  } else {
    cand.slice(0, 8).forEach((c) => {
      const crit = c.criteria.map((x) => `${x.ok === false ? "✗" : x.ok === null ? "?" : "✓"} ${x.text}`).join("; ");
      lines.push(`- **${c.name_he}** [${c.severity}] — ${crit}. ${c.note_he}`);
    });
  }
  lines.push("");

  if (kbMatches.length > 0) {
    lines.push(`## השוואה למאגר הידע`);
    kbMatches.slice(0, 5).forEach((k) => lines.push(`- **${k.title}** (${k.diagnosis}) — ביטחון ${k.confidence}%`));
    lines.push("");
  }

  lines.push(`> כלי תמיכה בהחלטות קליניות — אינו אבחנה סופית ואינו תחליף לשיקול דעת רפואי.`);
  return lines.join("\n");
}

/**
 * Run the fast, single-pass ECG analysis.
 * Returns the same result shape ECGAnalysis/AnalysisResult already consume.
 */
export async function runEcgFastAnalysis({
  files,
  preUploadedUrls,
  clinicalContext,
  language = "he",
  patientAgeYears,
  patientSex,
  patientRef,
  onStage,
  invokeLLM,          // optional override; defaults to Opus vision adapter
  model = DIAGNOSIS_MODEL,
}) {
  onStage?.("uploading");
  const [fileUrls, allCases] = await Promise.all([
    preUploadedUrls && preUploadedUrls.length > 0
      ? Promise.resolve(preUploadedUrls)
      : Promise.all((files || []).map(async (f) => {
          const optimized = await downscaleImageFile(f, { autoLandscape: true });
          const r = await base44.integrations.Core.UploadFile({ file: optimized });
          return r.file_url;
        })),
    base44.entities.ECGCase.list("-created_date", 1000).catch(() => []),
  ]);
  const file_url = fileUrls[0];

  // ---- THE single vision pass ----
  onStage?.("interpreting");
  const invoke = invokeLLM || createVisionInvokeLLM({ purpose: "ecg_fast_perception" });
  const reading = await runEcgMicroReading({
    fileUrls,
    invokeLLM: invoke,
    model,
    ageYears: patientAgeYears,
    sex: patientSex,
  });

  if (reading.abstain) {
    const build = abstainErrors[language] || abstainErrors.he;
    throw new Error(build(reading.abstain_reason_he || ""));
  }

  // ---- deterministic assembly ----
  onStage?.("verifying");
  const pathologyMatch = reading.pathologyMatch || { candidates: [], maxSeverity: "normal", mustNotMiss: [] };
  const kbMatches = matchKbCases(pathologyMatch.candidates, allCases);
  const { severity, urgency } = mapSeverity(pathologyMatch);
  const structuredInterpretation = buildStructured(reading, { sex: patientSex, urgency });

  const topFinding = pathologyMatch.candidates[0];
  const summary = topFinding
    ? `${topFinding.name_he}${topFinding.territory ? " — " + topFinding.territory : ""}`
    : (reading.interpretation?.summary_he || "בגבולות הנורמה / ללא ממצא חד-משמעי");

  const guideline = pathologyMatch.mustNotMiss[0]?.note_he
    || topFinding?.note_he
    || "אין ממצא מגדיר; המשך מעקב קליני לפי ההקשר.";

  const analysis = buildAnalysisMd(reading, kbMatches, language);

  // findings (bounding boxes) from the perception pass
  const rawFindings = Array.isArray(reading.perception?.findings) ? reading.perception.findings : [];
  const findings = rawFindings
    .map((f) => {
      const x = Math.max(0, Math.min(100, Number(f.x) || 0));
      const y = Math.max(0, Math.min(100, Number(f.y) || 0));
      const width = Math.max(0, Math.min(100 - x, Number(f.width) || 0));
      const height = Math.max(0, Math.min(100 - y, Number(f.height) || 0));
      return { label: String(f.label || "ממצא"), x, y, width, height };
    })
    .filter((f) => f.width > 0 && f.height > 0);

  // uncertainty
  let uncertainty = null;
  if (reading.measured?.measurable === false) {
    uncertainty = { level: "high", reason: "לא ניתן היה לכייל/למדוד את הרשת בביטחון — הערכים אינדיקטיביים בלבד; חזור על תרשים באיכות טובה יותר." };
  }

  // measurements list for the record
  const measurements = [];
  const iv = reading.measured?.intervals || {};
  const rate = reading.measured?.rate || {};
  const qtc = reading.measured?.qtc || {};
  if (rate.hr_bpm != null) measurements.push({ parameter: "HR", value: `${rate.hr_bpm} bpm` });
  if (iv.pr_ms != null) measurements.push({ parameter: "PR", value: `${iv.pr_ms} ms` });
  if (iv.qrs_ms != null) measurements.push({ parameter: "QRS", value: `${iv.qrs_ms} ms` });
  if (iv.qt_ms != null) measurements.push({ parameter: "QT", value: `${iv.qt_ms} ms` });
  if (qtc.bazett != null) measurements.push({ parameter: "QTc(Bazett)", value: `${qtc.bazett} ms` });

  // persist
  let analysisId;
  try {
    const rec = await base44.entities.Analysis.create({
      type: "ecg",
      image_url: file_url,
      result: analysis,
      severity,
      summary,
      structured_json: JSON.stringify({ structured: structuredInterpretation.structured, pathologyMatch }),
      patient_ref: patientRef || undefined,
    });
    analysisId = rec.id;
  } catch { /* persistence is non-fatal */ }

  onStage?.("");
  return {
    summary,
    severity,
    analysis,
    matchedCases: kbMatches,
    imageUrl: file_url,
    findings,
    uncertainty,
    guideline,
    measurements,
    ecgInterpretation: structuredInterpretation,
    structuredInterpretation,
    analysisId,
    microReading: reading,   // the ECG page also shows the measured card from this
    numericIntegrity: null,
  };
}
