/**
 * On-device ECG paper screen from pixels.
 * 1) Find ink rows (lead stacks).
 * 2) Use grid calibration sample-rate when digitize succeeded.
 * 3) Flag relative ST/T change after R. No mm. No infarct name.
 */

import { detectRPeaks } from "../../ecgDigitize.js";
import { extractSttHints } from "./ecgWaveformFeatures.js";

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** ST/T from R–R fraction so a cropped photo does not need a 10-second assumption. */
export function extractSttHintsFromRr(samples, peaks) {
  if (!samples?.length || !peaks || peaks.length < 2) {
    return { ok: false, reason: "too_few_peaks" };
  }
  const rrs = [];
  for (let i = 1; i < peaks.length; i++) rrs.push(peaks[i] - peaks[i - 1]);
  const rr = median(rrs);
  if (!rr || rr < 8) return { ok: false, reason: "rr_too_short" };
  const stOff = Math.max(4, Math.round(rr * 0.12));
  const tOff = Math.max(stOff + 2, Math.round(rr * 0.28));
  const jDeltas = [];
  const tDeltas = [];
  for (const r of peaks) {
    const baseStart = Math.max(0, r - Math.max(3, Math.round(rr * 0.06)));
    let base = 0;
    let n = 0;
    for (let i = baseStart; i < r; i++) {
      base += samples[i];
      n += 1;
    }
    if (!n) continue;
    base /= n;
    const si = r + stOff;
    if (si < samples.length) jDeltas.push(samples[si] - base);
    const ti = r + tOff;
    if (ti < samples.length) tDeltas.push(samples[ti] - base);
  }
  if (jDeltas.length < 2) return { ok: false, reason: "too_few_beats" };
  const j = jDeltas.reduce((s, x) => s + x, 0) / jDeltas.length;
  const t = tDeltas.length ? tDeltas.reduce((s, x) => s + x, 0) / tDeltas.length : null;
  const amp = Math.max(...samples.map((x) => Math.abs(x)), 1e-6);
  const jRel = j / amp;
  const tRel = t == null ? null : t / amp;
  return {
    ok: true,
    st_relative: Math.round(jRel * 1000) / 1000,
    t_relative: tRel == null ? null : Math.round(tRel * 1000) / 1000,
    possible_st_change: Math.abs(jRel) >= 0.08,
    possible_t_inversion: tRel != null && tRel < -0.06,
  };
}

const DRAFT = "draft_needs_verification";

function fail(reason) {
  return { ok: false, reason, verification_status: DRAFT };
}

function interpolateGaps(sig) {
  const out = sig.slice();
  let lastIdx = -1;
  let lastVal = null;
  for (let i = 0; i < out.length; i++) {
    if (out[i] != null) {
      if (lastIdx >= 0 && i - lastIdx > 1 && lastVal != null) {
        const step = (out[i] - lastVal) / (i - lastIdx);
        for (let j = lastIdx + 1; j < i; j++) out[j] = lastVal + step * (j - lastIdx);
      }
      lastIdx = i;
      lastVal = out[i];
    }
  }
  for (let i = 0; i < out.length; i++) if (out[i] == null) out[i] = lastVal ?? 0;
  return out;
}

function lum(data, w, x, y) {
  const i = (y * w + x) * 4;
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

export function extractBandTrace(imageData, y0, y1) {
  const w = imageData.width;
  const data = imageData.data;
  const signal = [];
  for (let x = 0; x < w; x++) {
    let darkest = 255;
    let darkY = null;
    const top = Math.max(0, y0);
    const bot = Math.min(imageData.height, y1);
    for (let y = top; y < bot; y++) {
      const v = lum(data, w, x, y);
      if (v < darkest) {
        darkest = v;
        darkY = y;
      }
    }
    signal.push(darkY == null || darkest > 140 ? null : (bot - darkY));
  }
  return interpolateGaps(signal);
}

/** Ink-density rows for stacked leads (V4/V5/V6). One strip → one padded row. */
export function estimateLeadRows(imageData, { maxRows = 6 } = {}) {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const proj = new Array(h).fill(0);
  for (let y = 0; y < h; y++) {
    let dark = 0;
    for (let x = 0; x < w; x += 2) {
      if (lum(data, w, x, y) < 110) dark += 1;
    }
    proj[y] = dark;
  }
  const peak = Math.max(...proj, 1);
  const thr = peak * 0.16;
  const raw = [];
  let start = null;
  for (let y = 0; y < h; y++) {
    if (proj[y] >= thr) {
      if (start == null) start = y;
    } else if (start != null) {
      raw.push({ y0: start, y1: y });
      start = null;
    }
  }
  if (start != null) raw.push({ y0: start, y1: h });

  const pad = Math.max(24, Math.round(h * 0.1));
  const expanded = raw
    .map((r) => ({ y0: Math.max(0, r.y0 - pad), y1: Math.min(h, r.y1 + pad) }))
    .filter((r) => r.y1 - r.y0 >= 16);

  const merged = [];
  for (const row of expanded) {
    const last = merged[merged.length - 1];
    if (last && row.y0 <= last.y1 + 8) last.y1 = Math.max(last.y1, row.y1);
    else merged.push({ ...row });
  }

  if (!merged.length) return [{ y0: 0, y1: h }];
  return merged.slice(0, maxRows);
}

function sampleRateHz(imageData, digitize) {
  const hz = Number(digitize?.calibration?.sample_rate_hz);
  if (Number.isFinite(hz) && hz > 8) return hz;
  const box = Number(digitize?.calibration?.px_per_small_box);
  const speed = Number(digitize?.calibration?.speed_mm_s) || 25;
  if (Number.isFinite(box) && box >= 4) return box / (0.04 * (25 / speed));
  return imageData.width / 10;
}

/**
 * @param {{ width:number, height:number, data:Uint8ClampedArray|Uint8Array }} imageData
 */
export function screenEcgImageData(imageData, { digitize = null } = {}) {
  if (!imageData?.data || !imageData.width || !imageData.height) {
    return fail("no_pixels");
  }
  const w = imageData.width;
  const h = imageData.height;
  if (w < 80 || h < 40) return fail("too_small");

  const rate = sampleRateHz(imageData, digitize);
  const rows = [{ y0: 0, y1: h }, ...estimateLeadRows(imageData)];
  const bandResults = [];

  for (let b = 0; b < rows.length; b++) {
    const { y0, y1 } = rows[b];
    const trace = extractBandTrace(imageData, y0, y1);
    const peaks = detectRPeaks(trace, rate);
    const fromRr = extractSttHintsFromRr(trace, peaks);
    const hints = fromRr.ok ? fromRr : extractSttHints(trace, rate, peaks);
    bandResults.push({
      band: b,
      y0,
      y1,
      peak_count: peaks.length,
      st_relative: hints.ok ? hints.st_relative : null,
      possible_st_change: Boolean(hints.ok && hints.possible_st_change),
      possible_t_inversion: Boolean(hints.ok && hints.possible_t_inversion),
      elevating: Boolean(hints.ok && hints.possible_st_change && hints.st_relative > 0),
      depressing: Boolean(hints.ok && hints.possible_st_change && hints.st_relative < 0),
    });
  }

  const elev = bandResults.filter((b) => b.elevating);
  const dep = bandResults.filter((b) => b.depressing);
  return {
    ok: true,
    possible_st_elevation: elev.length >= 1,
    possible_st_depression: dep.length >= 1,
    elevated_band_count: elev.length,
    depressed_band_count: dep.length,
    calibrated: Boolean(digitize?.ok && digitize?.calibration?.px_per_small_box),
    sample_rate_hz: Math.round(rate * 100) / 100,
    bands: bandResults,
    verification_status: DRAFT,
    note_he: "סריקת פיקסלים יחסית. אינה מדידת מ״מ ואינה אבחנת אוטם.",
  };
}
