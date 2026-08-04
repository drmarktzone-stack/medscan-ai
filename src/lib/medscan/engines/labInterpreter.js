/**
 * MedScan — Lab Interpreter (P0)
 *
 * זיהוי דפוסים **רב-פרמטריים** — לא ערך בודד.
 * הדוגמה שהניעה את הפיצ'ר: לפידים גבוהים + אלבומין נמוך + פרוטאינוריה
 * → כיוון לתסמונת נפרוטית. אף אחד מהשלושה לבדו אינו אומר זאת.
 *
 * ## סדר הפעולות — קבוע ומחייב
 *   1. נרמול (קוד)       — טווחי גיל, סימון high/low
 *   2. Red Flags (קוד)   — לפני כל שיקול אבחוני
 *   3. התאמת דפוסים (קוד) — grounding אמיתי
 *   4. מחשבונים (קוד)    — כל מספר קריטי
 *   5. שליפת ספרות       — מקורות אמיתיים
 *   6. groundedInvoke    — 12 שכבות אנטי-הזיה
 *
 * ה-LLM נכנס אחרון ומקבל רק מה שכבר הותאם. הוא מנמק, לא מגלה.
 */

import { groundedInvoke } from '../gate/groundedInvoke.js';
import { runRulesEngine } from '../rules/rulesEngine.js';
import { normalizeLabs, toPatientFacts, toAgeDays } from '../deterministic/labNormalize.js';
import { loadReferenceRanges, getRegistryMeta } from '../deterministic/refRanges.js';
import { runCalculators } from '../deterministic/calculators.js';
import { retrieveEvidence } from '../evidence/evidenceGrounding.js';
import {
  createInvokeLLM,
  loadKnowledgeBase,
  loadVerifiedDrugTerms,
  loadReferenceRangePayload,
  writeAudit,
} from '../llmAdapter.js';

const ENGINE_PROMPT = `אתה מפרש **תוצאות מעבדה שכבר נורמלו** ודפוסים שכבר הותאמו.

הנתונים מגיעים כפריטי P# (ערכים מדודים), F# (ידע מאומת), D# (ערכים
מחושבים) ו-L# (ספרות שנשלפה). זה גבול הידע שלך.

תפקידך: לנמק את הקשר בין הדפוסים שהותאמו לבין כיוונים אבחוניים.

כללים ייחודיים למנוע הזה:

1. **דפוס, לא ערך בודד.** הערך של הכלי הוא בזיהוי צירופים. אל תדווח
   "CRP מוגבר" כמסקנה — דווח מה הצירוף מרמז, ולמה דווקא הצירוף.

2. **אל תמציא דפוס.** מותר לך להתייחס אך ורק לדפוסים שסופקו לך
   כמותאמים. דפוס שלא הותאם — לא קיים לצורך התשובה.

3. **מדד ללא טווח ייחוס אינו "תקין".** אם סופקו לך מדדים שלא נורמלו,
   הצהר עליהם ב-unknowns_he. הם לא השתתפו בניתוח, וזה חייב להיאמר —
   אחרת הפלט נקרא ככיסוי מלא.

4. **אל תחשב.** כל מספר קריטי (מינון, נוזלים, GFR, אחוזון) מגיע כ-D#.
   אין D# רלוונטי? אמור שהערך אינו זמין. אל תשלים אותו.

5. **"תקין" אינו ברירת מחדל.** אם קיים ולו דפוס חריג אחד — אל תסכם
   כתקין. בספק: צהוב + המלצת בירור.

6. **מה יכריע.** לכל כיוון — איזו בדיקה או ממצא יאשש או ישלול אותו
   בפועל. זו השורה השימושית ביותר לרופא/ה.

7. **ספרות (L#).** אם סופקו מאמרים — קשר אותם דרך literature_support
   וציין במה המקרה שונה מהם. **אל תכתוב PMID/DOI בעצמך.**`;

/**
 * מריץ את מנוע פענוח המעבדה.
 *
 * @param {object} params
 * @param {object} params.patient  {age_days|age_months|age_years|birth_date, sex, weight_kg, height_cm, chronic_conditions[], medications[]}
 * @param {object[]} params.labs   [{analyte, value, unit, ref_low?, ref_high?}]
 * @param {string[]} [params.findings] ממצאים קליניים נוספים
 * @param {string} [params.mode]
 * @param {boolean} [params.withLiterature]
 * @returns {Promise<object>} מעטפת מלאה + normalized + warnings
 */
export async function runLabInterpreter({
  patient = {},
  labs = [],
  findings = [],
  mode = 'clinical',
  withLiterature = true,
}) {
  const ageDays = toAgeDays(patient);
  const pt = { ...patient, age_days: ageDays };

  // ── טעינת טווחי ייחוס מהמעבדה ────────────────────────────────────────
  // בלי זה שום ערך לא יסומן — וזו התנהגות נכונה, לא תקלה.
  const rangePayload = await loadReferenceRangePayload();
  loadReferenceRanges(rangePayload);
  const rangeMeta = getRegistryMeta();

  // ── 1. נרמול (קוד בלבד) ──────────────────────────────────────────────
  const { normalized, missingRanges, warnings } = normalizeLabs({ labs, patient: pt });

  // גיל חסר חוסם — כמעט כל טווח ברפואת ילדים תלוי-גיל
  const blocking = warnings.filter((w) => w.severity === 'block');
  if (blocking.length) {
    return {
      status: 'input_error',
      blocking_warnings: blocking,
      warnings,
      normalized,
      message_he: blocking.map((b) => b.message_he).join(' '),
    };
  }

  const patientFacts = toPatientFacts(normalized);

  // ── 2–3. Red Flags → דפוסים → כללים → אסוציאציות (הכל בקוד) ──────────
  const kb = await loadKnowledgeBase();
  const grounding = runRulesEngine({
    kb: {
      redFlags: kb.redFlags,
      labPatterns: kb.labPatterns,
      rules: kb.rules,
      associations: kb.associations,
    },
    patient: pt,
    labs: normalized,
    findings,
    mode,
  });
  // הפער הזה נוסע עם ה-grounding כדי ש-coverageGuard יוכל לאכוף הצהרה עליו
  grounding.missingRanges = missingRanges;

  // ── 4. מחשבונים דטרמיניסטיים ─────────────────────────────────────────
  const calcRequests = [];
  if (Number.isFinite(Number(pt.weight_kg))) {
    calcRequests.push({ type: 'maintenance_fluids', params: { weight_kg: pt.weight_kg } });
  }
  if (Number.isFinite(Number(pt.weight_kg)) && Number.isFinite(Number(pt.height_cm))) {
    calcRequests.push({ type: 'bsa', params: { height_cm: pt.height_cm, weight_kg: pt.weight_kg } });
  }
  const creat = normalized.find((n) => /creatinin/i.test(n.analyte));
  if (creat && Number.isFinite(Number(pt.height_cm))) {
    // ללא מקדם k מהמעבדה המחשבון יסרב — והסירוב יוצג לרופא/ה כמידע.
    calcRequests.push({
      type: 'egfr',
      params: {
        height_cm: pt.height_cm,
        creatinine_mg_dl: creat.value,
        k_coefficient: rangePayload?.k_coefficient ?? null,
        k_source: rangePayload?.source ?? null,
      },
    });
  }
  const { deterministic, refusals } = runCalculators(calcRequests);

  // ── 5–6. ספרות + שער ─────────────────────────────────────────────────
  const invokeLLM = createInvokeLLM();

  const abnormalFindings = [
    ...findings,
    ...normalized.filter((n) => n.flag === 'high' || n.flag === 'low')
      .map((n) => `${n.label_he} ${n.flag === 'high' ? 'מוגבר' : 'נמוך'}`),
  ];

  const [allowedTerms, evidence] = await Promise.all([
    loadVerifiedDrugTerms(),
    withLiterature && abnormalFindings.length
      ? retrieveEvidence({ findings: abnormalFindings, patient: pt, invokeLLM })
      : Promise.resolve({ literature: [], meta: { attempted: false, note_he: 'לא בוצעה שליפת ספרות.' } }),
  ]);

  const envelope = await groundedInvoke({
    engine: 'lab_interpreter',
    enginePrompt: ENGINE_PROMPT,
    grounding,
    deterministic,
    patientData: patientFacts,
    literature: evidence.literature,
    invokeLLM,
    mode,
    knownTopicKeys: kb.knownTopicKeys,
    allowedTerms,
    extraContext: buildContextNote({ pt, missingRanges, refusals, rangeMeta }),
  });

  await writeAudit({ engine: 'lab_interpreter', envelope });

  return {
    ...envelope,
    normalized,
    warnings,
    missing_ranges: missingRanges,
    calculator_refusals: refusals,
    reference_range_meta: rangeMeta,
    evidence_meta: evidence.meta,
  };
}

/**
 * פערים והסתייגויות שנשלחים למודל כהקשר.
 * מוצהרים במפורש כדי שהמודל לא יתייחס אליהם כאילו נבדקו.
 */
function buildContextNote({ pt, missingRanges, refusals, rangeMeta }) {
  const note = {};
  if (missingRanges.length) note.analytes_without_reference_range = missingRanges;
  if (refusals.length) {
    note.calculators_refused = refusals.map((r) => ({ key: r.key, why_he: r.message_he }));
  }
  if (!rangeMeta.loaded || rangeMeta.verified_count === 0) {
    note.reference_ranges_status_he =
      'לא נטענו טווחי ייחוס מאומתים מהמעבדה. ערכים שלא סומנו אינם "תקינים" — הם לא נבדקו.';
  }
  const bg = [...(pt.chronic_conditions ?? []), ...(pt.medications ?? [])];
  if (bg.length) note.background_he = bg;
  return Object.keys(note).length ? note : null;
}
