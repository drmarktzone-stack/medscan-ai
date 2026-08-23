/**
 * ============================================================================
 *  MedScan AI — ECG digital-signal pipeline
 * ============================================================================
 *  Zero model calls. A waveform file from the machine is parsed, measured and
 *  matched against the deterministic criteria catalogue entirely in code, so
 *  this path runs free, offline, and with true millivolts.
 * ============================================================================
 */

import { base44 } from "@/api/base44Client";
import { parseEcgSignalFile, signalReasonHe } from "../signal/ecgSignalFile.js";
import { measureEcgSignal, measureReasonHe } from "../signal/ecgSignalMeasure.js";
import { assembleEcgResult } from "./ecgResultBuilder.js";

export const SIGNAL_FILE_ACCEPT = ".csv,.tsv,.txt,.xml";

/**
 * @param {object} p
 * @param {string} p.text        file contents
 * @param {string} [p.filename]
 * @param {number} [p.sampleRate] override when the file carries no rate
 * @param {number} [p.patientAgeYears]
 * @param {string} [p.patientSex]
 * @param {string} [p.patientRef]
 * @param {string} [p.language]
 */
export async function runEcgSignalAnalysis({
  text,
  filename = "",
  sampleRate = null,
  patientAgeYears,
  patientSex,
  patientRef,
  language = "he",
  onStage,
} = {}) {
  onStage?.("extracting");
  const parsed = parseEcgSignalFile(text, { filename, sampleRate });
  if (!parsed.ok) {
    throw new Error(`לא ניתן לקרוא את קובץ האות: ${signalReasonHe(parsed.reason)}`);
  }

  onStage?.("interpreting");
  const reading = measureEcgSignal(parsed, { ageYears: patientAgeYears, sex: patientSex });
  if (!reading.ok) {
    throw new Error(`לא ניתן למדוד מהאות: ${measureReasonHe(reading.reason)}`);
  }

  onStage?.("verifying");
  const allCases = await base44.entities.ECGCase.list("-created_date", 1000).catch(() => []);
  const result = assembleEcgResult(reading, allCases, {
    sex: patientSex,
    fileUrl: null,
    locale: language,
  });
  result.signal = reading.signal;
  result.measurementSource = "digital_signal";

  try {
    const rec = await base44.entities.Analysis.create({
      type: "ecg",
      result: result.analysis,
      severity: result.severity,
      summary: result.summary,
      structured_json: JSON.stringify({
        structured: result.structuredInterpretation.structured,
        pathologyMatch: reading.pathologyMatch,
        signal: reading.signal,
      }),
      patient_ref: patientRef || undefined,
    });
    result.analysisId = rec?.id;
  } catch { /* persistence is non-fatal */ }

  onStage?.("");
  return result;
}
