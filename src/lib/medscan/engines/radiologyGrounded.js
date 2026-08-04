/**
 * MedScan — Grounded Radiology Interpretation
 *
 * ## ההבדל המהותי בין Vision למעבדה
 *
 * במנועי מעבדה ה-grounding מגיע מה-KB. במודול Vision **הממצא עצמו מגיע
 * מהמודל** — הוא זה שקורא את התמונה. אי אפשר לעגן את הקריאה הוויזואלית
 * ב-Knowledge Base, ואין טעם לנסות.
 *
 * לכן ההפרדה כאן חדה, והיא הבסיס לכל המודול:
 *
 *   תפיסה (observations)   — מה נראה בתמונה. קריאת המודל. **לא מעוגנת ב-KB
 *                             ואינה מתיימרת להיות.** זו עדות, לא טענה.
 *   פרשנות (interpretation) — למה זה מרמז. **חייבת לעבור בדיוק את אותו
 *                             מסלול grounding כמו כל טענה קלינית אחרת.**
 *
 * מודל שאומר "אני רואה תסנין" — קריאה לגיטימית.
 * אותו מודל שאומר "זו דלקת ריאות חיידקית שדורשת אנטיביוטיקה" — זו הזיה,
 * אלא אם הפרשנות מעוגנת בידע מאומת.
 *
 * ## מה המודול הזה עושה
 * לוקח את הפלט של `radiologyEngine` הקיים (לא משנה אותו, לא משכתב אותו),
 * מזרים את הממצאים שנצפו למנוע ה-Rules הדטרמיניסטי, ומפיק פרשנות
 * מעוגנת נפרדת שעוברת את כל 11 שכבות האנטי-הזיה.
 *
 * הפלט הקיים נשאר כפי שהוא. זה נוסף לידו.
 */

import { groundedInvoke } from '../gate/groundedInvoke.js';
import { runRulesEngine } from '../rules/rulesEngine.js';
import {
  createInvokeLLM,
  loadKnowledgeBase,
  loadVerifiedDrugTerms,
  writeAudit,
} from '../llmAdapter.js';

/**
 * מחלץ ממצאים נצפים מהפלט המובנה של מנוע הרדיולוגיה.
 * אלה הופכים לקלט של מנוע ה-Rules — בדיוק כמו ממצא שהוזן ידנית.
 *
 * הערה: אנחנו מוציאים רק את **מה שנראה**, לא את הפרשנות של המודל.
 * `differential_diagnoses` ו-`primary_impression` נשארים בחוץ בכוונה —
 * הם מסקנות, וההזרמה שלהן פנימה תיצור לולאה שבה המודל מאשר את עצמו.
 */
export function extractObservations(structured) {
  const observations = [];

  for (const abn of structured?.key_abnormalities ?? []) {
    if (!abn?.finding) continue;
    observations.push({
      finding_he: abn.finding,
      location_he: abn.location ?? null,
      severity: abn.severity ?? null,
      characteristics_he: abn.characteristics ?? null,
      source: 'key_abnormality',
    });
  }

  for (const f of structured?.systematic_findings ?? []) {
    if (!f?.anatomical_zone) continue;
    const isAbnormal = /abnormal|חריג/i.test(f.status ?? '');
    if (!isAbnormal) continue;
    observations.push({
      finding_he: f.description || f.anatomical_zone,
      location_he: f.anatomical_zone,
      severity: null,
      characteristics_he: null,
      source: 'systematic_finding',
    });
  }

  // דגלים אדומים שהמודל דיווח — נכנסים כממצאים, לא כדגלי מערכת.
  // דגל מערכת מגיע רק ממנוע ה-RedFlag הדטרמיניסטי.
  for (const rf of structured?.critical_red_flags ?? []) {
    if (!rf) continue;
    observations.push({
      finding_he: rf,
      location_he: null,
      severity: 'reported_red_flag',
      characteristics_he: null,
      source: 'model_reported_flag',
    });
  }

  return observations;
}

/** ממצאים נצפים → מחרוזות עבור מנוע ה-Rules. */
function toFindingStrings(observations) {
  const out = new Set();
  for (const o of observations) {
    if (o.finding_he) out.add(o.finding_he);
    if (o.location_he) out.add(`${o.finding_he} ${o.location_he}`);
  }
  return [...out];
}

/**
 * ממצאים נצפים → פריטי P# עבור ה-FACT BLOCK.
 *
 * חשוב: הממצא הוויזואלי נכנס כ-P# (מדידה/תצפית) ולא כ-F# (ידע מאומת).
 * זה נכון עובדתית — זו תצפית על המטופל הזה, לא עובדה על העולם — וזה גם
 * מה שמונע מהמודל לצטט את הקריאה של עצמו כאילו הייתה מקור סמכות.
 */
function toPatientFacts(observations, structured) {
  const facts = observations.map((o, i) => ({
    key: `obs_${i + 1}`,
    label_he: `ממצא נצפה${o.location_he ? ` (${o.location_he})` : ''}`,
    value: [o.finding_he, o.characteristics_he].filter(Boolean).join(' — '),
    unit: null,
    flag: null,
  }));

  const md = structured?.image_metadata;
  if (md) {
    facts.push({
      key: 'modality',
      label_he: 'מודליות ואזור',
      value: `${md.modality_detected ?? '—'} / ${md.anatomical_region ?? '—'} (איכות: ${md.technical_quality ?? '—'})`,
      unit: null,
      flag: null,
    });
  }

  return facts;
}

const ENGINE_PROMPT = `אתה מפרש **ממצאים רדיולוגיים שכבר נצפו** — אינך קורא תמונה.

הממצאים הוויזואליים מופיעים כפריטי P# ב-FACT BLOCK. הם התצפית של קורא
התמונה, ואתה מקבל אותם כנתון. אל תוסיף ממצא שאינו שם ואל תפקפק בקריאה
הוויזואלית עצמה — אין לך גישה לתמונה.

תפקידך: לקשור בין הממצאים שנצפו לבין הידע הקליני המאומת (F#), ולהפיק
אבחנה מבדלת מעוגנת.

כללים ייחודיים למודול הזה:

1. **פרשנות ללא עוגן אינה מוצגת.** אם אין פריט ידע מאומת שמקשר בין
   הממצא לבין משמעות קלינית — אמור זאת במפורש ב-unknowns_he. "נצפה
   ממצא X ואין לי ידע מאומת לפרשנותו" היא תשובה טובה ומלאה.

2. **must_not_miss.** סמן true לכל אבחנה מסכנת-חיים שאסור לפספס, גם
   כשסבירותה נמוכה. היא תוצג בראש הרשימה גם אם ה-rank שלה נמוך.

3. **אל תמציא מדידות.** אם הממצא לא כלל גודל/צפיפות/מרווח — אין מספר.
   אל תעריך ואל תשלים. זה נכון במיוחד למספרים שנשמעים מדויקים.

4. **discriminating_test_he** — לכל אבחנה: מה יכריע בינה לבין הבאה
   אחריה. זו השורה הכי שימושית לרופא/ה בפועל.

5. **הקריאה הוויזואלית אינה ראיה מוחלטת.** איכות תמונה ירודה, פרויקציה
   חלקית או ארטיפקט מחלישים כל מסקנה שנשענת עליה — ציין זאת ב-refutes_he.`;

/**
 * מריץ את שכבת הפרשנות המעוגנת.
 *
 * @param {object} params
 * @param {object} params.engineResult  הפלט של runRadiologyEngine (לא משתנה)
 * @param {object} [params.patient]     {age_days, sex, weight_kg}
 * @param {string} [params.clinicalContext]
 * @param {string} [params.mode]        'clinical' | 'development'
 * @returns {Promise<object|null>} מעטפת מלאה, או null אם אין מה לפרש
 */
export async function runGroundedRadiologyInterpretation({
  engineResult,
  patient = {},
  clinicalContext = null,
  mode = 'clinical',
}) {
  // המנוע נמנע (תמונה לא רלוונטית/לא קריאה) — אין ממצאים, אין מה לפרש.
  if (!engineResult || engineResult.abstain) return null;

  const structured = engineResult.structured;
  const observations = extractObservations(structured);
  if (!observations.length) return null;

  const findings = toFindingStrings(observations);
  const patientData = toPatientFacts(observations, structured);

  const [kb, allowedTerms] = await Promise.all([
    loadKnowledgeBase(),
    loadVerifiedDrugTerms(),
  ]);

  // מנוע ה-Rules רץ על הממצאים הנצפים בדיוק כמו על ממצא שהוזן ידנית.
  // כך תסנין שנקרא בצילום יכול להפעיל דגל אדום מ-KB — דטרמיניסטית,
  // ולא דרך שיקול דעת של המודל.
  const grounding = runRulesEngine({
    kb: {
      redFlags: kb.redFlags,
      labPatterns: kb.labPatterns,
      rules: kb.rules,
      associations: kb.associations,
    },
    patient,
    labs: [],
    findings,
    mode,
  });

  const envelope = await groundedInvoke({
    engine: 'differential',
    enginePrompt: ENGINE_PROMPT,
    grounding,
    patientData,
    invokeLLM: createInvokeLLM(),   // ללא file_urls — אנחנו לא קוראים תמונה
    mode,
    knownTopicKeys: kb.knownTopicKeys,
    allowedTerms,
    extraContext: clinicalContext ? { clinical_context_he: clinicalContext } : null,
  });

  await writeAudit({ engine: 'radiology_grounded', envelope });

  return {
    ...envelope,
    observations,
    observation_note_he:
      'הממצאים למטה הם הקריאה הוויזואלית של המנוע. הם אינם מעוגנים ב-Knowledge Base ' +
      'ואינם מתיימרים להיות — זו תצפית. הפרשנות שמעליהם עברה אימות עיגון מלא.',
  };
}
