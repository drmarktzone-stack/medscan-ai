/**
 * MedScan — בדיקות לצינור טעינת הידע
 *
 * הצינור הזה הוא הנתיב שדרכו נכנס ידע קליני ל-KB. כל שאר שכבות
 * ההגנה שומרות על הפלט; זו שומרת על **הקלט**. טעות שתעבור כאן
 * תיראה מכאן והלאה כמו ידע מאומת ותעבור את כל השאר בשלום.
 *
 * הרצה:  npm test
 */

import {
  planIngestion, applyPlan, summarize,
} from '../src/lib/medscan/ingestion/ingestExtraction.js';
import {
  toKbRecords, stringifyConditionValue, NATURAL_KEY, DRAFT_STATUS,
} from '../src/lib/medscan/ingestion/kbRecords.js';

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ✓ ${name}`); }
  catch (e) { failed += 1; failures.push({ name, error: e.message }); console.log(`  ✗ ${name}\n      ${e.message}`); }
}
async function testAsync(name, fn) {
  try { await fn(); passed += 1; console.log(`  ✓ ${name}`); }
  catch (e) { failed += 1; failures.push({ name, error: e.message }); console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
function assertEq(a, b, m) {
  if (a !== b) throw new Error(`${m || 'expected equality'}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
}
function section(t) { console.log(`\n${t}`); }

/* ── נתוני עזר ───────────────────────────────────────────────────────── */

// ⚠ הציטוטים כאן אינם מקוצרים במכוון: הוולידטור דוחה ציטוט
// קצר מ-10 תווים, ובצדק — ציטוט של מילה אחת אינו בר-בדיקה.
const TOPIC = {
  topic_key: 'nelson22.c85.septic_shock',
  topic_title_he: 'שוק ספטי',
  summary_he: 'סיכום בדיקה',
  source_quote_he: 'ציטוט מלא מהמקור לצורך הבדיקה',
  page_start: 601,
};

const RULE = {
  rule_key: 'test.rule',
  title_he: 'כלל בדיקה',
  conditions: [{ type: 'lab', key: 'CRP', op: '>', value: 40 }],
  conclusion_he: 'מסקנה',
  suspicion: 'yellow',
  source_anchor: 'nelson22.c85.septic_shock',
  source_quote_he: 'ציטוט מלא מהמקור עבור הכלל',
};

const FLAG = {
  flag_key: 'test.flag',
  label_he: 'דגל בדיקה',
  trigger: { findings: ['חום'], logic: 'all' },
  severity: 'critical',
  action_he: 'פעולה נדרשת',
  source_anchor: 'nelson22.c85.septic_shock',
  source_quote_he: 'ציטוט מלא מהמקור עבור הדגל',
};

const extraction = (over = {}) => ({
  _provenance_he: 'מקור בדיקה',
  topics: [TOPIC],
  clinical_rules: [RULE],
  red_flags: [FLAG],
  associations: [],
  lab_patterns: [],
  gaps_he: ['פער לדוגמה'],
  dosing_mentions_he: [],
  ...over,
});

/* ═══════════════════════════════════════════════════════════════════════
 * מיפוי — מקור-אמת אחד
 * ═══════════════════════════════════════════════════════════════════════ */
section('מיפוי רשומות — מקור-אמת אחד');

test('conditions[].value מומר למחרוזת', () => {
  // ⚠ הרגרסיה שהבדיקה הזו נועדה למנוע: שכבת האחסון מקבלת בשדה
  // הזה מחרוזת בלבד. מספר מפיל את הכתיבה כולה.
  const recs = toKbRecords({ clinical_rules: [RULE], topics: [], red_flags: [], associations: [], lab_patterns: [] });
  const v = recs.ClinicalRule[0].conditions[0].value;
  assertEq(typeof v, 'string', 'ערך מספרי לא הומר');
  assertEq(v, '40');
});

test('טווח נכתב כ-lo-hi ולא כ-JSON', () => {
  assertEq(stringifyConditionValue([2, 8]), '2-8');
  assertEq(stringifyConditionValue(null), null);
  assertEq(stringifyConditionValue(0), '0', 'אפס אינו null');
});

test('כל רשומה נכנסת כטיוטה, בלי יוצא מן הכלל', () => {
  const recs = toKbRecords({
    topics: [{ ...TOPIC, verification_status: 'verified' }],
    clinical_rules: [], red_flags: [], associations: [], lab_patterns: [],
  });
  assertEq(recs.KnowledgeTopic[0].verification_status, DRAFT_STATUS,
    'החילוץ הצליח לבקש סטטוס מאומת');
});

test('ציטוט המקור נשמר ב-review_note_he', () => {
  const recs = toKbRecords({ topics: [TOPIC], clinical_rules: [], red_flags: [], associations: [], lab_patterns: [] });
  assert(recs.KnowledgeTopic[0].review_note_he.includes('ציטוט מהמקור'));
});

test('פריט ללא ציטוט מסומן במפורש ולא נראה כמעוגן', () => {
  const recs = toKbRecords({
    topics: [{ ...TOPIC, source_quote_he: undefined }],
    clinical_rules: [], red_flags: [], associations: [], lab_patterns: [],
  });
  assert(recs.KnowledgeTopic[0].review_note_he.startsWith('⚠'), 'חוסר הציטוט לא הוצהר');
});

/* ═══════════════════════════════════════════════════════════════════════
 * תכנון
 * ═══════════════════════════════════════════════════════════════════════ */
section('תכנון — פונקציה טהורה, בלי רשת');

test('תכנון תקין מייצר אצווה שלמה', () => {
  const p = planIngestion({ extraction: extraction() });
  assertEq(p.ok, true, `נחסם ללא סיבה: ${JSON.stringify(p.blockers)}`);
  assertEq(p.createCount, 3);
  assertEq(p.toCreate.KnowledgeTopic.length, 1);
});

test('עוגן שאינו מצביע על נושא קיים חוסם את האצווה', () => {
  // ⚠ עוגן ריק נראה תקין בכל בדיקה עתידית, כי השדה מלא.
  const p = planIngestion({
    extraction: extraction({ clinical_rules: [{ ...RULE, source_anchor: 'nelson22.c99.nowhere' }] }),
  });
  assertEq(p.ok, false, 'עוגן תלוי לא נחסם');
  assertEq(p.danglingAnchors.length, 1);
  assert(p.blockers.some((b) => b.code === 'dangling_anchors'));
});

test('עוגן שמצביע על נושא שכבר ב-KB — תקין', () => {
  const p = planIngestion({
    extraction: extraction({ topics: [] }),
    existingTopicKeys: new Set(['nelson22.c85.septic_shock']),
  });
  assertEq(p.ok, true, `נחסם למרות שהעוגן קיים ב-KB: ${JSON.stringify(p.danglingAnchors)}`);
});

test('מפתח שכבר קיים ב-KB מדולג ואינו נכתב פעמיים', () => {
  const p = planIngestion({
    extraction: extraction(),
    existingKeys: new Set(['ClinicalRule:test.rule']),
    existingTopicKeys: new Set(['nelson22.c85.septic_shock']),
  });
  assertEq(p.createCount, 2, 'הכפילות נכתבה');
  assert(p.duplicates.some((d) => d.key === 'test.rule' && d.where === 'kb'));
});

test('מפתח כפול בתוך אותו קובץ נתפס', () => {
  const p = planIngestion({
    extraction: extraction({ clinical_rules: [RULE, { ...RULE, title_he: 'שכפול' }] }),
  });
  assert(p.duplicates.some((d) => d.where === 'batch'), 'כפילות פנימית עברה');
  assertEq(p.toCreate.ClinicalRule.length, 1);
});

test('היעדר הצהרת פערים מדווח כאזהרה', () => {
  const p = planIngestion({ extraction: extraction({ gaps_he: [] }) });
  assert(p.warnings.some((w) => w.code === 'no_gaps_declared'));
});

test('נושא ללא מספר עמוד מדווח כלא בר-אימות', () => {
  const p = planIngestion({
    extraction: extraction({ topics: [{ ...TOPIC, page_start: undefined }] }),
  });
  const w = p.warnings.find((x) => x.code === 'topics_without_pages');
  assert(w, 'חוסר עמוד לא דווח');
  assertEq(w.count, 1);
});

/* ═══════════════════════════════════════════════════════════════════════
 * ביצוע
 * ═══════════════════════════════════════════════════════════════════════ */
section('ביצוע — הרצה יבשה, כתיבה, וקריאה חוזרת');

function fakeStore() {
  const rows = { KnowledgeTopic: [], ClinicalRule: [], RedFlag: [], LabPattern: [], Association: [] };
  return {
    rows,
    deps: {
      createRecord: async (entity, rec) => { rows[entity].push({ ...rec }); },
      listRecords: async (entity) => rows[entity],
    },
  };
}

await testAsync('הרצה יבשה אינה כותבת דבר', async () => {
  const store = fakeStore();
  const plan = planIngestion({ extraction: extraction() });
  const r = await applyPlan({ plan, deps: store.deps, dryRun: true });
  assertEq(r.ran, false);
  assertEq(r.createdCount, 0);
  assertEq(store.rows.KnowledgeTopic.length, 0, 'נכתב למרות dry-run');
});

await testAsync('כתיבה מלאה + אימות בקריאה חוזרת', async () => {
  const store = fakeStore();
  const plan = planIngestion({ extraction: extraction() });
  const r = await applyPlan({ plan, deps: store.deps });
  assertEq(r.createdCount, 3);
  assertEq(r.mismatches.length, 0, JSON.stringify(r.mismatches));
  assertEq(r.ok, true);
  assertEq(store.rows.ClinicalRule[0].verification_status, DRAFT_STATUS);
});

await testAsync('אצווה חסומה אינה נכתבת גם כשלא ביקשו dry-run', async () => {
  const store = fakeStore();
  const plan = planIngestion({
    extraction: extraction({ clinical_rules: [{ ...RULE, source_anchor: 'nowhere' }] }),
  });
  const r = await applyPlan({ plan, deps: store.deps });
  assertEq(r.ran, false, 'אצווה חסומה נכתבה');
  assertEq(store.rows.KnowledgeTopic.length, 0);
});

await testAsync('שינוי שקט בין מה שנשלח למה שנשמר — נתפס', async () => {
  // ⚠ כתיבה שהחזירה הצלחה אינה הוכחה שהתוכן נשמר כפי שנשלח.
  const store = fakeStore();
  store.deps.createRecord = async (entity, rec) => {
    store.rows[entity].push(
      entity === 'ClinicalRule' ? { ...rec, conclusion_he: 'טקסט אחר לגמרי' } : { ...rec }
    );
  };
  const plan = planIngestion({ extraction: extraction() });
  const r = await applyPlan({ plan, deps: store.deps });
  assertEq(r.ok, false, 'שינוי שקט עבר כהצלחה');
  assert(r.mismatches.some((m) => m.field === 'conclusion_he'));
});

await testAsync('רשומה שנכתבה ולא נמצאה בקריאה חוזרת — נתפסת', async () => {
  const store = fakeStore();
  store.deps.createRecord = async (entity, rec) => {
    if (entity !== 'RedFlag') store.rows[entity].push({ ...rec });
  };
  const plan = planIngestion({ extraction: extraction() });
  const r = await applyPlan({ plan, deps: store.deps });
  assert(r.mismatches.some((m) => m.entity === 'RedFlag'), 'רשומה שנעלמה לא דווחה');
});

await testAsync('כשל כתיבה נספר ואינו מפיל את שאר האצווה', async () => {
  const store = fakeStore();
  store.deps.createRecord = async (entity, rec) => {
    if (entity === 'RedFlag') throw new Error('boom');
    store.rows[entity].push({ ...rec });
  };
  const plan = planIngestion({ extraction: extraction() });
  const r = await applyPlan({ plan, deps: store.deps });
  assertEq(r.failed.length, 1);
  assertEq(r.createdCount, 2, 'כשל אחד עצר את השאר');
  assertEq(r.ok, false);
});

await testAsync('נושאים נכתבים לפני מה שמפנה אליהם', async () => {
  const order = [];
  const store = fakeStore();
  const orig = store.deps.createRecord;
  store.deps.createRecord = async (entity, rec) => { order.push(entity); await orig(entity, rec); };
  const plan = planIngestion({ extraction: extraction() });
  await applyPlan({ plan, deps: store.deps, verify: false });
  assertEq(order[0], 'KnowledgeTopic', 'העוגן נכתב אחרי מה שמפנה אליו');
});

test('summarize מפיק סיכום קריא', () => {
  const p = planIngestion({ extraction: extraction() });
  const lines = summarize(p);
  assert(lines.some((l) => l.includes('נשמרים לאחר אימות: 3')), lines.join(' | '));
});

/* ════════════════════════════════════════════════════════════════════════
 * עוגן בר-אימות
 * ═══════════════════════════════════════════════════════════════════════ */
section('עוגן בר-אימות — נלסון 22 מול הספרון');

test('עוגן נלסון 22 אינו מתריע', () => {
  const p = planIngestion({ extraction: extraction() });
  const w = p.problems.filter((x) => x.kind === 'topic' && x.severity === 'warn');
  assertEq(w.length, 0, `עוגן תקין התריע: ${JSON.stringify(w)}`);
});

test('עוגן לספרון מתריע שאינו בר-אימות', () => {
  // זו הסיבה ש-877 רשומות נתקעו כטיוטה: אי אפשר לבדוק
  // מול מקור עוגן שאין בו פרק ולא עמוד.
  const p = planIngestion({
    extraction: extraction({
      topics: [{ ...TOPIC, topic_key: 'nelson.נוירולוגיה.שבץ' }],
      clinical_rules: [{ ...RULE, source_anchor: 'nelson.נוירולוגיה.שבץ' }],
      red_flags: [{ ...FLAG, source_anchor: 'nelson.נוירולוגיה.שבץ' }],
    }),
  });
  const w = p.problems.find((x) => x.kind === 'topic' && x.severity === 'warn');
  assert(w, 'עוגן לספרון לא התריע');
  assert(w.why_he.includes('verified'), 'האזהרה אינה מסבירה את המשמעות');
});

test('עוגן בפורמט זר מתריע', () => {
  const p = planIngestion({
    extraction: extraction({
      topics: [{ ...TOPIC, topic_key: 'random_key' }],
      clinical_rules: [{ ...RULE, source_anchor: 'random_key' }],
      red_flags: [{ ...FLAG, source_anchor: 'random_key' }],
    }),
  });
  assert(p.problems.some((x) => x.kind === 'topic' && x.severity === 'warn'));
});

console.log(`\n${'─'.repeat(60)}`);
console.log(`עברו: ${passed}  ·  נכשלו: ${failed}`);
if (failed) {
  console.log('\nכשלים:');
  for (const f of failures) console.log(`  · ${f.name}\n      ${f.error}`);
  process.exit(1);
}
console.log('כל הבדיקות עברו.');
