/**
 * MedScan — Red-Team Test Suite לשכבת האנטי-הזיה
 *
 * כל בדיקה כאן מנסה **לשבור** את המערכת: להזריק מינון מומצא, לצטט מקור
 * שאינו קיים, להרגיע דגל אדום, לסתור מדידה. אם בדיקה נופלת — יש חור בטיחותי.
 *
 * ⚠ הבדיקות האלה הועברו מחבילת התכן, שם הן רצו מול מימוש הייחוס
 * ב-`engine/`. כאן הן רצות מול **הקוד הפרוס** ב-`src/lib/medscan/`.
 *
 * הרצה:  npm test
 */

import { buildFactBlock } from '../src/lib/medscan/antihallucination/factBlock.js';
import { numericGuard } from '../src/lib/medscan/antihallucination/numericGuard.js';
import { runValidators } from '../src/lib/medscan/antihallucination/validators.js';
import { detectContradictions } from '../src/lib/medscan/antihallucination/contradiction.js';
import { calibrateOutput } from '../src/lib/medscan/antihallucination/calibration.js';
import { groundedInvoke } from '../src/lib/medscan/gate/groundedInvoke.js';
import { OUTPUT_STATUS } from '../src/lib/medscan/antihallucination/envelope.js';
import { DISCLAIMER_HE } from '../src/lib/medscan/schemas/output.schemas.js';
import {
  maintenanceFluids, estimatedGFR, bodySurfaceArea, weightBasedDose,
} from '../src/lib/medscan/deterministic/calculators.js';
import { normalizeLabs } from '../src/lib/medscan/deterministic/labNormalize.js';
import { loadReferenceRanges, __resetRegistry } from '../src/lib/medscan/deterministic/refRanges.js';
import { runRulesEngine } from '../src/lib/medscan/rules/rulesEngine.js';
import { runAnchorGuards } from '../src/lib/medscan/antihallucination/anchorGuard.js';
import {
  getPediatricPathway,
  matchPediatricPathway,
} from '../src/lib/medscan/engines/pediatricPathways.js';

/* ── מיני-runner ─────────────────────────────────────────────────────── */
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
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'expected equality'}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
}
function section(title) { console.log(`\n${title}`); }

/* ── נתוני עזר ───────────────────────────────────────────────────────── */

const VERIFIED_PATTERN = {
  pattern_key: 'test.bacterial_inflammation',
  title_he: 'דפוס דלקת חיידקית',
  components: [
    { analyte: 'CRP', direction: 'high' },
    { analyte: 'WBC', direction: 'high' },
  ],
  min_components: 2,
  direction_he: 'כיוון לזיהום חיידקי',
  suspicion: 'yellow',
  clinical_reasoning_he: 'שילוב סמני דלקת מוגברים',
  source_anchor: 'nelson.test.inflammation',
  verification_status: 'verified',
};

const DRAFT_PATTERN = { ...VERIFIED_PATTERN, pattern_key: 'test.draft_pattern', verification_status: 'draft_needs_verification' };

const PATIENT_FACTS = [
  { key: 'CRP', label_he: 'CRP', value: 140, unit: 'mg/L', flag: 'high' },
  { key: 'WBC', label_he: 'WBC', value: 22.4, unit: '10^9/L', flag: 'high' },
];

function makeFactBlock(overrides = {}) {
  return buildFactBlock({
    kbItems: [VERIFIED_PATTERN],
    patientData: PATIENT_FACTS,
    mode: 'clinical',
    ...overrides,
  });
}

function goodDirection(over = {}) {
  return {
    direction_id: 'C1',
    diagnosis_direction_he: 'זיהום חיידקי — יש למקד מקור',
    confidence: { level: 'yellow', confidence_reason_he: 'סמני דלקת מוגברים בשילוב', evidence_strength: 'moderate' },
    reasoning_chain: [
      { step: 1, stage: 'findings', statement_he: 'CRP ו-WBC מוגברים', fact_refs: ['P1', 'P2'] },
      { step: 2, stage: 'links', statement_he: 'השילוב תואם דפוס דלקת חיידקית', fact_refs: ['F1'] },
      { step: 3, stage: 'candidate_conclusion', statement_he: 'כיוון לזיהום חיידקי', fact_refs: ['F1'] },
    ],
    supports_he: ['CRP מוגבר', 'WBC מוגבר'],
    refutes_he: ['סמני דלקת תקינים בבדיקה חוזרת'],
    fact_refs: ['F1', 'P1'],
    source_anchors: ['nelson.test.inflammation'],
    based_on_patterns: ['test.bacterial_inflammation'],
    ...over,
  };
}

function goodOutput(over = {}) {
  return {
    red_flags: [],
    claims: [
      { claim_id: 'K1', claim_type: 'FACT', text_he: 'דפוס דלקת חיידקית מוגדר כשילוב סמנים מוגברים',
        fact_refs: ['F1'], source_anchors: ['nelson.test.inflammation'] },
    ],
    contradictions: [],
    directions: [goodDirection()],
    unknowns_he: ['מקור הזיהום אינו ידוע מהנתונים שסופקו'],
    overall_suspicion: 'yellow',
    disclaimer_he: DISCLAIMER_HE,
    ...over,
  };
}

/** LLM מדומה שמחזיר פלט קבוע. */
function fakeLLM(mainOutput, selfCheckOutput = { verdicts: [], overall: 'pass' }) {
  const calls = [];
  const fn = async ({ purpose, prompt }) => {
    calls.push({ purpose, prompt });
    return purpose === 'self_check' ? selfCheckOutput : structuredClone(mainOutput);
  };
  fn.calls = calls;
  return fn;
}

/* ═══════════════════════════════════════════════════════════════════════
 * מנגנון 1 — Grounding
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנגנון 1 — Grounding חובה');

test('FACT BLOCK מספר עובדות, ערכים ומדידות בנפרד', () => {
  const fb = makeFactBlock();
  assert(fb.index.has('F1'), 'חסר F1');
  assert(fb.index.has('P1') && fb.index.has('P2'), 'חסרים פריטי מטופל');
  assert(fb.text.includes('=== FACT BLOCK ==='), 'חסרה כותרת');
  assert(fb.hasVerifiedClinicalContent, 'לא זוהה ידע מאומת');
});

test('ידע בסטטוס טיוטה אינו נכנס ל-FACT BLOCK במצב קליני', () => {
  const fb = buildFactBlock({ kbItems: [DRAFT_PATTERN], mode: 'clinical' });
  assertEq(fb.facts.filter((f) => f.kind === 'kb').length, 0, 'טיוטה חדרה להקשר הקליני');
  assertEq(fb.draftRejectedCount, 1, 'הטיוטה לא נספרה — ההכוונה לאימות תאבד');
  assertEq(fb.hasVerifiedClinicalContent, false);
});

test('במצב פיתוח הטיוטה נכנסת אך מסומנת בבירור', () => {
  const fb = buildFactBlock({ kbItems: [DRAFT_PATTERN], mode: 'development' });
  assertEq(fb.facts.filter((f) => f.kind === 'kb').length, 1);
  assertEq(fb.facts[0].is_draft, true);
  assert(fb.text.includes('טיוטה לא-מאומתת'), 'הטיוטה לא סומנה בטקסט');
});

test('פריט שסומן flagged אינו נכנס לעולם', () => {
  const fb = buildFactBlock({
    kbItems: [{ ...VERIFIED_PATTERN, verification_status: 'flagged' }],
    mode: 'development',
  });
  assertEq(fb.facts.length, 0, 'פריט flagged חדר ל-FACT BLOCK');
  assertEq(fb.rejected[0].why, 'flagged_by_reviewer');
});

test('הפניה למזהה שאינו קיים נחסמת', () => {
  const fb = makeFactBlock();
  const out = goodOutput({ directions: [goodDirection({ fact_refs: ['F1', 'F99'] })] });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'dangling_reference'), 'ציטוט F99 לא נחסם');
});

test('טענת FACT ללא עוגן נחסמת', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    claims: [{ claim_id: 'K1', claim_type: 'FACT', text_he: 'מחלה זו שכיחה מאוד', fact_refs: [] }],
  });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'fact_without_anchor'), 'FACT ללא עוגן עבר');
});

/* ═══════════════════════════════════════════════════════════════════════
 * numericGuard — המספרים
 * ═══════════════════════════════════════════════════════════════════════ */
section('numericGuard — אף מספר ללא מקור');

test('מינון מומצא במ"ג/ק"ג נחסם', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({
      diagnosis_direction_he: 'זיהום חיידקי — לשקול אמפירי 50 מ"ג/ק"ג ליום',
    })],
  });
  const res = numericGuard(out, fb);
  assert(!res.ok, 'המינון המומצא עבר');
  assertEq(res.blocked[0].number, '50');
  assertEq(res.blocked[0].severity, 'block');
});

test('מספר שמופיע בנתוני המטופל מותר', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({ supports_he: ['CRP 140 מוגבר', 'WBC 22.4'] })],
  });
  const res = numericGuard(out, fb);
  assertEq(res.blocked.length, 0, 'מספר מקורי נחסם בטעות');
});

test('ערך מחשבון דטרמיניסטי (D#) מותר', () => {
  const fluids = maintenanceFluids({ weight_kg: 17 });
  const fb = buildFactBlock({
    kbItems: [VERIFIED_PATTERN],
    deterministic: [fluids],
    patientData: PATIENT_FACTS,
  });
  const out = goodOutput({
    directions: [goodDirection({ supports_he: [`נוזלי אחזקה מחושבים: ${fluids.value} mL/24h`] })],
  });
  assertEq(numericGuard(out, fb).blocked.length, 0, 'ערך D# נחסם בטעות');
});

test('סף מומצא מסומן כאזהרה מוחמרת לפחות', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({ refutes_he: ['CRP מתחת ל-17 שולל את הכיוון'] })],
  });
  const res = numericGuard(out, fb);
  const v = res.violations.find((x) => x.number === '17');
  assert(v, 'הסף המומצא לא זוהה כלל');
  assert(v.severity === 'block' || v.severity === 'warn_high', `חומרה נמוכה מדי: ${v.severity}`);
});

test('מזהים טכניים אינם נספרים כמספרים', () => {
  const fb = makeFactBlock();
  const res = numericGuard(goodOutput(), fb);
  assert(!res.violations.some((v) => v.path.includes('fact_refs')), 'מזהי F#/P# נספרו בטעות');
});

/* ═══════════════════════════════════════════════════════════════════════
 * מנגנון 3 — שרשרת חשיבה
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנגנון 3 — שרשרת חשיבה כפויה');

test('שרשרת קצרה מ-3 שלבים נחסמת', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({
      reasoning_chain: [{ step: 1, stage: 'candidate_conclusion', statement_he: 'זיהום', fact_refs: ['F1'] }],
    })],
  });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'reasoning_chain_too_short'));
});

test('שרשרת ללא שלב "קשרים" נחסמת', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({
      reasoning_chain: [
        { step: 1, stage: 'findings', statement_he: 'א', fact_refs: ['P1'] },
        { step: 2, stage: 'findings', statement_he: 'ב', fact_refs: ['P2'] },
        { step: 3, stage: 'candidate_conclusion', statement_he: 'ג', fact_refs: ['F1'] },
      ],
    })],
  });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'reasoning_chain_missing_stage'));
});

test('שרשרת שאף שלב בה אינו מעוגן נחסמת', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({
      reasoning_chain: [
        { step: 1, stage: 'findings', statement_he: 'א', fact_refs: [] },
        { step: 2, stage: 'links', statement_he: 'ב', fact_refs: [] },
        { step: 3, stage: 'candidate_conclusion', statement_he: 'ג', fact_refs: [] },
      ],
    })],
  });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'reasoning_chain_unanchored'));
});

/* ═══════════════════════════════════════════════════════════════════════
 * מנגנון 4 — סתירות
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנגנון 4 — Contradiction Detection');

test('פלט שסותר מדידה בפועל נחסם', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({
      supports_he: ['CRP נמוך תומך בכיוון ויראלי'],
    })],
  });
  const { blocking } = detectContradictions({ output: out, factBlock: fb });
  assert(blocking.some((c) => c.kind === 'finding_vs_finding'), 'סתירה מול מדידה לא זוהתה');
});

test('כיוון שנשען על דפוס שלא הותאם נחסם', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({ based_on_patterns: ['pattern.that.never.matched'] })],
  });
  const { blocking } = detectContradictions({
    output: out, factBlock: fb, matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation' }],
  });
  assert(blocking.some((c) => c.kind === 'finding_vs_source'), 'דפוס מומצא לא נחסם');
});

test('דגל אדום עם חשד כללי שאינו אדום — נחסם ומתוקן', () => {
  const fb = makeFactBlock();
  const redFlags = [{ flag_key: 'rf.test', label_he: 'תינוק ≤28 יום עם חום', action_he: 'מסלול ספסיס', severity: 'critical' }];
  const out = goodOutput({ overall_suspicion: 'green', red_flags: [] });
  const { blocking } = detectContradictions({ output: out, factBlock: fb, redFlags });
  assert(blocking.some((c) => c.auto_fix?.field === 'overall_suspicion'), 'הרגעת דגל אדום לא נחסמה');
  assert(blocking.some((c) => c.auto_fix?.field === 'red_flags'), 'השמטת דגל לא נחסמה');
});

/* ═══════════════════════════════════════════════════════════════════════
 * מנגנון 2 — כיול ביטחון
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנגנון 2 — Confidence Calibration');

test('המודל אינו יכול לנפח ביטחון מעל התקרה', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({ confidence: { level: 'red', confidence_reason_he: 'בטוח לגמרי', evidence_strength: 'strong' } })],
  });
  const { output, adjustments } = calibrateOutput({
    output: out, factBlock: fb,
    matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }],
  });
  assertEq(output.directions[0].confidence.level, 'yellow', 'ביטחון מנופח לא כויל');
  assert(adjustments.length > 0, 'לא נרשם יומן כיול');
  assertEq(output.directions[0].confidence.proposed_by_model, 'red');
});

test('הכיול מוסבר בעברית ולא שקט', () => {
  const fb = makeFactBlock();
  const out = goodOutput({
    directions: [goodDirection({ confidence: { level: 'red', confidence_reason_he: 'x', evidence_strength: 'strong' } })],
  });
  const { output } = calibrateOutput({ output: out, factBlock: fb });
  const c = output.directions[0].confidence;
  assert(c.calibrated === true, 'לא סומן ככיול');
  assert(c.calibration_reasons_he.length > 0, 'אין סיבות כיול');
  assert(c.confidence_reason_he.includes('כויל'), 'ההסבר אינו מזכיר את הכיול');
});

test('דגל אדום מסלים את החשד הכללי גם אם המודל הרגיע', () => {
  const fb = makeFactBlock();
  const redFlags = [{ flag_key: 'rf.x', label_he: 'זיהום חיידקי מפושט', action_he: 'הערכה דחופה', severity: 'critical' }];
  const { output } = calibrateOutput({
    output: goodOutput({ overall_suspicion: 'green' }), factBlock: fb, redFlags,
  });
  assertEq(output.overall_suspicion, 'red', 'דגל אדום לא הסלים את החשד הכללי');
});

/* ═══════════════════════════════════════════════════════════════════════
 * גבול המנדט
 * ═══════════════════════════════════════════════════════════════════════ */
section('גבול המנדט — לעולם לא אבחנה סופית');

for (const [phrase, label] of [
  ['האבחנה היא דלקת ריאות חיידקית', 'אבחנה סופית'],
  ['הילד מאובחן עם מחלת קוואסאקי', 'ניסוח אבחנתי'],
  ['ללא ספק מדובר בזיהום ויראלי', 'ודאות שאינה נתמכת'],
  ['אין צורך בבירור נוסף', 'שלילת בירור'],
  ['ניתן לשחרר הביתה עם מעקב', 'החלטת דיספוזיציה'],
]) {
  test(`נחסם: "${phrase}" (${label})`, () => {
    const fb = makeFactBlock();
    const out = goodOutput({ uncertainty_note_he: phrase });
    const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
    assert(blocking.some((v) => v.code === 'out_of_mandate_phrasing'), 'הניסוח האסור עבר');
  });
}

test('כיוון ללא "מה ישלול אותו" נחסם', () => {
  const fb = makeFactBlock();
  const out = goodOutput({ directions: [goodDirection({ refutes_he: [] })] });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'direction_not_falsifiable'));
});

test('חשד אדום ללא ידע מאומת נחסם', () => {
  const fb = buildFactBlock({ kbItems: [DRAFT_PATTERN], patientData: PATIENT_FACTS, mode: 'development' });
  const out = goodOutput({
    directions: [goodDirection({ confidence: { level: 'red', confidence_reason_he: 'חשד גבוה', evidence_strength: 'strong' } })],
  });
  const { blocking } = runValidators({ output: out, factBlock: fb, disclaimer: DISCLAIMER_HE });
  assert(blocking.some((v) => v.code === 'red_on_unverified_knowledge'));
});

/* ═══════════════════════════════════════════════════════════════════════
 * מנגנון 6 — סירוב
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנגנון 6 — Refusal Protocol (צינור מלא)');

await testAsync('FACT BLOCK ריק → סירוב בלי לקרוא ל-LLM בכלל', async () => {
  const llm = fakeLLM(goodOutput());
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח', grounding: { kbItems: [] },
    patientData: PATIENT_FACTS, invokeLLM: llm,
  });
  assertEq(res.status, OUTPUT_STATUS.INSUFFICIENT);
  assertEq(llm.calls.length, 0, 'בוצעה קריאת LLM מיותרת');
  assert(res.message_he.includes('אין לי מידע מספיק'), 'הודעת הסירוב אינה תקנית');
  assert(res.what_would_help_he.length > 0, 'סירוב ללא הכוונה');
});

await testAsync('ידע טיוטה בלבד במצב קליני → סירוב', async () => {
  const llm = fakeLLM(goodOutput());
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [DRAFT_PATTERN] }, patientData: PATIENT_FACTS,
    invokeLLM: llm, mode: 'clinical',
  });
  assertEq(res.status, OUTPUT_STATUS.INSUFFICIENT);
  assert(res.audit.reason_codes.includes('no_verified_knowledge'));
  assertEq(llm.calls.length, 0);
});

await testAsync('גם בסירוב — דגלים אדומים עוברים', async () => {
  const redFlags = [{ flag_key: 'rf.neonate_fever', label_he: 'תינוק ≤28 יום עם חום', action_he: 'מסלול ספסיס מלא', severity: 'critical' }];
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [], redFlags }, invokeLLM: fakeLLM(goodOutput()),
  });
  assertEq(res.status, OUTPUT_STATUS.INSUFFICIENT);
  assertEq(res.red_flags.length, 1, 'דגל אדום אבד במסלול הסירוב');
  assertEq(res.overall_suspicion, 'red');
});

await testAsync('מינון מומצא בפלט → הצינור מסרב', async () => {
  const bad = goodOutput({
    directions: [goodDirection({ diagnosis_direction_he: 'זיהום — אמפירי 80 מ"ג/ק"ג' })],
  });
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [VERIFIED_PATTERN], matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }] },
    patientData: PATIENT_FACTS, invokeLLM: fakeLLM(bad),
  });
  assertEq(res.status, OUTPUT_STATUS.INSUFFICIENT);
  assert(res.audit.reason_codes.includes('unsourced_critical_numbers'));
});

await testAsync('מסלול תקין → פלט מלא/מוחלש עם audit', async () => {
  const llm = fakeLLM(goodOutput());
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [VERIFIED_PATTERN], matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }] },
    patientData: PATIENT_FACTS, invokeLLM: llm,
  });
  assert(res.status !== OUTPUT_STATUS.INSUFFICIENT, `סירוב לא צפוי: ${JSON.stringify(res.reasons_he)}`);
  assertEq(res.directions.length, 1);
  assert(res.audit.fact_block_size >= 3, 'audit חסר');
  assertEq(res.disclaimer_he, DISCLAIMER_HE);
  assertEq(llm.calls.length, 2, 'המאמת-הנגדי לא רץ');
});

await testAsync('מאמת-נגדי שפוסל טענה → הטענה מוסרת ומוצהרת', async () => {
  const llm = fakeLLM(goodOutput(), {
    verdicts: [{ claim_id: 'C1', verdict: 'unsupported', why_he: 'אין בסיס ב-FACT BLOCK' }],
    overall: 'fail',
  });
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [VERIFIED_PATTERN], matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }] },
    patientData: PATIENT_FACTS, invokeLLM: llm,
  });
  assertEq(res.status, OUTPUT_STATUS.INSUFFICIENT, 'כשל בבדיקה הנגדית לא הוביל לסירוב');
  assert(res.audit.reason_codes.includes('self_check_failed'));
});

await testAsync('כשל של המאמת עצמו מוריד למצב מוחלש, לא ל"עבר"', async () => {
  const llm = async ({ purpose }) => {
    if (purpose === 'self_check') throw new Error('network down');
    return goodOutput();
  };
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [VERIFIED_PATTERN], matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }] },
    patientData: PATIENT_FACTS, invokeLLM: llm,
  });
  assertEq(res.status, OUTPUT_STATUS.DEGRADED, 'כשל המאמת התקבל כהצלחה');
});

await testAsync('דגל שהמודל המציא מסומן ואינו עובר כדגל מערכת', async () => {
  const withFakeFlag = goodOutput({
    red_flags: [{ flag_key: 'invented', label_he: 'דגל שהמודל המציא', action_he: 'פעולה', severity: 'red' }],
  });
  const res = await groundedInvoke({
    engine: 'lab_interpreter', enginePrompt: 'נתח',
    grounding: { kbItems: [VERIFIED_PATTERN], matchedPatterns: [{ pattern_key: 'test.bacterial_inflammation', matched_ratio: 1 }] },
    patientData: PATIENT_FACTS, invokeLLM: fakeLLM(withFakeFlag),
  });
  const flag = (res.red_flags ?? []).find((f) => f.flag_key === 'invented');
  assert(flag?.unverified_model_flag === true, 'דגל מומצא לא סומן');
});

/* ═══════════════════════════════════════════════════════════════════════
 * מחשבונים דטרמיניסטיים
 * ═══════════════════════════════════════════════════════════════════════ */
section('מחשבונים דטרמיניסטיים');

test('Holliday-Segar: 17 ק"ג', () => {
  const r = maintenanceFluids({ weight_kg: 17 });
  assertEq(r.value, 1350, '10×100 + 7×50 = 1350');
  assertEq(r.per_hour, 56.3);
});

test('Holliday-Segar: 8 ק"ג ו-30 ק"ג', () => {
  assertEq(maintenanceFluids({ weight_kg: 8 }).value, 800);
  assertEq(maintenanceFluids({ weight_kg: 30 }).value, 1700); // 1000+500+200
});

test('Holliday-Segar מסרב בלי משקל', () => {
  assertEq(maintenanceFluids({}).ok, false);
});

test('BSA — Mosteller', () => {
  const r = bodySurfaceArea({ height_cm: 100, weight_kg: 16 });
  assertEq(r.value, 0.67); // √(1600/3600)=0.6667
});

test('eGFR מסרב ללא מקדם k מהמעבדה', () => {
  const r = estimatedGFR({ height_cm: 100, creatinine_mg_dl: 0.5 });
  assertEq(r.ok, false, 'חושב eGFR בלי מקדם מאומת');
  assertEq(r.missing, 'k_coefficient');
});

test('eGFR מחשב כשסופק מקדם', () => {
  const r = estimatedGFR({ height_cm: 100, creatinine_mg_dl: 0.5, k_coefficient: 0.413, k_source: 'מעבדה X' });
  assertEq(r.value, 82.6);
  assert(r.formula_source.includes('0.413'));
});

test('מינון מסרב ללא רשומה מאומתת', () => {
  assertEq(weightBasedDose({ weight_kg: 17 }).ok, false, 'חושב מינון בלי רשומה');
  const draft = weightBasedDose({
    weight_kg: 17,
    doseRecord: { drug_key: 'x', mg_per_kg_per_dose: 10, verification_status: 'draft_needs_verification' },
  });
  assertEq(draft.ok, false, 'חושב מינון מרשומת טיוטה');
});

test('מינון מחושב מרשומה מאומתת ומכבד תקרה', () => {
  const rec = {
    drug_key: 'test_drug', drug_name_he: 'תרופת בדיקה',
    mg_per_kg_per_dose: 10, doses_per_day: 3, max_mg_per_dose: 120,
    source: 'פרוטוקול מחלקתי', verification_status: 'verified',
  };
  const light = weightBasedDose({ weight_kg: 10, doseRecord: rec });
  assertEq(light.value, 100);
  assertEq(light.per_day_mg, 300);

  const heavy = weightBasedDose({ weight_kg: 50, doseRecord: rec });
  assertEq(heavy.value, 120, 'התקרה לא נאכפה');
  assertEq(heavy.capped_by, 'max_per_dose');
  assertEq(heavy.uncapped_per_dose_mg, 500);
});

test('מינון מסרב מתחת לגיל המינימלי שברשומה', () => {
  const r = weightBasedDose({
    weight_kg: 4, age_days: 10,
    doseRecord: { drug_key: 'x', mg_per_kg_per_dose: 10, min_age_days: 60, verification_status: 'verified' },
  });
  assertEq(r.ok, false, 'חושב מינון מתחת לגיל המותר');
});

/* ═══════════════════════════════════════════════════════════════════════
 * נרמול מעבדה
 * ═══════════════════════════════════════════════════════════════════════ */
section('נרמול מעבדה — "לא יודע" ≠ "תקין"');

test('ללא טווח ייחוס — הערך מסומן unknown_range ולא normal', () => {
  __resetRegistry();
  const { normalized, missingRanges } = normalizeLabs({
    labs: [{ analyte: 'CRP', value: 140, unit: 'mg/L' }],
    patient: { age_days: 1460 },
  });
  assertEq(normalized[0].flag, 'unknown_range', 'ערך ללא טווח סומן בטעות');
  assert(missingRanges.includes('CRP'));
});

test('טווח שהוזן ידנית מגיליון המעבדה גובר ומסמן', () => {
  __resetRegistry();
  const { normalized } = normalizeLabs({
    labs: [{ analyte: 'CRP', value: 140, unit: 'mg/L', ref_high: 5 }],
    patient: { age_days: 1460 },
  });
  assertEq(normalized[0].flag, 'high');
  assertEq(normalized[0].range_status, 'manual_range');
});

test('טווח מאומת שנטען מסמן לפי גיל', () => {
  __resetRegistry();
  loadReferenceRanges({
    source: 'מעבדת בדיקה',
    analytes: [{
      analyte: 'CRP', label_he: 'CRP', unit: 'mg/L',
      bands: [{ age_min_days: 0, age_max_days: 36500, low: null, high: 5 }],
      verification_status: 'verified',
    }],
  });
  const { normalized } = normalizeLabs({
    labs: [{ analyte: 'CRP', value: 3, unit: 'mg/L' }],
    patient: { age_days: 1460 },
  });
  assertEq(normalized[0].flag, 'normal');
  __resetRegistry();
});

test('חוסר גיל חוסם נרמול ומדווח', () => {
  __resetRegistry();
  const { warnings } = normalizeLabs({ labs: [{ analyte: 'CRP', value: 140 }], patient: {} });
  assert(warnings.some((w) => w.code === 'missing_age' && w.severity === 'block'));
});

/* ═══════════════════════════════════════════════════════════════════════
 * מנוע Rules
 * ═══════════════════════════════════════════════════════════════════════ */
section('מנוע Rules דטרמיניסטי');

test('דפוס מותאם רק כשמספיק רכיבים מתקיימים', () => {
  const labs = [
    { analyte: 'CRP', value: 140, flag: 'high' },
    { analyte: 'WBC', value: 22, flag: 'high' },
  ];
  const r = runRulesEngine({ kb: { labPatterns: [VERIFIED_PATTERN] }, patient: { age_days: 1460 }, labs });
  assertEq(r.matchedPatterns.length, 1);
  assertEq(r.matchedPatterns[0].matched_ratio, 1);
});

test('מדד ללא טווח (unknown_range) אינו תומך בדפוס', () => {
  const labs = [
    { analyte: 'CRP', value: 140, flag: 'unknown_range' },
    { analyte: 'WBC', value: 22, flag: 'high' },
  ];
  const r = runRulesEngine({ kb: { labPatterns: [VERIFIED_PATTERN] }, patient: { age_days: 1460 }, labs });
  assertEq(r.matchedPatterns.length, 0, 'דפוס הופעל על סמך מדד לא-מנורמל');
  assertEq(r.partialPatterns.length, 1);
});

test('דפוס טיוטה אינו נכנס ל-grounding קליני', () => {
  const labs = [{ analyte: 'CRP', flag: 'high' }, { analyte: 'WBC', flag: 'high' }];
  const r = runRulesEngine({ kb: { labPatterns: [DRAFT_PATTERN] }, patient: { age_days: 1460 }, labs, mode: 'clinical' });
  assertEq(r.matchedPatterns.length, 0);
});

test('דגל אדום נורה לפי חלון גיל', () => {
  const rf = {
    flag_key: 'rf.neonate_fever', label_he: 'תינוק ≤28 יום עם חום',
    trigger: { findings: ['חום'], logic: 'all' },
    age_min_days: 0, age_max_days: 28, severity: 'critical',
    action_he: 'מסלול ספסיס מלא', source_anchor: 'nelson.id.fws',
    verification_status: 'verified',
  };
  const hit = runRulesEngine({ kb: { redFlags: [rf] }, patient: { age_days: 14 }, findings: ['חום'] });
  assertEq(hit.redFlags.length, 1, 'דגל לא נורה לתינוק בן 14 יום');

  const miss = runRulesEngine({ kb: { redFlags: [rf] }, patient: { age_days: 400 }, findings: ['חום'] });
  assertEq(miss.redFlags.length, 0, 'דגל נורה מחוץ לחלון הגיל');
});

test('דגל תלוי-גיל ללא גיל ידוע מדווח ואינו נבלע', () => {
  const rf = {
    flag_key: 'rf.x', label_he: 'דגל', trigger: { findings: ['חום'] },
    age_max_days: 28, severity: 'red', action_he: 'פעולה',
    source_anchor: 'a', verification_status: 'verified',
  };
  const r = runRulesEngine({ kb: { redFlags: [rf] }, patient: {}, findings: ['חום'] });
  assertEq(r.redFlags.length, 0);
  assertEq(r.redFlagsSkipped[0].why, 'unknown_age');
});

test('כלל שכמעט התקיים נשמר כמידע קליני', () => {
  const rule = {
    rule_key: 'r.kawasaki_like', title_he: 'קריטריונים', conclusion_he: 'כיוון',
    suspicion: 'red', source_anchor: 'a', verification_status: 'verified',
    logic: 'all',
    conditions: [
      { type: 'finding', key: 'חום', op: 'present' },
      { type: 'finding', key: 'פריחה', op: 'present' },
      { type: 'finding', key: 'לימפאדנופתיה', op: 'present' },
    ],
  };
  const r = runRulesEngine({ kb: { rules: [rule] }, patient: { age_days: 1000 }, findings: ['חום', 'פריחה'] });
  assertEq(r.firedRules.length, 0);
  assertEq(r.nearMissRules.length, 1);
  assertEq(r.nearMissRules[0].matched_count, 2);
});

section('Pediatric Pathways — חיבור ל-rulesEngine / FactBlock / AnchorGuard');

test('מסלול טיוטה מותאם ב-clinical אך אינו נכנס ל-kbItems', () => {
  const r = runRulesEngine({
    kb: {},
    patient: { age_days: 2191 },
    findings: ['חשד ל-ADHD'],
    mode: 'clinical',
  });
  assertEq(r.matchedPathway?.pathway_key, 'community.adhd.workup');
  assertEq(r.activePathwayStep?.step_id, 'adhd.intake');
  assertEq(
    r.kbItems.filter((i) => i.pathway_key).length,
    0,
    'מסלול טיוטה חדר ל-kbItems במצב קליני',
  );
});

test('מסלול טיוטה ב-clinical נחסם גם ב-FactBlock אם הוזרק ידנית', () => {
  const r = matchPediatricPathway({ query: 'ADHD', age_days: 2191 });
  const item = {
    ...r.matched,
    title_he: r.matched.title_he,
    conclusion_he: 'שלב',
    verification_status: 'draft_needs_verification',
  };
  const fb = buildFactBlock({ kbItems: [item], mode: 'clinical' });
  assertEq(fb.facts.filter((f) => f.kind === 'kb').length, 0, 'טיוטת מסלול חדרה ל-FACT BLOCK');
  assert(fb.draftRejectedCount >= 1, 'הטיוטה לא נספרה');
});

test('מסלול מאומת נכנס ל-FACT BLOCK במצב קליני ונשמר העוגן', () => {
  const verified = {
    ...getPediatricPathway('community.adhd.workup'),
    verification_status: 'verified',
  };
  const r = runRulesEngine({
    kb: { pathways: [verified] },
    patient: { age_days: 2191 },
    findings: ['ADHD'],
    mode: 'clinical',
  });
  const pathwayItems = r.kbItems.filter((i) => i.pathway_key === 'community.adhd.workup');
  assertEq(pathwayItems.length, 1, 'מסלול מאומת לא נכנס ל-kbItems');
  const fb = buildFactBlock({ kbItems: r.kbItems, mode: 'clinical' });
  assert(fb.hasVerifiedClinicalContent, 'FactBlock לא זיהה ידע מאומת מהמסלול');
  assert(fb.anchors.has(verified.source_anchor), 'עוגן המסלול לא נרשם');
  const f = fb.facts.find((x) => x.kind === 'kb');
  assertEq(f?.is_draft, false);
  assertEq(f?.entity_key, 'community.adhd.workup');
});

test('במצב development טיוטת מסלול נכנסת ל-FACT BLOCK ומסומנת', () => {
  const r = runRulesEngine({
    kb: {},
    patient: { age_days: 2191 },
    findings: ['ADHD'],
    mode: 'development',
  });
  assert(r.kbItems.some((i) => i.pathway_key === 'community.adhd.workup'));
  const fb = buildFactBlock({ kbItems: r.kbItems, mode: 'development' });
  const f = fb.facts.find((x) => x.kind === 'kb');
  assertEq(f?.is_draft, true);
  assert(fb.text.includes('טיוטה לא-מאומתת'), 'הטיוטה לא סומנה בטקסט');
});

test('AnchorGuard חוסם עוגן מסלול מומצא ומתיר עוגן שהגיע מ-FactBlock', () => {
  const verified = {
    ...getPediatricPathway('community.immunization.routine'),
    verification_status: 'verified',
  };
  const r = runRulesEngine({
    kb: { pathways: [verified] },
    patient: { age_days: 400 },
    findings: ['חיסוני שגרה'],
    mode: 'clinical',
  });
  const fb = buildFactBlock({ kbItems: r.kbItems, mode: 'clinical' });
  const fabricated = runAnchorGuards({
    output: { claims: [{ claim_id: 'C1', source_anchors: ['nelson.fake.schedule'] }] },
    factBlock: fb,
  });
  assert(fabricated.blocking.some((v) => v.code === 'fabricated_anchor'), 'עוגן מומצא לא נחסם');

  const legit = runAnchorGuards({
    output: { claims: [{ claim_id: 'C1', source_anchors: [verified.source_anchor] }] },
    factBlock: fb,
  });
  assertEq(legit.blocking.length, 0, 'עוגן המסלול המאומת נחסם בטעות');
});

test('דפוס טיוטה עדיין נחסם כשמסלול רץ במקביל', () => {
  const labs = [{ analyte: 'CRP', flag: 'high' }, { analyte: 'WBC', flag: 'high' }];
  const r = runRulesEngine({
    kb: { labPatterns: [DRAFT_PATTERN] },
    patient: { age_days: 2191 },
    labs,
    findings: ['ADHD'],
    mode: 'clinical',
  });
  assertEq(r.matchedPatterns.length, 0, 'דפוס טיוטה חדר כשמסלול היה ברקע');
  assertEq(r.kbItems.length, 0, 'kbItems אינו ריק במצב קליני עם טיוטות בלבד');
});

/* ── סיכום ────────────────────────────────────────────────────────────── */
console.log(`\n${'─'.repeat(60)}`);
console.log(`עברו: ${passed}  ·  נכשלו: ${failed}`);
if (failed) {
  console.log('\nכשלים:');
  for (const f of failures) console.log(`  · ${f.name}\n      ${f.error}`);
  process.exit(1);
}
console.log('כל הבדיקות עברו.');
