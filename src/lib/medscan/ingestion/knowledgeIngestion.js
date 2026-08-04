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
import { resolveAnalyte } from '../deterministic/analyteCatalog.js';

/** גודל קטע לחילוץ. גדול מדי → המודל מסכם; קטן מדי → מאבד הקשר. */
export const CHUNK_CHARS = 6000;

/**
 * גילוי "תפר" — שתי עמודות שנתפרו לשורה אחת.
 *
 * ## למה זה הבדיקה החשובה ביותר בשלב הייבוא
 * מסמכים רפואיים נכתבים שכיחות בשתי עמודות — לעיתים שתי **מחלות
 * שונות** זו לצד זו. כשה-PDF משטח אותן לשורה אחת, מתקבל משפט
 * שנראה קוהרנטי ומערבב עובדות משתי מחלות.
 *
 * זה הגרוע מכל: המודל יחלץ ממנו ידע שנראה תקין, הוא יישא
 * ציטוט-מקור אמיתי, והרופא/ה יאשר/תאשר אותו — כי הציטוט אכן
 * מופיע במסמך. רק שהוא מעולם לא נכתב כמשפט אחד.
 */
const SEAM_PATTERNS = [
  // עברית אחרי נקודתיים/סוגר-סוגריים בלי רווח — חתך אופייני
  { re: /[֐-׿][:)\]][֐-׿]/, why: 'מעבר עברית→עברית בלי רווח אחרי סימן פיסוק' },
  // סוגר סוגריים לפני פותח — שארית של שתי עמודות
  { re: /\)\s*[••]/, why: 'סוגר-סוגריים צמוד לתבליט' },
  { re: /[••]\s*[••]/, why: 'שני תבליטים באותה שורה' },
  // פתיחת סוגריים שלא נסגרה באותה שורה, ולהפך
  { re: /\)[^(]*$/, why: 'סוגר סוגריים ללא פותח' },
];

/**
 * @returns {{score: number, lines: object[], verdict: 'clean'|'suspect'|'corrupt'}}
 */
export function detectSeams(text) {
  const lines = String(text ?? '').split('\n').filter((l) => l.trim().length > 20);
  if (!lines.length) return { score: 0, lines: [], verdict: 'clean' };

  const flagged = [];
  for (const line of lines) {
    const hits = SEAM_PATTERNS.filter((p) => p.re.test(line));
    if (hits.length) flagged.push({ line: line.slice(0, 120), reasons: hits.map((h) => h.why) });
  }

  const score = flagged.length / lines.length;
  const verdict = score > 0.25 ? 'corrupt' : score > 0.08 ? 'suspect' : 'clean';
  return { score: Number(score.toFixed(3)), lines: flagged.slice(0, 8), verdict, total_lines: lines.length };
}

/**
 * מפצל טקסט לקטעים, בגבולות טבעיים.
 * חיתוך באמצע נושא גורם לחילוץ חלקי שנראה שלם — לכן מעדיפים
 * גבול פסקה, ורק כמוצא אחרון חותכים באמצע.
 */
export function chunkText(text, maxChars = CHUNK_CHARS) {
  const clean = String(text ?? '').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  let rest = clean;

  while (rest.length > maxChars) {
    const slice = rest.slice(0, maxChars);
    // עדיפות: שורה ריקה > סוף שורה > נקודה
    let cut = slice.lastIndexOf('\n\n');
    if (cut < maxChars * 0.5) cut = slice.lastIndexOf('\n');
    if (cut < maxChars * 0.5) cut = slice.lastIndexOf('. ');
    if (cut < maxChars * 0.5) cut = maxChars;

    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/**
 * מחלץ ידע מקטע טקסט אחד.
 * @returns {Promise<{extraction: object|null, error: string|null}>}
 */
export async function extractFromChunk({ text, chapterHint = null, invokeLLM }) {
  try {
    const result = await invokeLLM({
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: [
        chapterHint ? `הקשר: ${chapterHint}` : '',
        '',
        'הטקסט לחילוץ:',
        '---',
        text,
        '---',
        '',
        'חלץ ידע מובנה. זכור: ציטוט-מקור לכל פריט, ואל תשלים מהידע שלך.',
      ].filter(Boolean).join('\n'),
      schema: EXTRACTION_SCHEMA,
      purpose: 'knowledge_extraction',
    });

    if (!result || typeof result !== 'object') {
      return { extraction: null, error: 'extraction_malformed' };
    }
    return { extraction: result, error: null };
  } catch (e) {
    return { extraction: null, error: String(e?.message ?? e) };
  }
}

/**
 * בדיקות תקינות דטרמיניסטיות על החילוץ — לפני שהוא מגיע לרופא/ה.
 * מסננות את מה שניתן לפסול בקוד, כדי שזמן הבדיקה האנושי יילך
 * למה שבאמת דורש שיקול דעת.
 */
export function validateExtraction(extraction) {
  const problems = [];
  const topicKeys = new Set((extraction?.topics ?? []).map((t) => t.topic_key));

  const checkAnchor = (item, kind, key) => {
    if (!item.source_anchor) {
      problems.push({ kind, key, severity: 'drop', why_he: 'אין עוגן לנושא' });
      return false;
    }
    if (!topicKeys.has(item.source_anchor)) {
      problems.push({
        kind, key, severity: 'drop',
        why_he: `העוגן "${item.source_anchor}" אינו אחד מהנושאים שחולצו`,
      });
      return false;
    }
    return true;
  };

  const checkQuote = (item, kind, key) => {
    const q = item.source_quote_he;
    if (!q || q.trim().length < 10) {
      problems.push({ kind, key, severity: 'drop', why_he: 'אין ציטוט-מקור — לא ניתן לבדוק' });
      return false;
    }
    return true;
  };

  const kept = { topics: [], lab_patterns: [], red_flags: [], clinical_rules: [], associations: [] };

  for (const t of extraction?.topics ?? []) {
    if (!checkQuote(t, 'topic', t.topic_key)) continue;
    if (!/^nelson\.[a-z0-9_]+\.[a-z0-9_]+$/i.test(t.topic_key ?? '')) {
      problems.push({
        kind: 'topic', key: t.topic_key, severity: 'warn',
        why_he: 'topic_key אינו בפורמט nelson.<domain>.<topic>',
      });
    }
    kept.topics.push(t);
  }

  for (const p of extraction?.lab_patterns ?? []) {
    if (!checkQuote(p, 'lab_pattern', p.pattern_key)) continue;
    if (!checkAnchor(p, 'lab_pattern', p.pattern_key)) continue;

    // מדד שאינו בקטלוג לא יתאים לעולם — עדיף לדעת עכשיו
    const unknown = (p.components ?? [])
      .filter((c) => !resolveAnalyte(c.analyte))
      .map((c) => c.analyte);
    if (unknown.length) {
      problems.push({
        kind: 'lab_pattern', key: p.pattern_key, severity: 'warn',
        why_he: `מדדים שאינם בקטלוג ולכן לא יופעלו: ${unknown.join(', ')}`,
      });
    }
    kept.lab_patterns.push(p);
  }

  for (const f of extraction?.red_flags ?? []) {
    if (!checkQuote(f, 'red_flag', f.flag_key)) continue;
    if (!checkAnchor(f, 'red_flag', f.flag_key)) continue;
    if (!(f.trigger?.findings ?? []).length) {
      problems.push({ kind: 'red_flag', key: f.flag_key, severity: 'drop', why_he: 'אין תנאי הפעלה' });
      continue;
    }
    // חלון גיל הפוך = תקלת חילוץ, והדגל לעולם לא ייורה
    if (Number.isFinite(f.age_min_days) && Number.isFinite(f.age_max_days)
        && f.age_min_days > f.age_max_days) {
      problems.push({ kind: 'red_flag', key: f.flag_key, severity: 'drop', why_he: 'חלון גיל הפוך' });
      continue;
    }
    kept.red_flags.push(f);
  }

  for (const r of extraction?.clinical_rules ?? []) {
    if (!checkQuote(r, 'clinical_rule', r.rule_key)) continue;
    if (!checkAnchor(r, 'clinical_rule', r.rule_key)) continue;

    // מינון שדלף לתוך כלל — נפסל. כללים אינם מקום למינון.
    const text = `${r.conclusion_he ?? ''} ${(r.recommended_workup_he ?? []).join(' ')}`;
    if (/\d+\s*(מ["׳']?ג|mg|mcg|מ["׳']?ל|ml)\s*\/\s*(ק["׳']?ג|kg)/i.test(text)) {
      problems.push({
        kind: 'clinical_rule', key: r.rule_key, severity: 'drop',
        why_he: 'הכלל מכיל מינון. מינונים שייכים ל-DoseRecord בלבד.',
      });
      continue;
    }
    kept.clinical_rules.push(r);
  }

  for (const a of extraction?.associations ?? []) {
    if (!checkQuote(a, 'association', a.assoc_key)) continue;
    if (!checkAnchor(a, 'association', a.assoc_key)) continue;
    kept.associations.push(a);
  }

  // חילוץ עשיר בלי ולו פער אחד מוצהר הוא חשוד
  const totalItems =
    kept.lab_patterns.length + kept.red_flags.length +
    kept.clinical_rules.length + kept.associations.length;
  if (totalItems >= 3 && !(extraction?.gaps_he ?? []).length) {
    problems.push({
      kind: 'extraction', key: '—', severity: 'warn',
      why_he: 'לא הוצהר שום פער. בקטע עשיר זה בדרך כלל אומר שמשהו הושלם במקום לדווח עליו.',
    });
  }

  return { kept, problems, dropped: problems.filter((p) => p.severity === 'drop').length };
}

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
