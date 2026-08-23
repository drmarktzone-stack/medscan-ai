/**
 * ============================================================================
 *  MedScan AI — Digital ECG signal ingest
 * ============================================================================
 *  Reads a real waveform file from the ECG machine instead of a photo of the
 *  paper. This is the single biggest accuracy step available to us: amplitudes
 *  arrive in millivolts and time arrives in samples, so the existing
 *  deterministic criteria engine finally gets true measurements instead of
 *  pixel estimates.
 *
 *  Supported today:
 *    - CSV / TSV  — one column per lead, optional header, optional time column
 *    - HL7 aECG XML — <sequence> blocks with <digits> and a scale factor
 *    - GE MUSE-style XML — <LeadData> blocks with base64 int16 <WaveFormData>
 *
 *  Fails closed: an unreadable file returns { ok:false, reason } and the caller
 *  must treat that as "no measurement", never as "normal".
 * ============================================================================
 */

export const STANDARD_LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];

/** Aliases are stored keyless of punctuation, so `MDC_ECG_LEAD_V3` and `lead v3` agree. */
const LEAD_ALIASES = new Map();
for (const lead of ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]) {
  const bare = lead.toLowerCase();
  LEAD_ALIASES.set(bare, lead);
  LEAD_ALIASES.set(`lead${bare}`, lead);
  LEAD_ALIASES.set(`mdcecglead${bare}`, lead);
  LEAD_ALIASES.set(`ecglead${bare}`, lead);
}

export function canonicalLead(name) {
  const compact = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return LEAD_ALIASES.get(compact) || null;
}

function fail(reason, extra = {}) {
  return { ok: false, reason, verification_status: "unavailable", ...extra };
}

/** Microvolts / volts / ADC counts all normalise to millivolts. */
export function unitScaleToMv(unit) {
  const u = String(unit || "").trim().toLowerCase();
  if (!u || u === "mv") return 1;
  if (u === "uv" || u === "µv" || u === "microvolt" || u === "microvolts") return 0.001;
  if (u === "v" || u === "volt" || u === "volts") return 1000;
  if (u === "nv") return 1e-6;
  return null;
}

/* ---------------------------------------------------------------- CSV ---- */

function splitRows(text) {
  return String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function detectDelimiter(line) {
  const counts = [
    [",", (line.match(/,/g) || []).length],
    ["\t", (line.match(/\t/g) || []).length],
    [";", (line.match(/;/g) || []).length],
  ].sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : /\s+/;
}

/** `# sample_rate: 500`, `fs=500`, `sampling_frequency 500` in any leading comment. */
export function sampleRateFromHeader(text) {
  const m = String(text).match(/(?:sample[_\s-]?rate|sampling[_\s-]?(?:rate|frequency)|\bfs\b|\bhz\b)\s*[:=]?\s*(\d{2,5})/i);
  if (m) {
    const v = Number(m[1]);
    if (v >= 20 && v <= 20000) return v;
  }
  return null;
}

export function parseEcgCsv(text, { sampleRate = null, unit = "mv" } = {}) {
  const raw = String(text || "");
  if (!raw.trim()) return fail("empty_file");

  const declaredRate = sampleRate || sampleRateFromHeader(raw);
  const rows = splitRows(raw).filter((l) => !l.startsWith("#"));
  if (rows.length < 20) return fail("too_few_samples");

  const delim = detectDelimiter(rows[0]);
  const firstCells = rows[0].split(delim).map((c) => c.trim());
  const headerIsText = firstCells.some((c) => c && !Number.isFinite(Number(c)));

  let headers = null;
  let dataRows = rows;
  if (headerIsText) {
    headers = firstCells;
    dataRows = rows.slice(1);
  }
  if (dataRows.length < 20) return fail("too_few_samples");

  const columnCount = dataRows[0].split(delim).length;
  const columns = Array.from({ length: columnCount }, () => []);
  for (const row of dataRows) {
    const cells = row.split(delim);
    if (cells.length < columnCount) continue;
    for (let c = 0; c < columnCount; c++) columns[c].push(Number(cells[c]));
  }

  // A monotonically rising first column with no lead name is a time axis.
  let timeColumn = null;
  const firstHeader = headers ? String(headers[0] || "").toLowerCase() : "";
  const looksLikeTimeName = /time|sec|ms|sample|index/.test(firstHeader);
  if (columnCount > 1 && (looksLikeTimeName || (!headers && isMonotonic(columns[0])))) {
    timeColumn = columns[0];
  }

  const scale = unitScaleToMv(unit);
  if (scale == null) return fail("unknown_unit");

  const leads = {};
  const unnamed = [];
  for (let c = 0; c < columnCount; c++) {
    if (timeColumn && c === 0) continue;
    const name = headers ? canonicalLead(headers[c]) : null;
    const series = Float32Array.from(columns[c], (v) => (Number.isFinite(v) ? v * scale : 0));
    if (name) leads[name] = series;
    else unnamed.push(series);
  }

  // Headerless files are assumed to be in standard 12-lead order.
  if (!Object.keys(leads).length && unnamed.length) {
    unnamed.forEach((series, i) => {
      if (i < STANDARD_LEADS.length) leads[STANDARD_LEADS[i]] = series;
    });
  }

  if (!Object.keys(leads).length) return fail("no_leads_found");

  const inferredRate = declaredRate || rateFromTimeColumn(timeColumn, firstHeader);
  if (!inferredRate) return fail("sample_rate_unknown", { leads_found: Object.keys(leads) });

  return finishParse({ leads, sampleRate: inferredRate, source: "csv", declaredRate: Boolean(declaredRate) });
}

function isMonotonic(arr) {
  if (!arr || arr.length < 3) return false;
  for (let i = 1; i < arr.length; i++) if (!(arr[i] > arr[i - 1])) return false;
  return true;
}

function rateFromTimeColumn(timeColumn, headerName = "") {
  if (!timeColumn || timeColumn.length < 3) return null;
  const deltas = [];
  for (let i = 1; i < Math.min(timeColumn.length, 200); i++) deltas.push(timeColumn[i] - timeColumn[i - 1]);
  deltas.sort((a, b) => a - b);
  const step = deltas[Math.floor(deltas.length / 2)];
  if (!Number.isFinite(step) || step <= 0) return null;
  const inMs = /ms|milli/.test(headerName) || step > 0.02;
  const stepSeconds = inMs ? step / 1000 : step;
  const hz = Math.round(1 / stepSeconds);
  return hz >= 20 && hz <= 20000 ? hz : null;
}

/* ---------------------------------------------------------------- XML ---- */

/** Tolerant tag scanner — works in node and the browser without a DOM. */
export function extractBlocks(xml, tag) {
  const out = [];
  const open = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  let m;
  while ((m = open.exec(xml)) !== null) {
    const start = m.index + m[0].length;
    const closeIdx = xml.indexOf(`</${tag}`, start);
    if (closeIdx === -1) break;
    out.push({ inner: xml.slice(start, closeIdx), attrs: m[0] });
    open.lastIndex = closeIdx;
  }
  return out;
}

function tagText(xml, tag) {
  const b = extractBlocks(xml, tag);
  return b.length ? b[0].inner.trim() : null;
}

function attr(attrs, name) {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i").exec(attrs || "");
  return m ? m[1] : null;
}

function decodeBase64Int16(b64, littleEndian = true) {
  let bytes;
  if (typeof atob === "function") {
    const bin = atob(String(b64).replace(/\s+/g, ""));
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } else if (typeof Buffer !== "undefined") {
    bytes = Uint8Array.from(Buffer.from(String(b64).replace(/\s+/g, ""), "base64"));
  } else {
    return null;
  }
  const n = Math.floor(bytes.length / 2);
  const out = new Int16Array(n);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < n; i++) out[i] = view.getInt16(i * 2, littleEndian);
  return out;
}

/** HL7 aECG: <sequence><code code="MDC_ECG_LEAD_II"/><value><scale value=".0025" unit="mV"/><digits>…</digits> */
export function parseAecgXml(xml) {
  const text = String(xml || "");
  const sequences = extractBlocks(text, "sequence");
  if (!sequences.length) return fail("no_sequences");

  const leads = {};
  let sampleRate = null;

  for (const seq of sequences) {
    const codeAttrs = extractBlocks(seq.inner, "code")[0]?.attrs
      || (/<code\b[^>]*\/>/i.exec(seq.inner) || [])[0]
      || "";
    const code = attr(codeAttrs, "code") || "";

    // The time sequence carries the sampling increment.
    if (/TIME_ABSOLUTE|TIME_RELATIVE/i.test(code)) {
      const incAttrs = (/<increment\b[^>]*\/?>/i.exec(seq.inner) || [])[0] || "";
      const incVal = Number(attr(incAttrs, "value"));
      const incUnit = String(attr(incAttrs, "unit") || "s").toLowerCase();
      if (Number.isFinite(incVal) && incVal > 0) {
        const seconds = incUnit.startsWith("ms") ? incVal / 1000 : incVal;
        const hz = Math.round(1 / seconds);
        if (hz >= 20 && hz <= 20000) sampleRate = hz;
      }
      continue;
    }

    const lead = canonicalLead(code);
    if (!lead) continue;
    const digits = tagText(seq.inner, "digits");
    if (!digits) continue;
    const scaleAttrs = (/<scale\b[^>]*\/?>/i.exec(seq.inner) || [])[0] || "";
    const scaleVal = Number(attr(scaleAttrs, "value"));
    const scaleUnit = attr(scaleAttrs, "unit") || "mV";
    const unitFactor = unitScaleToMv(scaleUnit);
    if (unitFactor == null) return fail("unknown_unit", { unit: scaleUnit });
    const factor = (Number.isFinite(scaleVal) ? scaleVal : 1) * unitFactor;
    const nums = digits.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 20) continue;
    leads[lead] = Float32Array.from(nums, (v) => v * factor);
  }

  if (!Object.keys(leads).length) return fail("no_leads_found");
  if (!sampleRate) return fail("sample_rate_unknown", { leads_found: Object.keys(leads) });
  return finishParse({ leads, sampleRate, source: "hl7_aecg" });
}

/** GE MUSE-style: <LeadData><LeadID>V2</LeadID><LeadAmplitudeUnitsPerBit>4.88</…><WaveFormData>base64</…> */
export function parseMuseXml(xml) {
  const text = String(xml || "");
  const blocks = extractBlocks(text, "LeadData");
  if (!blocks.length) return fail("no_lead_data");

  const rateText = tagText(text, "SampleBase") || tagText(text, "SampleRate");
  const sampleRate = Number(rateText);
  if (!Number.isFinite(sampleRate) || sampleRate < 20) return fail("sample_rate_unknown");

  const leads = {};
  for (const b of blocks) {
    const lead = canonicalLead(tagText(b.inner, "LeadID"));
    if (!lead) continue;
    const b64 = tagText(b.inner, "WaveFormData");
    if (!b64) continue;
    const perBit = Number(tagText(b.inner, "LeadAmplitudeUnitsPerBit"));
    const unit = tagText(b.inner, "LeadAmplitudeUnits") || "uV";
    const unitFactor = unitScaleToMv(unit);
    if (unitFactor == null) return fail("unknown_unit", { unit });
    const samples = decodeBase64Int16(b64);
    if (!samples || samples.length < 20) continue;
    const factor = (Number.isFinite(perBit) ? perBit : 1) * unitFactor;
    leads[lead] = Float32Array.from(samples, (v) => v * factor);
  }

  if (!Object.keys(leads).length) return fail("no_leads_found");
  return finishParse({ leads, sampleRate: Math.round(sampleRate), source: "ge_muse_xml" });
}

/* ------------------------------------------------------- lead derivation -- */

/** Einthoven / Goldberger — derive the limb leads a 2-channel export omits. */
export function deriveLimbLeads(leads) {
  const out = { ...leads };
  const I = out.I;
  const II = out.II;
  const has = (x) => x && x.length;
  if (has(I) && has(II)) {
    const n = Math.min(I.length, II.length);
    if (!has(out.III)) {
      const III = new Float32Array(n);
      for (let i = 0; i < n; i++) III[i] = II[i] - I[i];
      out.III = III;
    }
    if (!has(out.aVR)) {
      const aVR = new Float32Array(n);
      for (let i = 0; i < n; i++) aVR[i] = -(I[i] + II[i]) / 2;
      out.aVR = aVR;
    }
    if (!has(out.aVL)) {
      const aVL = new Float32Array(n);
      for (let i = 0; i < n; i++) aVL[i] = I[i] - II[i] / 2;
      out.aVL = aVL;
    }
    if (!has(out.aVF)) {
      const aVF = new Float32Array(n);
      for (let i = 0; i < n; i++) aVF[i] = II[i] - I[i] / 2;
      out.aVF = aVF;
    }
  }
  return out;
}

function finishParse({ leads, sampleRate, source, declaredRate = true }) {
  const derived = deriveLimbLeads(leads);
  const present = STANDARD_LEADS.filter((l) => derived[l] && derived[l].length);
  const lengths = present.map((l) => derived[l].length);
  const samples = Math.min(...lengths);
  const durationSec = samples / sampleRate;

  if (samples < sampleRate * 1.5) {
    return fail("recording_too_short", { duration_sec: Math.round(durationSec * 100) / 100 });
  }

  return {
    ok: true,
    source,
    sample_rate_hz: sampleRate,
    sample_rate_declared: declaredRate,
    samples,
    duration_sec: Math.round(durationSec * 100) / 100,
    leads: derived,
    leads_present: present,
    leads_derived: present.filter((l) => !leads[l] || !leads[l].length),
    units: "mV",
    verification_status: "measured",
    note_he: "אות דיגיטלי מהמכשיר. מילי-וולט ודגימות אמיתיות, לא הערכה מתמונה.",
  };
}

/* ----------------------------------------------------------- dispatcher -- */

/**
 * @param {string} text  file contents
 * @param {{ filename?:string, sampleRate?:number, unit?:string }} [opts]
 */
export function parseEcgSignalFile(text, { filename = "", sampleRate = null, unit = "mv" } = {}) {
  const raw = String(text || "");
  if (!raw.trim()) return fail("empty_file");

  const looksXml = raw.trimStart().startsWith("<") || /\.xml$/i.test(filename);
  if (looksXml) {
    if (/<LeadData\b/i.test(raw)) return parseMuseXml(raw);
    if (/<sequence\b/i.test(raw)) return parseAecgXml(raw);
    return fail("unsupported_xml");
  }
  return parseEcgCsv(raw, { sampleRate, unit });
}

export const SIGNAL_REASON_HE = {
  empty_file: "הקובץ ריק.",
  too_few_samples: "אין מספיק דגימות בקובץ.",
  no_leads_found: "לא זוהו הובלות בקובץ.",
  sample_rate_unknown: "לא נמצא קצב דגימה. הוסיפו שורת כותרת עם sample_rate, או ציר זמן.",
  unknown_unit: "יחידת מתח לא מזוהה.",
  recording_too_short: "ההקלטה קצרה מדי למדידה.",
  unsupported_xml: "פורמט XML שאינו נתמך.",
  no_sequences: "לא נמצאו רצפי אות בקובץ.",
  no_lead_data: "לא נמצאו בלוקי הובלות בקובץ.",
};

export function signalReasonHe(reason) {
  return SIGNAL_REASON_HE[reason] || "לא ניתן לקרוא את קובץ האות.";
}
