/**
 * מעטפת פענוח מהמנוע הדטרמיניסטי — בלי שער שפה.
 * לא ממציאה תוכן קליני: רק ממפה kbItems / דגלים שכבר חשבו בקוד.
 */

import { DISCLAIMER_HE } from '../schemas/output.schemas.js';

export const CODE_FIRST_NOTE_HE =
  'הפענוח מבוסס על המנוע הדטרמיניסטי בקוד. שער השפה לא רץ כאן. הטיוטה דורשת אימות רופא ואינה אבחנה.';

export function groundingToDifferential(grounding = {}) {
  const items = grounding.kbItems ?? [];
  return items
    .map((k, i) => ({
      direction_id: k.pattern_key || k.rule_key || k.assoc_key || k.pathway_key || `G${i + 1}`,
      diagnosis_direction_he: k.direction_he || k.title_he || k.conclusion_he || k.label_he || '',
      rank: i + 1,
      must_not_miss: k.suspicion === 'red',
      confidence: { level: k.suspicion || 'yellow' },
      supports_he: [k.clinical_reasoning_he || k.evidence_he].filter(Boolean),
      refutes_he: [],
      discriminating_test_he: Array.isArray(k.confirm_with_he) ? k.confirm_with_he[0] : (k.confirm_with_he || null),
      source_anchors: [k.source_anchor, ...(k.extra_anchors ?? [])].filter(Boolean),
      verification_status: k.verification_status || 'draft_needs_verification',
    }))
    .filter((d) => d.diagnosis_direction_he);
}

export function buildCodeFirstEnvelope({
  engine,
  grounding = {},
  deterministic = [],
  extra = {},
  llmError = null,
} = {}) {
  const red_flags = grounding.redFlags ?? grounding.red_flags ?? [];
  const differential = groundingToDifferential(grounding);
  const hasSignal = red_flags.length > 0 || differential.length > 0 || (deterministic?.length > 0);
  const unknowns = [
    CODE_FIRST_NOTE_HE,
    ...(llmError ? [`שער השפה: ${String(llmError)}`] : []),
    ...(grounding.redFlagsSkipped ?? []).map((s) => s.message_he).filter(Boolean),
  ];

  return {
    status: hasSignal ? 'degraded' : 'insufficient',
    ok: true,
    engine,
    red_flags,
    differential,
    kbItems: grounding.kbItems ?? [],
    matched_patterns: (grounding.matchedPatterns ?? [])
      .map((p) => p.pattern_key)
      .filter(Boolean),
    claims: [],
    overall_suspicion: red_flags.length ? 'red' : (differential.length ? 'yellow' : 'insufficient'),
    message_he: hasSignal
      ? CODE_FIRST_NOTE_HE
      : 'המנוע הדטרמיניסטי רץ. לא הותאם דפוס מעוגן — בדקו גיל, טווחי ייחוס וממצאים. היעדר התאמה אינו אומר שהכל תקין.',
    unknowns_he: unknowns,
    what_would_help_he: [
      'מילוי טווחי ייחוס מגיליון המעבדה ליד כל מדד.',
      'אימות פריטי ידע במסך ניהול הידע.',
    ],
    verification_status: 'draft_needs_verification',
    disclaimer_he: DISCLAIMER_HE,
    code_first: true,
    ...extra,
  };
}
