/**
 * ממיר חילוץ מאומת לרשומות KB מוכנות לכתיבה.
 *
 * המיפוי כאן הוא בדיוק זה של `saveExtraction` ב-knowledgeIngestion.js —
 * אותם שדות, אותה הערת-ביקורת, ואותו סטטוס. ההבדל היחיד הוא שכאן
 * הרשומות נפלטות כ-JSON במקום להיכתב דרך ה-SDK של הדפדפן.
 *
 * ⚠ verification_status הוא draft_needs_verification, תמיד ובלי יוצא
 * מן הכלל. פריט שלא נחתם ע"י רופא/ה אינו משתתף בפלט קליני — וזו
 * ההגנה האמיתית היחידה על הידע שנכנס כאן.
 *
 * שימוש:  node scripts/emitKbRecords.mjs <kept.json> <out-dir>
 */

import fs from 'node:fs';
import path from 'node:path';

const [keptFile, outDir] = process.argv.slice(2);
if (!keptFile || !outDir) {
  console.error('usage: node scripts/emitKbRecords.mjs <kept.json> <out-dir>');
  process.exit(2);
}

const kept = JSON.parse(fs.readFileSync(keptFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const DRAFT = 'draft_needs_verification';
const note = (r) => `ציטוט מקור: "${r.source_quote_he}"`;

const MAP = {
  KnowledgeTopic: [kept.topics, (t) => ({
    topic_key: t.topic_key,
    topic_title_he: t.topic_title_he,
    topic_title_en: t.topic_title_en ?? null,
    summary_he: t.summary_he,
    keywords: t.keywords ?? [],
    age_scope: t.age_scope ?? 'all',
    review_note_he: note(t),
  })],
  LabPattern: [kept.lab_patterns, (p) => ({
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
  })],
  RedFlag: [kept.red_flags, (f) => ({
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
  })],
  ClinicalRule: [kept.clinical_rules, (r) => ({
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
  })],
  Association: [kept.associations, (a) => ({
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
  })],
};

let total = 0;
for (const [entity, [rows, mapFn]] of Object.entries(MAP)) {
  if (!rows?.length) continue;
  const records = rows.map((r) => ({ ...mapFn(r), verification_status: DRAFT }));
  const file = path.join(outDir, `${entity}.json`);
  fs.writeFileSync(file, JSON.stringify(records, null, 0));
  console.log(`  ${entity.padEnd(16)} ${String(records.length).padStart(3)} → ${file}`);
  total += records.length;
}
console.log(`\n  סה"כ ${total} רשומות, כולן ${DRAFT}\n`);
