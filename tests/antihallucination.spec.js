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
import { extractDermatologyFeatures } from '../src/lib/medscan/vision/dermatologyFeatures.js';
import { extractRadiologyFeatures } from '../src/lib/medscan/vision/radiologyFeatures.js';
import { ingestMedicalVisionReport } from '../src/lib/medscan/vision/medicalVisionApi.js';
import { preprocessAudio } from '../src/lib/medscan/audio/audioPreprocess.js';
import { extractEcgWaveformFeatures } from '../src/lib/medscan/signal/ecgWaveformFeatures.js';
import {
  parseLiteratureCitation,
  isApprovedLiteratureAnchor,
} from '../src/lib/medscan/knowledge/approvedLiterature.js';
import { toPatientFacts } from '../src/lib/medscan/deterministic/labNormalize.js';
import { runEegInterpreter, preprocessEeg } from '../src/lib/medscan/engines/eegInterpreter.js';
import { runMetabolicInterpreter } from '../src/lib/medscan/engines/metabolicInterpreter.js';
import { runGeneticsInterpreter } from '../src/lib/medscan/engines/geneticsInterpreter.js';
import { runCsfInterpreter } from '../src/lib/medscan/engines/csfInterpreter.js';
import { runPediatricUltrasound } from '../src/lib/medscan/engines/pediatricUltrasound.js';
import { runSyndromeMatcher } from '../src/lib/medscan/engines/syndromeMatcher.js';
import { runNeurodevelopmentalEngine } from '../src/lib/medscan/engines/neurodevelopmentalEngine.js';
import { runChronicSymptomsEngine } from '../src/lib/medscan/engines/chronicSymptomsEngine.js';

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

/* ═══════════════════════════════════════════════════════════════════════
 * אינטגרציה — Lab / Dermatology / Radiology / Audio / ECG / Nelson
 * ═══════════════════════════════════════════════════════════════════════ */
section('אינטגרציה — צינורות מדיה, מעבדה ועיגון נלסון/חוזר');

function makeRgba(w, h, pixel) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

test('Lab: דפוס מאומת נכנס ל-FactBlock עם פרק/סעיף נלסון והמלצת מעבדה ללא עוגן נחסמת', () => {
  const labs = [
    { analyte: 'CRP', flag: 'high', value: 140, unit: 'mg/L' },
    { analyte: 'WBC', flag: 'high', value: 22.4, unit: '10^9/L' },
  ];
  const r = runRulesEngine({
    kb: { labPatterns: [VERIFIED_PATTERN] },
    patient: { age_days: 1000 },
    labs,
    findings: [],
    mode: 'clinical',
  });
  assert(r.matchedPatterns.length >= 1, 'דפוס המעבדה המאומת לא הותאם');
  const fb = buildFactBlock({
    kbItems: r.kbItems,
    patientData: toPatientFacts(labs.map((l) => ({
      key: l.analyte, label_he: l.analyte, value: l.value, unit: l.unit, flag: l.flag,
    }))),
    mode: 'clinical',
  });
  const f1 = fb.facts.find((x) => x.kind === 'kb');
  assert(f1?.literature_citation?.chapter === 'test', 'פרק נלסון לא פוענח');
  assert(f1?.literature_citation?.section === 'inflammation', 'סעיף נלסון לא פוענח');
  assert(fb.text.includes('Nelson Textbook of Pediatrics'), 'FactBlock לא מציג את נלסון');

  const unanchoredTest = runAnchorGuards({
    output: goodOutput({
      recommended_tests: [{ test_he: 'משטח גרון', fact_refs: ['F1'] }],
    }),
    factBlock: fb,
  });
  assert(
    unanchoredTest.blocking.some((v) => v.code === 'missing_literature_anchor'),
    'המלצת מעבדה ללא עוגן נלסון/חוזר לא נחסמה',
  );

  const anchoredTest = runAnchorGuards({
    output: goodOutput({
      recommended_tests: [{
        test_he: 'משטח גרון',
        fact_refs: ['F1'],
        source_anchor: 'nelson.test.inflammation',
      }],
    }),
    factBlock: fb,
  });
  assertEq(anchoredTest.blocking.length, 0, 'המלצת מעבדה מעוגנת נחסמה בטעות');
});

test('Dermatology: חילוץ גבולות, צבע, פיזור ולוויינים מתמונת ImageData', () => {
  const img = makeRgba(80, 80, (x, y) => {
    const dx = x - 40;
    const dy = y - 40;
    if (dx * dx + dy * dy < 14 * 14) return [30, 20, 15];
    const sx = x - 62;
    const sy = y - 28;
    if (sx * sx + sy * sy < 4 * 4) return [25, 18, 12];
    return [220, 185, 160];
  });
  const feat = extractDermatologyFeatures(img);
  assert(feat.ok, `מדידת עור נכשלה: ${feat.reason}`);
  assert(feat.borders?.compactness != null, 'חסר compactness של גבול');
  assert(feat.color?.cluster_count >= 1, 'לא חולצו אשכולות צבע');
  assert(feat.distribution?.occupied_quadrants >= 1, 'לא חולץ פיזור');
  assert((feat.satellite_lesions?.count ?? 0) >= 1, 'נגע לווייני לא זוהה');
  assertEq(feat.diameter_mm, null, 'הומצא קוטר במ״מ בלי סולם');
});

test('Dermatology: תמונה לא-תקינה נכשלת סגור ולא ממציאה מאפיינים', () => {
  const feat = extractDermatologyFeatures({ width: 2, height: 2, data: new Uint8ClampedArray(16) });
  assertEq(feat.ok, false);
  assert(feat.reason, 'חסרה סיבת כישלון');
});

test('Radiology: מבנה גרמי, מרקם לוסנטי וצפיפויות יחסיות ללא HU/מ״מ', () => {
  const img = makeRgba(64, 64, (x, y) => {
    if (x >= 28 && x <= 36) return [230, 230, 230]; // עמוד שדרה בהיר
    if (x < 22 || x > 42) return [20, 20, 25]; // שדות ריאה כהים
    return [90, 90, 95];
  });
  const feat = extractRadiologyFeatures(img);
  assert(feat.ok, `מדידת רדיולוגיה נכשלה: ${feat.reason}`);
  assert(feat.bone_structure?.connected_components >= 1, 'מבנה גרמי לא זוהה');
  assert(feat.densities?.dense_like > 0, 'חסרה צפיפות יחסית');
  assert(feat.densities?.lucent_like > 0, 'חסר שבר לוסנטי');
  assertEq(feat.densities?.unit, 'relative_pixel_fraction');
  assert(feat.pulmonary_infiltrate_texture?.verification_status === 'draft_needs_verification');
  assertEq(feat.densities?.unit === 'HU', false, 'דווח unit=HU');
  assert(!('hu' in (feat.densities || {})), 'שדה hu מספרי הומצא');
});

test('Medical Vision API: ממצאים מוצלבים מול אבחנה מבדלת; דוח ריק נחסם', () => {
  const closed = ingestMedicalVisionReport(null);
  assertEq(closed.ok, false);

  const report = {
    modality: 'dermatology',
    findings: [{ label_he: 'נגע אנולרי עם קשקש היקפי', location: 'זרוע' }],
    features: { borders: { irregular: true }, color: { variegated: false }, satellite_lesions: { count: 1 } },
  };
  const ingested = ingestMedicalVisionReport(report, {
    differential: [
      {
        diagnosis: 'Tinea corporis annular scale',
        supporting_features: 'נגע אנולרי קשקש',
        source_anchors: ['nelson.test.inflammation'],
      },
      {
        diagnosis: 'Kawasaki disease',
        supporting_features: 'חום פריחה',
        source_anchors: ['nelson.id.kawasaki'],
      },
    ],
  });
  assert(ingested.ok, 'קליטת דוח Medical Vision נכשלה');
  assert(ingested.supported_diagnoses.some((d) => /Tinea/i.test(d)), 'הצלבה לא תמכה באבחנה התואמת');
  assert(ingested.differential_without_vision_support.some((d) => /Kawasaki/i.test(d)), 'אבחנה לא-נתמכת לא סומנה');
  assertEq(ingested.verification_status, 'draft_needs_verification');
});

test('Audio: פס wheeze/stridor מזוהה יחסית; אות קצר נכשל סגור', () => {
  const sr = 8000;
  const n = sr; // שנייה
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = Math.sin((2 * Math.PI * 400 * i) / sr);
  const out = preprocessAudio({ samples, sampleRate: sr });
  assert(out.ok, `עיבוד שמע נכשל: ${out.reason}`);
  assert(out.bands.wheeze.relative_energy > 0, 'אין אנרגיה בפס wheeze');
  assert(out.verification_status === 'draft_needs_verification');
  assert(out.note_he.includes('אינו מזהה'), 'חסרה הסתייגות אי-אבחנה');

  const tooShort = preprocessAudio({ samples: new Float32Array(10), sampleRate: sr });
  assertEq(tooShort.ok, false);
  const noRate = preprocessAudio({ samples });
  assertEq(noRate.ok, false);
});

test('ECG: QTc מחושב מנקודות ציון; ST/T ו-SVT הם סמני סריקה בלבד', () => {
  const fromFid = extractEcgWaveformFeatures({
    calibration: { small_box_px: 10, paper_speed_mm_s: 25, gain_mm_mv: 10 },
    fiducials: { p_onset_x: 0, qrs_onset_x: 40, qrs_offset_x: 65, t_offset_x: 150, rr_px: 200 },
    ageYears: 8,
  });
  assert(fromFid.ok, `חילוץ ECG נכשל: ${fromFid.reason}`);
  assertEq(fromFid.qtc.bazett, 492);
  assertEq(fromFid.qtc.prolonged_for_age, true);
  assertEq(fromFid.intervals.pr_ms, 160);

  const sr = 250;
  const samples = new Float32Array(sr * 3);
  const period = Math.round(sr * 0.4); // 150 bpm
  for (let i = 0; i < samples.length; i++) {
    const phase = i % period;
    samples[i] = phase < 6 ? 1 - Math.abs(phase - 3) / 3 : 0;
  }
  const wave = extractEcgWaveformFeatures({ samples, sampleRate: sr, ageYears: 14, regular: true, qrs_ms: 80 });
  assert(wave.ok, `חילוץ גל נכשל: ${wave.reason}`);
  assert(wave.svt_pattern.verification_status === 'draft_needs_verification');
  assert(wave.svt_pattern.tachycardia_for_age === true, 'טכיקרדיה לגיל לא סומנה');
  assert(wave.svt_pattern.flagged === true, 'תבנית SVT אפשרית לא סומנה כסריקה');
  assert(wave.st_t.ok === true || wave.st_t.reason, 'חסר פלט ST/T');

  const closed = extractEcgWaveformFeatures({});
  assertEq(closed.ok, false);
});

test('Nelson/MOH: FactBlock מציג פרק וסעיף; פלט לא-מעוגן נחסם', () => {
  const nelson = parseLiteratureCitation('nelson.test.inflammation');
  assertEq(nelson.corpus, 'nelson');
  assertEq(nelson.chapter, 'test');
  assertEq(nelson.section, 'inflammation');
  assert(isApprovedLiteratureAnchor('nelson.test.inflammation'));
  assertEq(isApprovedLiteratureAnchor('pubmed:123'), false);

  const moh = parseLiteratureCitation('needs_verification.moh.immunization.schedule');
  assertEq(moh.corpus, 'moh');
  assertEq(moh.chapter, 'immunization');
  assertEq(moh.section, 'schedule');
  assertEq(moh.draft, true);

  const fb = makeFactBlock();
  assert(fb.facts[0].literature_citation.display_he.includes('פרק test'));

  const pubmedOnly = runAnchorGuards({
    output: goodOutput({
      directions: [goodDirection({ source_anchors: ['pmid:12345'] })],
      claims: [{
        claim_id: 'K1', claim_type: 'FACT', text_he: 'דפוס דלקת',
        fact_refs: ['F1'], source_anchors: ['nelson.test.inflammation'],
      }],
    }),
    factBlock: fb,
  });
  assert(
    pubmedOnly.blocking.some((v) => v.code === 'unapproved_literature_corpus' || v.code === 'fabricated_anchor'),
    'עוגן PubMed-only לא נחסם',
  );

  const missing = runAnchorGuards({
    output: goodOutput({
      directions: [goodDirection({ source_anchors: [] })],
    }),
    factBlock: fb,
  });
  assert(
    missing.blocking.some((v) => v.code === 'missing_literature_anchor'),
    'כיוון ללא עוגן ספרות לא נחסם',
  );

  const incomplete = runAnchorGuards({
    output: goodOutput({
      directions: [goodDirection({ source_anchors: ['nelson.test'] })],
    }),
    factBlock: { ...fb, anchors: new Set([...fb.anchors, 'nelson.test']) },
  });
  assert(
    incomplete.blocking.some((v) => v.code === 'incomplete_literature_locator'),
    'עוגן בלי סעיף לא נחסם',
  );
});

section('EEG ילדים — תבניות פתולוגיות, דגלים אדומים ועיגון ILAE/AES/Nelson');

function eegSine(freqHz, seconds = 4, sr = 128) {
  const n = sr * seconds;
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = Math.sin((2 * Math.PI * freqHz * i) / sr);
  return { samples, sampleRate: sr };
}

function engineOutput(result) {
  return {
    directions: (result.differential ?? []).map((d) => ({
      direction_id: d.direction_id,
      diagnosis_direction_he: d.diagnosis_direction_he,
      source_anchors: d.source_anchors,
    })),
    recommended_tests: result.recommended_tests ?? [],
    claims: [],
    red_flags: result.red_flags ?? [],
  };
}

test('EEG: קלט ריק נכשל סגור', () => {
  const r = runEegInterpreter({});
  assertEq(r.ok, false);
  assert(r.reason === 'no_eeg_input');
});

test('EEG: Delta בילוד הוא תואם-גיל ולא מסומן כפתולוגיה אוטומטית', () => {
  const pre = preprocessEeg(eegSine(1.5), { ageDays: 7 });
  assert(pre.ok, pre.reason);
  assertEq(pre.dominant_band, 'delta');
  assertEq(pre.unexpected_slowing_for_age, false);
  const r = runEegInterpreter({
    patient: { age_days: 7 },
    signal: eegSine(1.5),
    mode: 'development',
  });
  assert(r.ok);
  assert(!r.matched_patterns.includes('eeg.focal_slowing'));
  assert(!r.emergency);
});

test('EEG: Hypsarrhythmia → דגל אדום למיון/טיפול נמרץ + FactBlock עם Nelson/ILAE/AES', () => {
  const r = runEegInterpreter({
    patient: { age_months: 6 },
    annotations: { hypsarrhythmia: true },
    findings: ['infantile spasms'],
    mode: 'development',
  });
  assert(r.ok);
  assert(r.matched_patterns.includes('eeg.hypsarrhythmia'));
  assert(r.emergency);
  assert(r.red_flags.some((f) => /מיון|טיפול נמרץ/.test(f.action_he)));
  assert(r.differential.some((d) => /West/i.test(d.diagnosis_direction_he)));
  assert(r.differential.some((d) => /מבני/.test(d.diagnosis_direction_he)));
  assert(r.recommended_tests.some((t) => /MRI/.test(t.test_he)));
  assert(r.factBlock.anchors.has('needs_verification.nelson.neurology.infantile_spasms'));
  assert(r.factBlock.anchors.has('needs_verification.ilae.syndrome.west'));
  assert(r.factBlock.anchors.has('needs_verification.aes.guideline.infantile_spasms'));
  assert(r.factBlock.text.includes('ILAE') || r.factBlock.text.includes('Nelson'));
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, `עוגן EEG נחסם: ${JSON.stringify(guard.blocking)}`);
});

test('EEG: Spike-and-Wave 3Hz → Absence ולא Status', () => {
  const r = runEegInterpreter({
    patient: { age_years: 7 },
    annotations: { spike_wave: { present: true, frequency_hz: 3 } },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('eeg.absence_3hz'));
  assert(!r.matched_patterns.includes('eeg.status_epilepticus'));
  assertEq(r.emergency, false);
});

test('EEG: Status Epilepticus (משך ≥5 דק) → התרעת חירום', () => {
  const r = runEegInterpreter({
    patient: { age_years: 4 },
    annotations: { seizure_duration_min: 12 },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('eeg.status_epilepticus'));
  assert(r.emergency);
  assert(r.red_flags.some((f) => f.flag_key === 'eeg.status_epilepticus'));
});

test('EEG: Burst-suppression / אנצפלופתיה → דגל אדום', () => {
  const r = runEegInterpreter({
    patient: { age_days: 10 },
    annotations: { burst_suppression: true, background: 'disorganized' },
    findings: ['encephalopathy'],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('eeg.burst_suppression') || r.matched_patterns.includes('eeg.encephalopathy'));
  assert(r.emergency);
});

test('EEG: ספייקים → אבחנה מבדלת שפירה מול נגע מבני; פלט לא-מעוגן נחסם', () => {
  const r = runEegInterpreter({
    patient: { age_years: 8 },
    annotations: { spikes: true },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('eeg.spikes'));
  assert(r.differential.some((d) => /שפירה|Rolandic/i.test(d.diagnosis_direction_he)));
  assert(r.differential.some((d) => /מבני/.test(d.diagnosis_direction_he)));
  const unanchored = runAnchorGuards({
    output: {
      directions: [{ direction_id: 'X', diagnosis_direction_he: 'אפילפסיה', source_anchors: [] }],
      claims: [],
    },
    factBlock: r.factBlock,
  });
  assert(unanchored.blocking.some((v) => v.code === 'missing_literature_anchor'));
});

test('EEG במצב clinical: טיוטה לא נכנסת כ-F# אך דגל החירום נשמר', () => {
  const r = runEegInterpreter({
    patient: { age_months: 6 },
    annotations: { hypsarrhythmia: true },
    mode: 'clinical',
  });
  assertEq(r.factBlock.facts.filter((f) => f.kind === 'kb').length, 0);
  assert(r.red_flags.length >= 1);
  assert(r.factBlock.facts.some((f) => f.kind === 'patient'));
});

section('מטבולי / סקר ילודים — IEM, OMIM/Orphanet/Nelson ודגלי משבר');

test('Metabolic: קלט ריק נכשל סגור', () => {
  const r = runMetabolicInterpreter({});
  assertEq(r.ok, false);
});

test('Metabolic: PHE גבוה בסקר → PKU מעוגן OMIM/Orphanet/Nelson, בלי משבר', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 5 },
    nbs: [{ marker: 'phenylalanine', flag: 'positive' }],
    amino_acids: [{ analyte: 'Phe', flag: 'high', value: null }],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('iem.pku'));
  assert(!r.matched_patterns.includes('iem.msud'));
  assert(r.factBlock.anchors.has('needs_verification.omim.261600.pku'));
  assert(r.factBlock.anchors.has('needs_verification.orphanet.716.pku'));
  assert(r.factBlock.anchors.has('needs_verification.nelson.metabolism.pku'));
  const ilae = parseLiteratureCitation('needs_verification.omim.261600.pku');
  assertEq(ilae.corpus, 'omim');
  assertEq(ilae.chapter, '261600');
  assertEq(ilae.section, 'pku');
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('Metabolic: ערך בלי דגל אינו מאבחן PKU', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 5 },
    amino_acids: [{ analyte: 'phenylalanine', value: 1200, unit: 'umol/L' }],
    mode: 'development',
  });
  assert(!r.matched_patterns.includes('iem.pku'), 'הומצא PKU מערך בלי דגל');
});

test('Metabolic: Leu+Ile גבוהים → MSUD', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 8 },
    amino_acids: [
      { analyte: 'leucine', flag: 'high' },
      { analyte: 'isoleucine', flag: 'high' },
    ],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('iem.msud'));
  assert(r.red_flags.some((f) => f.flag_key === 'iem.msud'));
});

test('Metabolic: C8 גבוה → MCAD', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 4 },
    nbs: [{ marker: 'C8', result: 'positive' }],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('iem.mcad'));
});

test('Metabolic: C3 + MMA + חמצת → Organic Acidemia', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 6 },
    nbs: [{ marker: 'C3', flag: 'high' }],
    organic_acids: [{ analyte: 'methylmalonic', flag: 'high' }],
    labs: [{ analyte: 'HCO3', flag: 'low', value: 8, unit: 'mmol/L' }],
    findings: ['חמצת מטבולית', 'anion gap מוגבר'],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('iem.organic_acidemia'));
  assert(r.red_flags.some((f) => f.flag_key === 'metabolic.anion_gap_acidosis'));
  assert(r.emergency);
});

test('Metabolic: היפראמונמיה + אפתיות בילוד → UCD ודגל PICU', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 3 },
    labs: [{ analyte: 'ammonia', flag: 'high' }],
    amino_acids: [{ analyte: 'glutamine', flag: 'high' }],
    findings: ['אפתיות'],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('iem.ucd'));
  assert(r.red_flags.some((f) => f.flag_key === 'metabolic.hyperammonemia'));
  assert(r.red_flags.some((f) => f.flag_key === 'metabolic.neonatal_lethargy'));
  assert(r.emergency);
  assert(r.red_flags.some((f) => /טיפול נמרץ/.test(f.action_he)));
});

test('Metabolic: היפוגליקמיה בילוד היא דגל אדום גם בלי דפוס IEM מלא', () => {
  const r = runMetabolicInterpreter({
    patient: { age_days: 2 },
    labs: [{ analyte: 'glucose', flag: 'low' }],
    mode: 'development',
  });
  assert(r.red_flags.some((f) => f.flag_key === 'metabolic.hypoglycemia'));
  assert(r.emergency);
});

test('AES/ILAE/OMIM הם עוגנים ספרותיים מעוצבים', () => {
  const aes = parseLiteratureCitation('needs_verification.aes.guideline.infantile_spasms');
  assertEq(aes.corpus, 'aes');
  assert(aes.display_he.includes('American Epilepsy Society'));
  const ilae = parseLiteratureCitation('ilae.se.status_epilepticus');
  assertEq(ilae.corpus, 'ilae');
  assertEq(isApprovedLiteratureAnchor('ilae.se.status_epilepticus'), true);
  assertEq(isApprovedLiteratureAnchor('needs_verification.ilae.se.status_epilepticus'), false);
});

section('גנטיקה / דיסמורפולוגיה — OMIM/Nelson, Karyotype/CMA/WES');

test('Genetics: קלט ריק נכשל סגור', () => {
  const r = runGeneticsInterpreter({});
  assertEq(r.ok, false);
  assertEq(r.reason, 'no_genetics_input');
});

test('Genetics: תווי דאון → Down + Karyotype, לא Turner; OMIM/Nelson ב-FactBlock', () => {
  const r = runGeneticsInterpreter({
    patient: { age_months: 4, sex: 'male' },
    features: ['epicanthal folds', 'single palmar crease', 'low-set ears'],
    mode: 'development',
  });
  assert(r.ok);
  assert(r.matched_patterns.includes('genetics.down'));
  assert(!r.matched_patterns.includes('genetics.turner'), 'Turner הוצע בזכר/פנוטיפ דאון');
  assert(r.recommended_tests.some((t) => /Karyotype|קריוטיפ/.test(t.test_he)));
  assert(!r.recommended_tests.some((t) => /WES/.test(t.test_he)), 'WES הוצע לדאון קלאסי');
  assert(r.factBlock.anchors.has('needs_verification.omim.190685.down_syndrome'));
  assert(r.factBlock.anchors.has('needs_verification.nelson.genetics.down_syndrome'));
  const omim = parseLiteratureCitation('needs_verification.omim.190685.down_syndrome');
  assertEq(omim.corpus, 'omim');
  assertEq(omim.chapter, '190685');
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('Genetics: Turner רק בנקבה/מין לא-ידוע, לא בזכר', () => {
  const female = runGeneticsInterpreter({
    patient: { sex: 'female', age_years: 8 },
    features: ['webbed neck', 'short stature', 'widely spaced nipples'],
    mode: 'development',
  });
  assert(female.matched_patterns.includes('genetics.turner'));
  assert(female.recommended_tests.some((t) => /Karyotype|קריוטיפ/.test(t.test_he)));

  const male = runGeneticsInterpreter({
    patient: { sex: 'male', age_years: 8 },
    features: ['webbed neck', 'short stature', 'widely spaced nipples'],
    mode: 'development',
  });
  assert(!male.matched_patterns.includes('genetics.turner'));
});

test('Genetics: תו אחד אינו מאבחן; וויליאמס לא מהתווים הכלליים', () => {
  const one = runGeneticsInterpreter({
    features: ['hypertelorism'],
    mode: 'development',
  });
  assertEq(one.matched_patterns.length, 0);

  const generic = runGeneticsInterpreter({
    features: ['low-set ears', 'hypertelorism', 'epicanthal folds', 'micrognathia', 'single palmar crease'],
    mode: 'development',
  });
  assert(!generic.matched_patterns.includes('genetics.williams'));
});

test('Genetics: 22q/Noonan → CMA; פלט לא-מעוגן נחסם', () => {
  const r = runGeneticsInterpreter({
    patient: { age_months: 2 },
    features: ['hypertelorism', 'micrognathia', 'cleft palate', 'conotruncal'],
    mode: 'development',
  });
  assert(r.matched_patterns.includes('genetics.del22q11'));
  assert(r.recommended_tests.some((t) => /CMA/.test(t.test_he)));
  assert(r.factBlock.anchors.has('needs_verification.omim.188400.digeorge'));
  const unanchored = runAnchorGuards({
    output: {
      directions: [{ direction_id: 'X', diagnosis_direction_he: 'תסמונת גנטית', source_anchors: [] }],
      claims: [],
    },
    factBlock: r.factBlock,
  });
  assert(unanchored.blocking.some((v) => v.code === 'missing_literature_anchor'));
});

section('CSF ילדים — טווחי גיל מה-seed, חיידקי/ויראלי/טראומטי');

test('CSF: קלט ריק נכשל סגור', () => {
  const r = runCsfInterpreter({});
  assertEq(r.ok, false);
  assertEq(r.reason, 'no_csf_input');
});

test('CSF: יילוד WBC 15 אינו דפוס חיידקי', () => {
  const r = runCsfInterpreter({
    patient: { age_days: 0 },
    csf: {
      wbc: 15, rbc: 1, protein: 90, glucose: 50,
      neutrophils_pct: 40, lymphocytes_pct: 60,
      gram_stain: 'no organisms',
    },
    blood: { glucose: 70 },
    mode: 'development',
  });
  assert(r.ok);
  assert(!r.matched_patterns.includes('csf.bacterial'));
  assertEq(r.emergency, false);
  assertEq(r.red_flags.length, 0);
});

test('CSF: ילד WBC 500 + PMN + יחס נמוך + גראם חיובי → חיידקי, דגל אמפירי בלי מינון', () => {
  const r = runCsfInterpreter({
    patient: { age_years: 4 },
    csf: {
      wbc: 500, rbc: 2, protein: 120, glucose: 20,
      neutrophils_pct: 85, lymphocytes_pct: 10,
      gram_stain: 'gram positive cocci',
    },
    blood: { glucose: 90 },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('csf.bacterial'));
  assert(r.emergency);
  assert(r.red_flags.some((f) => f.flag_key === 'csf.bacterial_meningitis'));
  assert(r.red_flags.some((f) => /אנטיביוטיקה אמפירית/.test(f.action_he)));
  const blob = JSON.stringify(r);
  assert(!/ceftriax|vanco|mg\/kg|מינוג/.test(blob.toLowerCase()), 'הוזכר מינון/שם תרופה');
  assert(r.factBlock.anchors.has('needs_verification.nelson.infectious_disease.bacterial_meningitis'));
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('CSF: תבנית לימפוציטית → ויראלי/אספטי, לא חיידקי', () => {
  const r = runCsfInterpreter({
    patient: { age_years: 6 },
    csf: {
      wbc: 80, rbc: 0, protein: 40, glucose: 55,
      neutrophils_pct: 10, lymphocytes_pct: 80,
      gram_stain: 'negative',
    },
    blood: { glucose: 80 },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('csf.viral_aseptic'));
  assert(!r.matched_patterns.includes('csf.bacterial'));
  assertEq(r.emergency, false);
});

test('CSF: RBC גבוה + תיקון WBC → Traumatic Tap, לא שולל דלקת בלי כימיה', () => {
  const r = runCsfInterpreter({
    patient: { age_years: 3 },
    csf: { wbc: 12, rbc: 10000, protein: 30, glucose: 60, gram_stain: 'no organisms' },
    blood: { glucose: 90, wbc: 8000, rbc: 5_000_000 },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('csf.traumatic_tap'));
  assert(!r.matched_patterns.includes('csf.bacterial'));
  assert(r.calculators.some((d) => d.key === 'csf_wbc_corrected'));
});

test('CSF: תינוק בן חודש — רצועת WBC 31–60 (סף 9), לא רצועת יילוד', () => {
  const neonateLike = runCsfInterpreter({
    patient: { age_days: 45 },
    csf: {
      wbc: 15, rbc: 0, protein: 50, glucose: 50,
      neutrophils_pct: 70, lymphocytes_pct: 20,
      gram_stain: 'no organisms',
    },
    blood: { glucose: 90 },
    mode: 'development',
  });
  // 15 > 9 לגיל 45 ימים, עם PMN + יחס תקין (~0.56? 50/90=0.556 low) — יחס נמוך
  assert(neonateLike.flags.wbc === 'high');
});

section('US ילדים — Graf DDH ו-IVH/PVL עם ACR/Nelson');

test('US: קלט ריק / חסר Alpha נכשל סגור', () => {
  const empty = runPediatricUltrasound({});
  assertEq(empty.ok, false);
  const noAlpha = runPediatricUltrasound({ hips: { beta_deg: 40 } });
  assertEq(noAlpha.ok, false);
  assertEq(noAlpha.reason, 'missing_alpha');
});

test('US: Graf Type I מול IIa לפי α וגיל', () => {
  const mature = runPediatricUltrasound({
    patient: { age_days: 60 },
    hips: { alpha_deg: 62, beta_deg: 50 },
    mode: 'development',
  });
  assert(mature.ok);
  assertEq(mature.graf[0].type, 'I');
  assertEq(mature.emergency, false);

  const iia = runPediatricUltrasound({
    patient: { age_days: 60 },
    hips: { alpha_deg: 54, beta_deg: 60 },
    mode: 'development',
  });
  assertEq(iia.graf[0].type, 'IIa');
  assert(iia.factBlock.anchors.has('needs_verification.acr.pediatric.ddh'));
  assert(iia.factBlock.anchors.has('needs_verification.nelson.orthopedics.developmental_dysplasia_hip'));
  const guard = runAnchorGuards({ output: engineOutput(iia), factBlock: iia.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('US: Graf Type IV (פריקה) ו-IIb לפי גיל ≥12 שבועות', () => {
  const iv = runPediatricUltrasound({
    patient: { age_days: 90 },
    hips: { dislocated: true, inverted_labrum: true },
    mode: 'development',
  });
  assertEq(iv.graf[0].type, 'IV');

  const iib = runPediatricUltrasound({
    patient: { age_days: 100 },
    hips: { alpha_deg: 54 },
    mode: 'development',
  });
  assertEq(iib.graf[0].type, 'IIb');
});

test('US: IVH דרגה 4 ו-PVL → Red flag נוירוכירורגי/נאונטולוגי', () => {
  const ivh = runPediatricUltrasound({
    patient: { age_days: 5 },
    cranial: { ivh_grade: 4 },
    mode: 'development',
  });
  assert(ivh.emergency);
  assert(ivh.red_flags.some((f) => f.flag_key === 'us.ivh_grade_3_4'));
  assert(ivh.red_flags.some((f) => /נוירוכירורגי|נאונטולוג/.test(f.action_he)));
  assert(ivh.factBlock.anchors.has('needs_verification.nelson.neonatology.ivh'));
  assert(ivh.factBlock.anchors.has('needs_verification.acr.pediatric.neurosonography'));

  const pvl = runPediatricUltrasound({
    patient: { age_days: 21 },
    cranial: { pvl: true },
    mode: 'development',
  });
  assert(pvl.red_flags.some((f) => f.flag_key === 'us.pvl'));
  const guard = runAnchorGuards({ output: engineOutput(ivh), factBlock: ivh.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('ACR הוא עוגן ספרותי מעוצב', () => {
  const acr = parseLiteratureCitation('needs_verification.acr.pediatric.ddh');
  assertEq(acr.corpus, 'acr');
  assertEq(acr.chapter, 'pediatric');
  assertEq(acr.section, 'ddh');
  assert(acr.display_he.includes('American College of Radiology'));
});

section('טריאדות / סינדרומים רב-ערוציים — Nelson');

test('Syndrome: קלט ריק נכשל סגור', () => {
  const r = runSyndromeMatcher({});
  assertEq(r.ok, false);
  assertEq(r.reason, 'no_syndrome_input');
});

test('Syndrome: Cushing triad מסימנים חיוניים + נשימה לא סדירה', () => {
  const r = runSyndromeMatcher({
    vitals: { hr_flag: 'low', bp_flag: 'high', irregular_respiration: true },
    mode: 'development',
  });
  assert(r.matched_patterns.includes('triad.cushing'));
  assert(r.emergency);
  assert(r.matched.some((p) => p.criteria_match_pct === 100));
  assert(r.factBlock.anchors.has('needs_verification.nelson.neurology.raised_icp'));
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test("Syndrome: Samter, Charcot, Reynolds", () => {
  const samter = runSyndromeMatcher({
    findings: ['asthma', 'aspirin sensitivity', 'nasal polyps'],
    mode: 'development',
  });
  assert(samter.matched_patterns.includes('triad.samter'));

  const charcot = runSyndromeMatcher({
    findings: ['RUQ pain', 'jaundice', 'fever'],
    mode: 'development',
  });
  assert(charcot.matched_patterns.includes('triad.charcot'));
  assert(!charcot.matched_patterns.includes('pentad.reynolds'));

  const reynolds = runSyndromeMatcher({
    findings: ['RUQ pain', 'jaundice', 'fever', 'hypotension', 'altered mental'],
    mode: 'development',
  });
  assert(reynolds.matched_patterns.includes('pentad.reynolds'));
  assert(reynolds.emergency);
});

test('Syndrome: HUS ממעבדה (labInterpreter.normalized) + HSP מעור + Toxo מדימות', () => {
  const hus = runSyndromeMatcher({
    labInterpreter: {
      normalized: [
        { analyte: 'hemoglobin', flag: 'low' },
        { analyte: 'LDH', flag: 'high' },
        { analyte: 'platelets', flag: 'low' },
        { analyte: 'creatinine', flag: 'high' },
      ],
    },
    findings: ['schistocytes'],
    mode: 'development',
  });
  assert(hus.matched_patterns.includes('triad.hus'));
  assert(hus.feature_channels.maha.includes('lab') || hus.features.includes('maha'));

  const hsp = runSyndromeMatcher({
    skin: { findings: ['palpable purpura'] },
    complaints: ['arthralgia', 'abdominal pain'],
    mode: 'development',
  });
  assert(hsp.matched_patterns.includes('triad.hsp'));
  assert(!hsp.matched_patterns.includes('triad.hus'));

  const toxo = runSyndromeMatcher({
    findings: ['chorioretinitis'],
    radiology: { findings: ['hydrocephalus', 'intracranial calcifications'] },
    mode: 'development',
  });
  assert(toxo.matched_patterns.includes('triad.congenital_toxoplasmosis'));
});

test('Syndrome: Kawasaki מלא (חום ≥5 + 4/5); פריחה כללית אינה משלימה', () => {
  const kd = runSyndromeMatcher({
    features: { fever_days: 6 },
    findings: [
      'bilateral conjunctivitis',
      'strawberry tongue',
      'cervical lymphadenopathy',
      'polymorphous rash',
    ],
    mode: 'development',
  });
  assert(kd.matched_patterns.includes('criteria.kawasaki'));
  assert(kd.factBlock.anchors.has('needs_verification.nelson.id.kawasaki'));

  const incomplete = runSyndromeMatcher({
    findings: ['fever', 'rash'],
    mode: 'development',
  });
  assert(!incomplete.matched_patterns.includes('criteria.kawasaki'));
});

test('Syndrome: rulesEngine במצב development מכניס טריאדה ל-kbItems; clinical לא', () => {
  const dev = runRulesEngine({
    findings: ['bradycardia', 'hypertension', 'irregular respiration'],
    mode: 'development',
  });
  assert(dev.matchedSyndromes.some((s) => s.pattern_key === 'triad.cushing'));
  assert(dev.kbItems.some((i) => i.pattern_key === 'triad.cushing'));

  const clin = runRulesEngine({
    findings: ['bradycardia', 'hypertension', 'irregular respiration'],
    mode: 'clinical',
  });
  assert(clin.matchedSyndromes.some((s) => s.pattern_key === 'triad.cushing'));
  assert(!clin.kbItems.some((i) => i.pattern_key === 'triad.cushing'));
});

section('נוירו-התפתחות — DSM-5-TR / M-CHAT / Vanderbilt');

test('Neurodev: קלט ריק נכשל סגור', () => {
  const r = runNeurodevelopmentalEngine({});
  assertEq(r.ok, false);
});

test('Neurodev: ASD — 3/3 תחום A + 2/4 תחום B + הפניה התפתחותית', () => {
  const r = runNeurodevelopmentalEngine({
    patient: { age_months: 24 },
    findings: [
      'no eye contact', 'social emotional reciprocity', 'peer relationships',
      'hand flapping', 'sensory hyperreactivity',
    ],
    mode: 'development',
  });
  assert(r.asd.screens_positive);
  assert(r.matched_patterns.includes('neurodev.asd_screen'));
  assert(r.recommended_tests.some((t) => /התפתחותי/.test(t.test_he)));
  assert(r.factBlock.anchors.has('needs_verification.dsm.neurodevelopmental.asd'));
  assert(r.factBlock.anchors.has('needs_verification.aap.autism.screening'));
  const guard = runAnchorGuards({ output: engineOutput(r), factBlock: r.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('Neurodev: M-CHAT-R 8 = סיכון גבוה; 2 = לא', () => {
  const high = runNeurodevelopmentalEngine({ mchat_total: 8, patient: { age_months: 20 }, mode: 'development' });
  assert(high.matched_patterns.includes('neurodev.mchat_high'));
  const low = runNeurodevelopmentalEngine({ mchat_total: 2, patient: { age_months: 20 }, mode: 'development' });
  assert(!low.matched_patterns.includes('neurodev.mchat_high'));
  assert(!low.asd.screens_positive);
});

test('Neurodev: ADHD — ≥6 חוסר קשב + שני הקשרים; הקשר יחיד לא מספיק', () => {
  const items = [
    'careless mistakes', 'sustained attention', 'does not listen',
    'follow through', 'easily distracted', 'forgetful',
  ];
  const pos = runNeurodevelopmentalEngine({
    patient: { age_years: 8 },
    findings: items,
    settings: ['home', 'school'],
    mode: 'development',
  });
  assert(pos.adhd.screens_positive);
  assert(pos.matched_patterns.includes('neurodev.adhd_screen'));
  assert(pos.recommended_tests.some((t) => /Vanderbilt|ראייה/.test(t.test_he)));
  assert(pos.factBlock.anchors.has('needs_verification.dsm.neurodevelopmental.adhd'));

  const oneSetting = runNeurodevelopmentalEngine({
    patient: { age_years: 8 },
    findings: items,
    settings: ['home'],
    mode: 'development',
  });
  assert(!oneSetting.adhd.screens_positive);
});

section('תלונות כרוניות — Rome IV ו-ICHD-3');

test('Chronic: קלט ריק נכשל סגור', () => {
  const r = runChronicSymptomsEngine({});
  assertEq(r.ok, false);
});

test('Chronic: Rome IV FAP מול דגלים אדומים (IBD/צליאק)', () => {
  const fap = runChronicSymptomsEngine({
    patient: { age_years: 10 },
    findings: ['abdominal pain'],
    duration_months: 3,
    mode: 'development',
  });
  assert(fap.rome.fap_direction);
  assert(fap.matched_patterns.includes('chronic.rome_fap'));
  assertEq(fap.emergency, false);

  const organic = runChronicSymptomsEngine({
    patient: { age_years: 12 },
    findings: ['abdominal pain', 'blood in stool', 'weight loss', 'nocturnal pain'],
    duration_months: 4,
    labs: [{ analyte: 'CRP', flag: 'high' }],
    mode: 'development',
  });
  assert(organic.rome.organic_pathway);
  assert(!organic.rome.fap_direction);
  assert(organic.red_flags.some((f) => f.flag_key === 'chronic.abdominal_red_flag'));
  assert(organic.recommended_tests.some((t) => /צליאק|tTG/.test(t.test_he)));
  assert(organic.recommended_tests.some((t) => /קלפרוטקטין|ESR/.test(t.test_he)));
  const guard = runAnchorGuards({ output: engineOutput(organic), factBlock: organic.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('Chronic: Rome IV IBS כשיש זיקה ליציאות ובלי דגלים', () => {
  const r = runChronicSymptomsEngine({
    findings: ['abdominal pain', 'related to defecation', 'change in frequency'],
    duration_months: 2,
    mode: 'development',
  });
  assert(r.rome.ibs_direction);
  assert(r.matched_patterns.includes('chronic.rome_ibs'));
});

test('Chronic: ICHD-3 מיגרנה מול דגל משני (הקאות בוקר)', () => {
  const mig = runChronicSymptomsEngine({
    findings: ['headache', 'pulsating', 'worse with activity', 'nausea'],
    attacks: 6,
    duration_hours: 4,
    mode: 'development',
  });
  assert(mig.ichd.migraine_direction);
  assert(mig.matched_patterns.includes('chronic.ichd_migraine'));
  assert(mig.factBlock.anchors.has('needs_verification.ichd.3.migraine'));

  const secondary = runChronicSymptomsEngine({
    findings: ['headache', 'morning vomiting', 'wakes from sleep', 'focal deficit'],
    attacks: 6,
    duration_hours: 4,
    mode: 'development',
  });
  assert(secondary.ichd.secondary_pathway);
  assert(!secondary.ichd.migraine_direction);
  assert(secondary.red_flags.some((f) => /נוירולוג|הקאות בוקר|מעיר/.test(f.action_he)));
  const guard = runAnchorGuards({ output: engineOutput(secondary), factBlock: secondary.factBlock });
  assertEq(guard.blocking.length, 0, JSON.stringify(guard.blocking));
});

test('DSM/AAP/ICHD/Rome הם עוגנים ספרותיים מעוצבים', () => {
  const dsm = parseLiteratureCitation('needs_verification.dsm.neurodevelopmental.asd');
  assertEq(dsm.corpus, 'dsm');
  const aap = parseLiteratureCitation('needs_verification.aap.adhd.guidelines');
  assertEq(aap.corpus, 'aap');
  const ichd = parseLiteratureCitation('ichd.3.migraine');
  assertEq(ichd.corpus, 'ichd');
  assertEq(isApprovedLiteratureAnchor('rome.iv.pediatric_fap'), true);
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
