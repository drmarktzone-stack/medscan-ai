/**
 * Parent-facing lab result helper — same engine output, different voice.
 * Not a diagnosis. No professional DDx names. No dosing.
 */

const DRAFT = 'draft_needs_verification';
const CLINICAL_NAMES = /\b(DDx|syndrome|nephrotic|sepsis|DKA|HUS|ITP|ALL|AML)\b/i;

function clean(text) {
  const s = String(text || '').trim();
  if (!s || CLINICAL_NAMES.test(s)) return null;
  return s;
}

function urgencyFromResult(result) {
  const flags = result?.red_flags || result?.rules?.red_flags || [];
  if (flags.length) return 'urgent';
  const patterns = result?.matched_patterns || [];
  if (patterns.some((p) => p?.severity === 'critical' || p?.urgency === 'urgent')) return 'urgent';
  const unknowns = result?.unknowns_he || result?.warnings || [];
  if (unknowns.length) return 'follow_up';
  return 'routine';
}

/** @param {{ result: object, t: (key: string, params?: object) => string }} opts */
export function buildParentLabHelp({ result, t } = {}) {
  const translate = typeof t === 'function' ? t : (k) => k;
  const urgency = urgencyFromResult(result);
  const pictureKey = urgency === 'urgent'
    ? 'journey.results_picture_urgent'
    : urgency === 'follow_up'
      ? 'journey.results_picture_follow'
      : 'journey.results_picture_routine';

  const askDoctor = [
    translate('journey.results_ask_show'),
    translate('journey.results_ask_meaning'),
  ];

  const abnormal = (result?.normalized || []).filter(
    (row) => row.flag === 'high' || row.flag === 'low' || row.flag === 'critical',
  );
  if (abnormal.length) {
    askDoctor.push(
      `${translate('journey.results_ask_abnormal')}: ${abnormal.slice(0, 5).map((r) => r.analyte || r.canonical_key).join(', ')}`,
    );
  }

  const summary = clean(result?.summary_he || result?.interpretation_he || result?.analysis);
  if (summary) {
    askDoctor.push(`${translate('journey.results_ask_summary')}: ${summary.slice(0, 200)}`);
  }

  const recommendDo = urgency === 'urgent'
    ? [translate('journey.results_do_urgent')]
    : [translate('journey.results_do_routine'), translate('journey.results_do_save')];

  const nextSteps = (result?.next_steps_he || result?.workup_he || [])
    .map(clean)
    .filter(Boolean)
    .slice(0, 4);

  return {
    ok: true,
    not_a_diagnosis: true,
    picture: translate(pictureKey),
    ask_doctor: askDoctor.map(clean).filter(Boolean),
    recommend_do: recommendDo,
    next_steps: nextSteps,
    abnormal_count: abnormal.length,
    urgency,
    verification_status: result?.verification_status || DRAFT,
  };
}
