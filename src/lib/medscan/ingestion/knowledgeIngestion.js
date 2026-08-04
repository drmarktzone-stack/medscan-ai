/**
 * MedScan — Knowledge Ingestion
 *
 * מסלול הכניסה של תוכן קליני למערכת: טקסט → חילוץ מובנה → טיוטות.
 *
 * ## למה זה החלק המסוכן ביותר בכל המערכת
 * כל שאר השכבות מגינות על **הפלט**. הן מוודאות שהמודל לא ימציא מעבר
 * למה שב-KB. אבל אם ה-KB עצמו מכיל טעות — היא תעבור את כולן בשלום,
 * כי היא תיראה כמו ידע מאומת.
 *
 * לכן כאן ההגנה שונה באופיה:
 *   · כל פריט נושא ציטוט-מקור — בלעדיו הוא לא נשמר
 *   · כל פריט נכנס כטיוטה, תמיד, בלי יוצא מן הכלל
 *   · מינונים אינם מחולצים לכללים — רק מדווחים לעיון
 *   · פערים מוצהרים; רשימת פערים ריקה היא סימן אזהרה בפני עצמו
 *
 * ההגנה האמיתית היא הרופא/ה שמאשר/ת. התפקיד שלנו הוא להביא לו/ה
 * חומר שניתן לבדוק — עם ציטוט לכל טענה.
 */

import { EXTRACTION_SCHEMA, EXTRACTION_SYSTEM_PROMPT } from './extractionSchema.js';
import { createInvokeLLM, createKbRecord } from '../llmAdapter.js';

export {
  CHUNK_CHARS, detectSeams, chunkText, validateExtraction,
} from './extractionCore.js';

import { detectSeams, validateExtraction } from './extractionCore.js';

/**
 * שומר חילוץ מאומת-מבנית ל-KB. הכל כטיוטה.
 * @returns {Promise<{saved: object, failed: object[]}>}
 */
export async function saveExtraction(kept) {
  const saved = { topics: 0, lab_patterns: 0, red_flags: 0, clinical_rules: 0, associations: 0 };
  const failed = [];

  const save = async (entity, rows, counterKey, mapFn) => {
    for (const row of rows) {
      try {
        await createKbRecord(entity, mapFn(row));
        saved[counterKey] += 1;
      } catch (e) {
        failed.push({ entity, key: row.topic_key ?? row.pattern_key ?? row.flag_key ?? row.rule_key ?? row.assoc_key, error: String(e?.message ?? e) });
      }
    }
  };

  // הציטוט נשמר ב-review_note_he — הוא מה שהרופא/ה בודק/ת מולו
  const note = (r) => `ציטוט מקור: "${r.source_quote_he}"`;

  await save('KnowledgeTopic', kept.topics, 'topics', (t) => ({
    topic_key: t.topic_key,
    topic_title_he: t.topic_title_he,
    topic_title_en: t.topic_title_en ?? null,
    summary_he: t.summary_he,
    keywords: t.keywords ?? [],
    age_scope: t.age_scope ?? 'all',
    review_note_he: note(t),
  }));

  await save('LabPattern', kept.lab_patterns, 'lab_patterns', (p) => ({
    pattern_key: p.pattern_key,
    title_he: p.title_he,
    components: p.components,
    min_components: p.min_components ?? 2,
    direction_he: p.direction_he,
    suspicion: p.suspicion,
    clinical_reasoning_he: p.clinical_reasoning_he ?? null,
    confirm_with_he: p.confirm_with_he ?? [],
    source_anchor: p.source_anchor,
    review_note_he: note(p),
  }));

  await save('RedFlag', kept.red_flags, 'red_flags', (f) => ({
    flag_key: f.flag_key,
    label_he: f.label_he,
    trigger: f.trigger,
    age_min_days: f.age_min_days ?? null,
    age_max_days: f.age_max_days ?? null,
    severity: f.severity ?? 'red',
    action_he: f.action_he,
    reason_he: f.reason_he ?? null,
    source_anchor: f.source_anchor,
    review_note_he: note(f),
  }));

  await save('ClinicalRule', kept.clinical_rules, 'clinical_rules', (r) => ({
    rule_key: r.rule_key,
    title_he: r.title_he,
    category: r.category ?? null,
    domain: r.domain ?? null,
    conditions: r.conditions,
    logic: r.logic ?? 'all',
    min_count: r.min_count ?? 0,
    conclusion_he: r.conclusion_he,
    suspicion: r.suspicion,
    clinical_reasoning_he: r.clinical_reasoning_he ?? null,
    recommended_workup_he: r.recommended_workup_he ?? [],
    source_anchor: r.source_anchor,
    review_note_he: note(r),
  }));

  await save('Association', kept.associations, 'associations', (a) => ({
    assoc_key: a.assoc_key,
    anchor_finding_he: a.anchor_finding_he,
    co_findings: a.co_findings ?? [],
    implies_he: a.implies_he,
    suspicion: a.suspicion,
    mechanism_he: a.mechanism_he ?? null,
    action_he: a.action_he ?? null,
    age_scope: a.age_scope ?? 'all',
    source_anchor: a.source_anchor,
    review_note_he: note(a),
  }));

  return { saved, failed };
}

/**
 * הזרימה המלאה לקטע אחד.
 *
 * קטע שזוהה כמשובש **אינו מחולץ כלל**. עדיף לאבד קטע
 * מאשר לייצר ממנו ידע שמערבב שתי מחלות — טעות כזו תעבור
 * את כל שכבות ההגנה, כי הציטוט שלה אמיתי.
 */
export async function ingestChunk({ text, chapterHint, invokeLLM, allowSuspect = false }) {
  const seams = detectSeams(text);
  if (seams.verdict === 'corrupt' || (seams.verdict === 'suspect' && !allowSuspect)) {
    return {
      ok: false,
      error: 'text_seams_detected',
      seams,
      message_he:
        `הקטע לא חולץ: זוהו סימני תפר בין עמודות ב-${Math.round(seams.score * 100)}% מהשורות. ` +
        'טקסט שמערבב שתי עמודות מייצר ידע שנראה תקין ומערבב עובדות ' +
        'משתי מחלות שונות — והוא יעבור את כל הבדיקות, כי הציטוט שלו אמיתי.',
    };
  }

  const { extraction, error } = await extractFromChunk({ text, chapterHint, invokeLLM });
  if (error || !extraction) return { ok: false, error, extraction: null, seams };

  const { kept, problems, dropped } = validateExtraction(extraction);
  if (seams.verdict === 'suspect') {
    problems.push({
      kind: 'extraction', key: '—', severity: 'warn',
      why_he: `זוהו סימני תפר ב-${Math.round(seams.score * 100)}% מהשורות. יש לבדוק כל פריט מול המקור.`,
    });
  }
  return {
    ok: true,
    extraction,
    kept,
    problems,
    dropped,
    seams,
    gaps_he: extraction.gaps_he ?? [],
    dosing_mentions_he: extraction.dosing_mentions_he ?? [],
  };
}

export { createInvokeLLM };
