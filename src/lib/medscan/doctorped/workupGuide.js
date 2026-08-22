/**
 * Next-step workup from the existing pediatric pathway dictionary.
 * Start = first step. End = step with no branches. No invented steps.
 */

import { matchPediatricPathway, toProtocolView } from '../engines/pediatricPathways.js';
import { resolveStep } from '../engines/protocolTree.js';

export function buildWorkupGuide({
  query = '',
  age_days = null,
  currentStepId = null,
  locale = 'he',
} = {}) {
  const match = matchPediatricPathway({
    query,
    age_days,
    currentStepId,
    locale,
  });
  if (!match?.matched) {
    return {
      ok: false,
      reason: 'no_pathway',
      message_he: 'לא הותאם מסלול קהילה מהמאגר — בחרו תלונה ברורה או פתחו פרוטוקול ידנית.',
      verification_status: 'unavailable',
    };
  }
  const view = match.protocol_view || toProtocolView(match.matched);
  const start = resolveStep(view, null);
  const current = resolveStep(view, currentStepId);
  const step = current.step;
  const branches = step?.branches ?? [];
  return {
    ok: true,
    verification_status: match.matched.verification_status,
    pathway_key: match.matched.pathway_key,
    title_he: match.matched.title_he,
    source_anchor: match.matched.source_anchor,
    start_step_id: start.step?.step_id ?? null,
    start_title_he: start.step?.title_he ?? null,
    current_step_id: step?.step_id ?? null,
    current_title_he: step?.title_he ?? null,
    is_start: !currentStepId || currentStepId === start.step?.step_id,
    is_end: Boolean(step) && branches.length === 0,
    actions_he: step?.actions_he ?? [],
    red_flags_he: step?.red_flags_he ?? [],
    next_branches: branches,
    broken_branches: current.brokenBranches ?? [],
    error_he: current.error_he,
    entry_criteria_he: match.matched.entry_criteria_he ?? [],
  };
}

export function hardDirections(result) {
  const engines = result?.engines_run ?? [];
  const hardIds = new Set(['pain', 'triads', 'genetics', 'metabolic', 'neurodev']);
  const fromEngines = engines.filter((e) => hardIds.has(e.id) && e.ok !== false);
  const ddx = (result?.differential ?? []).filter((d) => (
    d.must_not_miss
    || d.suspicion === 'red'
    || /chronic|syndrome|genetic|metabolic|rare/i.test(JSON.stringify(d))
  ));
  return {
    engines: fromEngines,
    differential: ddx,
  };
}
