/**
 * ============================================================================
 *  MedScan AI — Measurement from a digital ECG signal
 * ============================================================================
 *  Delineation on a real waveform: R peaks, QRS onset/offset, P onset, T offset,
 *  and per-lead ST deviation at the J point — all in true milliseconds and
 *  millivolts, because the file carries the sampling rate and the gain.
 *
 *  The output is the same `reading` shape the image path produces, so the
 *  existing deterministic criteria engine (ecgFundamentals → ecgPathologies →
 *  ecgResultBuilder) consumes it unchanged. That is the point: the criteria
 *  were always correct, they were being fed pixel guesses.
 *
 *  Standard paper equivalence, used only to express amplitudes the way a
 *  clinician reads them: 10 mm/mV, so 1 mm = 0.1 mV.
 * ============================================================================
 */

import { runMicroMeasure } from "../engines/ecgMicroMeasure.js";
import { interpretFundamentals } from "../engines/ecgFundamentals.js";
import { matchPathologies, featuresFromReading, buildPathologyBlock } from "../engines/ecgPathologies.js";

const MM_PER_MV = 10;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const mvToMm = (mv) => Math.round(mv * MM_PER_MV * 100) / 100;

function median(arr) {
  const clean = arr.filter(isNum);
  if (!clean.length) return null;
  const s = [...clean].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function fail(reason) {
  return { ok: false, reason };
}

/* ------------------------------------------------------------- detection -- */

/** Absolute first derivative summed over all leads — the classic QRS locator. */
export function compositeVelocity(leads, names, samples) {
  const v = new Float32Array(samples);
  for (const name of names) {
    const s = leads[name];
    if (!s) continue;
    for (let i = 1; i < samples; i++) v[i] += Math.abs(s[i] - s[i - 1]);
  }
  return v;
}

function smooth(arr, win) {
  const n = arr.length;
  const out = new Float32Array(n);
  const half = Math.max(1, Math.floor(win / 2));
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += arr[i];
    if (i >= win) acc -= arr[i - win];
    const center = i - half;
    if (center >= 0) out[center] = acc / Math.min(win, i + 1);
  }
  for (let i = n - half; i < n; i++) out[i] = out[Math.max(0, n - half - 1)];
  return out;
}

/** R peaks on the composite velocity, with a physiological refractory period. */
export function detectBeats(velocity, sampleRate) {
  const n = velocity.length;
  if (n < sampleRate) return [];
  const energy = smooth(Float32Array.from(velocity, (x) => x * x), Math.max(1, Math.round(sampleRate * 0.05)));
  let sum = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    sum += energy[i];
    if (energy[i] > max) max = energy[i];
  }
  const mean = sum / n;
  const threshold = mean + 0.25 * (max - mean);
  const refractory = Math.round(sampleRate * 0.2);
  const peaks = [];
  let last = -Infinity;
  for (let i = 1; i < n - 1; i++) {
    if (energy[i] <= threshold) continue;
    if (energy[i] < energy[i - 1] || energy[i] < energy[i + 1]) continue;
    if (i - last <= refractory) continue;
    peaks.push(i);
    last = i;
  }
  return peaks;
}

/** Snap each detected beat onto the true extremum of the reference lead. */
function refinePeaks(peaks, reference, sampleRate) {
  const win = Math.round(sampleRate * 0.04);
  return peaks.map((p) => {
    let best = p;
    let bestVal = Math.abs(reference[p] ?? 0);
    for (let i = Math.max(0, p - win); i <= Math.min(reference.length - 1, p + win); i++) {
      const v = Math.abs(reference[i]);
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    }
    return best;
  });
}

/** Walk out from R until the composite velocity settles — QRS onset and J point. */
export function qrsBounds(velocity, r, sampleRate) {
  const quietWindow = Math.round(sampleRate * 0.012) || 1;
  let floor = 0;
  let count = 0;
  const from = Math.max(0, r - Math.round(sampleRate * 0.35));
  const to = Math.max(0, r - Math.round(sampleRate * 0.12));
  for (let i = from; i < to; i++) {
    floor += velocity[i];
    count += 1;
  }
  const baselineVelocity = count ? floor / count : 0;
  let peakVelocity = 0;
  const searchFrom = Math.max(0, r - Math.round(sampleRate * 0.06));
  const searchTo = Math.min(velocity.length - 1, r + Math.round(sampleRate * 0.06));
  for (let i = searchFrom; i <= searchTo; i++) if (velocity[i] > peakVelocity) peakVelocity = velocity[i];
  const gate = baselineVelocity + 0.12 * (peakVelocity - baselineVelocity);

  let onset = null;
  let quiet = 0;
  for (let i = r; i >= Math.max(0, r - Math.round(sampleRate * 0.12)); i--) {
    if (velocity[i] <= gate) {
      quiet += 1;
      if (quiet >= quietWindow) {
        onset = i + quiet - 1;
        break;
      }
    } else quiet = 0;
  }

  let offset = null;
  quiet = 0;
  for (let i = r; i <= Math.min(velocity.length - 1, r + Math.round(sampleRate * 0.16)); i++) {
    if (velocity[i] <= gate) {
      quiet += 1;
      if (quiet >= quietWindow) {
        offset = i - quiet + 1;
        break;
      }
    } else quiet = 0;
  }

  if (onset == null || offset == null || offset <= onset) return null;
  return { onset, offset };
}

function segmentMean(signal, from, to) {
  let sum = 0;
  let n = 0;
  for (let i = Math.max(0, from); i <= Math.min(signal.length - 1, to); i++) {
    sum += signal[i];
    n += 1;
  }
  return n ? sum / n : null;
}

/** P wave inside the PR window of the reference lead. */
function pOnset(reference, qrsOnset, sampleRate, baseline) {
  const from = Math.max(0, qrsOnset - Math.round(sampleRate * 0.26));
  const to = Math.max(0, qrsOnset - Math.round(sampleRate * 0.03));
  if (to - from < 3) return null;
  let peakIdx = null;
  let peakDev = 0;
  for (let i = from; i <= to; i++) {
    const dev = Math.abs(reference[i] - baseline);
    if (dev > peakDev) {
      peakDev = dev;
      peakIdx = i;
    }
  }
  if (peakIdx == null || peakDev < 0.03) return null; // <0.3mm is not a P wave
  const gate = peakDev * 0.2;
  for (let i = peakIdx; i >= from; i--) {
    if (Math.abs(reference[i] - baseline) <= gate) return i;
  }
  return from;
}

/** T offset by return-to-baseline after the T peak. */
function tOffset(reference, jPoint, rrSamples, sampleRate, baseline) {
  const from = Math.min(reference.length - 1, jPoint + Math.round(sampleRate * 0.06));
  const span = rrSamples ? Math.round(rrSamples * 0.6) : Math.round(sampleRate * 0.5);
  const to = Math.min(reference.length - 1, jPoint + span);
  if (to - from < 5) return null;
  let peakIdx = null;
  let peakDev = 0;
  for (let i = from; i <= to; i++) {
    const dev = Math.abs(reference[i] - baseline);
    if (dev > peakDev) {
      peakDev = dev;
      peakIdx = i;
    }
  }
  if (peakIdx == null || peakDev < 0.03) return null;
  const gate = peakDev * 0.15;
  for (let i = peakIdx; i <= to; i++) {
    if (Math.abs(reference[i] - baseline) <= gate) return i;
  }
  return to;
}

/* --------------------------------------------------------------- driver -- */

const REFERENCE_ORDER = ["II", "V5", "V2", "I", "III"];

function pickReference(leads) {
  for (const name of REFERENCE_ORDER) if (leads[name]?.length) return name;
  const first = Object.keys(leads).find((k) => leads[k]?.length);
  return first || null;
}

/**
 * @param {object} parsed  result of parseEcgSignalFile
 * @param {{ ageYears?:number, sex?:string }} [ctx]
 */
export function measureEcgSignal(parsed, { ageYears, sex } = {}) {
  if (!parsed?.ok) return fail(parsed?.reason || "no_signal");
  const { leads, sample_rate_hz: sampleRate, samples } = parsed;
  const names = parsed.leads_present || Object.keys(leads);
  const refName = pickReference(leads);
  if (!refName) return fail("no_reference_lead");

  const reference = leads[refName];
  const velocity = compositeVelocity(leads, names, samples);
  const rough = detectBeats(velocity, sampleRate);
  const beats = refinePeaks(rough, reference, sampleRate);
  if (beats.length < 3) return fail("too_few_beats");

  const rrSamples = [];
  for (let i = 1; i < beats.length; i++) rrSamples.push(beats[i] - beats[i - 1]);
  const rrMedian = median(rrSamples);
  if (!rrMedian) return fail("rr_undetermined");

  const rrMs = (rrMedian / sampleRate) * 1000;
  const hr = Math.round(60000 / rrMs);
  if (hr < 20 || hr > 350) return fail("rate_implausible");

  const rrCv = rrSamples.length > 1
    ? Math.sqrt(rrSamples.reduce((s, x) => s + (x - rrMedian) ** 2, 0) / rrSamples.length) / rrMedian
    : 0;

  // Per-beat delineation on the reference lead, then median across beats.
  const prList = [];
  const qrsList = [];
  const qtList = [];
  let pDetected = 0;
  const perBeat = [];

  for (const r of beats) {
    const bounds = qrsBounds(velocity, r, sampleRate);
    if (!bounds) continue;
    const baseline = segmentMean(reference, bounds.onset - Math.round(sampleRate * 0.05), bounds.onset - Math.round(sampleRate * 0.01));
    if (baseline == null) continue;
    qrsList.push(((bounds.offset - bounds.onset) / sampleRate) * 1000);

    const pOn = pOnset(reference, bounds.onset, sampleRate, baseline);
    if (pOn != null) {
      pDetected += 1;
      prList.push(((bounds.onset - pOn) / sampleRate) * 1000);
    }
    const tOff = tOffset(reference, bounds.offset, rrMedian, sampleRate, baseline);
    if (tOff != null) qtList.push(((tOff - bounds.onset) / sampleRate) * 1000);

    perBeat.push({ r, ...bounds, baseline, t_offset: tOff });
  }

  if (!perBeat.length) return fail("delineation_failed");

  const prMs = median(prList);
  const qrsMs = median(qrsList);
  const qtMs = median(qtList);

  // Per-lead ST deviation at the J point and at J+60ms, plus wave morphology.
  const stElev = [];
  const stDep = [];
  const tInverted = [];
  const pathQ = [];
  const peakedT = [];
  const leadNet = {};
  const stDetail = {};

  for (const name of names) {
    const s = leads[name];
    if (!s) continue;
    const jVals = [];
    const j60Vals = [];
    const tVals = [];
    const netVals = [];
    const qDepths = [];
    const qDurations = [];
    const rAmps = [];

    for (const b of perBeat) {
      const base = segmentMean(s, b.onset - Math.round(sampleRate * 0.05), b.onset - Math.round(sampleRate * 0.01));
      if (base == null) continue;
      const jIdx = b.offset;
      const j60 = Math.min(s.length - 1, jIdx + Math.round(sampleRate * 0.06));
      jVals.push(s[jIdx] - base);
      j60Vals.push(s[j60] - base);

      const net = segmentMean(s, b.onset, b.offset);
      if (net != null) netVals.push(net - base);

      // Q wave: negative run at the start of the QRS.
      let qEnd = b.onset;
      while (qEnd < b.offset && s[qEnd] - base <= 0) qEnd += 1;
      if (qEnd > b.onset) {
        let deepest = 0;
        for (let i = b.onset; i < qEnd; i++) deepest = Math.min(deepest, s[i] - base);
        qDepths.push(Math.abs(deepest));
        qDurations.push(((qEnd - b.onset) / sampleRate) * 1000);
      }
      let rPeak = 0;
      for (let i = b.onset; i <= b.offset; i++) rPeak = Math.max(rPeak, s[i] - base);
      rAmps.push(rPeak);

      if (b.t_offset != null) {
        const tFrom = Math.min(s.length - 1, jIdx + Math.round(sampleRate * 0.06));
        let dev = 0;
        for (let i = tFrom; i <= b.t_offset; i++) {
          const d = s[i] - base;
          if (Math.abs(d) > Math.abs(dev)) dev = d;
        }
        tVals.push(dev);
      }
    }

    const jMv = median(jVals);
    const j60Mv = median(j60Vals);
    const tMv = median(tVals);
    const netMv = median(netVals);
    if (isNum(netMv)) leadNet[name] = mvToMm(netMv);

    if (isNum(jMv)) {
      const mm = mvToMm(jMv);
      stDetail[name] = { j_mm: mm, j60_mm: isNum(j60Mv) ? mvToMm(j60Mv) : null };
      if (mm >= 0.5) stElev.push({ lead: name, mm });
      if (mm <= -0.5) stDep.push({ lead: name, mm: Math.abs(mm) });
    }
    // aVR is normally negative; V1 T inversion is normal in children.
    if (isNum(tMv) && tMv < -0.1 && name !== "aVR" && name !== "V1") tInverted.push(name);
    if (isNum(tMv) && tMv > 0.9) peakedT.push(name);

    const qDepth = median(qDepths);
    const qDur = median(qDurations);
    const rAmp = median(rAmps);
    if (isNum(qDur) && qDur >= 40 && isNum(qDepth) && isNum(rAmp) && rAmp > 0 && qDepth >= 0.25 * rAmp) {
      pathQ.push(name);
    }
  }

  const measured = runMicroMeasure({
    calibration: {
      small_box_px: 1,
      mm_per_small_box: 1,
      paper_speed_mm_s: 25,
      gain_mm_mv: MM_PER_MV,
      reliable: true,
    },
    fiducials: {},
    leadNet: { net_I_mm: leadNet.I, net_aVF_mm: leadNet.aVF },
  });

  // Replace the pixel-derived intervals with the signal-derived ones.
  measured.measurable = true;
  measured.intervals = {
    pr_ms: isNum(prMs) ? Math.round(prMs) : null,
    qrs_ms: isNum(qrsMs) ? Math.round(qrsMs) : null,
    qt_ms: isNum(qtMs) ? Math.round(qtMs) : null,
  };
  measured.rate = { rr_ms: Math.round(rrMs), hr_bpm: hr };
  measured.qtc = isNum(qtMs)
    ? {
      bazett: Math.round(qtMs / Math.sqrt(rrMs / 1000)),
      fridericia: Math.round(qtMs / Math.cbrt(rrMs / 1000)),
    }
    : { bazett: null, fridericia: null };
  measured.measurement_source = "digital_signal";

  const v1 = leads.V1;
  let v1Pattern;
  if (v1?.length && perBeat.length) {
    const b = perBeat[0];
    const base = segmentMean(v1, b.onset - Math.round(sampleRate * 0.05), b.onset - Math.round(sampleRate * 0.01)) || 0;
    let up = 0;
    let down = 0;
    for (let i = b.onset; i <= b.offset; i++) {
      up = Math.max(up, v1[i] - base);
      down = Math.min(down, v1[i] - base);
    }
    v1Pattern = Math.abs(down) > up ? "dominant_s" : "other";
  }

  const observations = {
    regular: rrCv < 0.1,
    p_before_each_qrs: perBeat.length ? pDetected / perBeat.length >= 0.8 : null,
    st_elevation_leads: stElev,
    st_depression_leads: stDep,
    t_inversion_leads: tInverted,
    pathological_q_leads: pathQ,
    peaked_t_leads: peakedT,
    u_wave_leads: [],
    v1_qrs_pattern: v1Pattern,
    st_detail: stDetail,
  };

  const interpretation = interpretFundamentals({ measured, observations, ageYears, sex });
  const pathologyMatch = matchPathologies(
    featuresFromReading({ measured, interpretation, observations, ageYears, sex }),
  );

  return {
    ok: true,
    abstain: false,
    measured,
    perception: {
      quality: { is_ecg: true, interpretable: true, issues_he: [] },
      calibration: {
        reliable: true,
        paper_speed_mm_s: 25,
        gain_mm_mv: MM_PER_MV,
        sample_rate_hz: sampleRate,
        source: parsed.source,
      },
      rhythm: { regular: observations.regular, p_before_each_qrs: observations.p_before_each_qrs },
      morphology: observations,
      findings: [],
    },
    interpretation,
    pathologyMatch,
    pathologyBlock: buildPathologyBlock(pathologyMatch),
    signal: {
      source: parsed.source,
      sample_rate_hz: sampleRate,
      duration_sec: parsed.duration_sec,
      leads_present: names,
      leads_derived: parsed.leads_derived || [],
      beats_analysed: perBeat.length,
      reference_lead: refName,
      rr_cv: Math.round(rrCv * 1000) / 1000,
      st_detail: stDetail,
    },
    measurement_source: "digital_signal",
    verification_status: "measured",
  };
}

export const MEASURE_REASON_HE = {
  no_signal: "אין אות דיגיטלי.",
  no_reference_lead: "לא נמצאה הובלה לניתוח קצב.",
  too_few_beats: "זוהו פחות משלוש פעימות — לא ניתן למדוד.",
  rr_undetermined: "לא ניתן לקבוע מרווח R–R.",
  rate_implausible: "הקצב שחושב אינו סביר — האות או קצב הדגימה שגויים.",
  delineation_failed: "לא ניתן לתחום את קומפלקס ה-QRS באות.",
};

export function measureReasonHe(reason) {
  return MEASURE_REASON_HE[reason] || "לא ניתן למדוד מהאות.";
}
