/**
 * MedScan — Grounded Radiology Interpretation
 *
 * לוקח את הפלט של `radiologyEngine` הקיים — לא משנה אותו, לא משכתב אותו —
 * מזרים את הממצאים שנצפו למנוע ה-Rules הדטרמיניסטי, ומפיק פרשנות מעוגנת
 * נפרדת שעוברת את כל שכבות האנטי-הזיה.
 *
 * הפלט הקיים נשאר כפי שהוא. זה נוסף לידו, לא במקומו.
 *
 * הלוגיקה הטהורה (חילוץ ממצאים, ההפרדה תפיסה/פרשנות) יושבת ב-
 * `observations.js` כדי שתהיה בת-בדיקה בלי האפליקציה. כאן רק ה-I/O.
 */

import { groundedInvoke } from '../gate/groundedInvoke.js';
import { runRulesEngine } from '../rules/rulesEngine.js';
import {
  extractObservations,
  toFindingStrings,
  toPatientFacts,
  extractIndeterminateZones,
} from './observations.js';
import {
  createInvokeLLM,
  loadKnowledgeBase,
  loadVerifiedDrugTerms,
  writeAudit,
} from '../llmAdapter.js';
import { retrieveEvidence } from '../evidence/evidenceGrounding.js';

export { extractObservations };

const ENGINE_PROMPT = `אתה מפרש **ממצאים רדיולוגיים שכבר נצפו** — אינך קורא תמונה.

הממצאים הוויזואליים מופיעים כפריטי P# ב-FACT BLOCK. הם התצפית של קורא
התמונה, ואתה מקבל אותם כנתון. אל תוסיף ממצא שאינו שם, ואל תפקפק בקריאה
הוויזואלית עצמה — אין לך גישה לתמונה.

תפקידך: לקשור בין הממצאים שנצפו לבין הידע הקליני המאומת (F#), ולהפיק
אבחנה מבדלת מעוגנת.

כללים ייחודיים למודול הזה:

1. **פרשנות ללא עוגן אינה מוצגת.** אם אין פריט ידע מאומת שמקשר בין
   הממצא לבין משמעות קלינית — אמור זאת במפורש ב-unknowns_he.
   "נצפה ממצא X ואין לי ידע מאומת לפרשנותו" היא תשובה טובה ומלאה.

2. **must_not_miss.** סמן true לכל אבחנה מסכנת-חיים שאסור לפספס, גם
   כשסבירותה נמוכה. היא תוצג בראש הרשימה גם אם ה-rank שלה נמוך.

3. **אל תמציא מדידות.** אם הממצא לא כלל גודל/צפיפות/מרווח — אין מספר.
   אל תעריך ואל תשלים. זה קריטי במיוחד למספרים שנשמעים מדויקים.

4. **discriminating_test_he** — לכל אבחנה: מה יכריע בינה לבין הבאה
   אחריה. זו השורה השימושית ביותר לרופא/ה בפועל.

5. **הקריאה הוויזואלית אינה ראיה מוחלטת.** איכות תמונה ירודה, פרויקציה
   חלקית או ארטיפקט מחלישים כל מסקנה שנשענת עליה — ציין זאת ב-refutes_he.

6. **אזור שלא ניתן היה להעריך אינו אזור תקין.** אם סופקו לך אזורים
   כאלה — הצהר עליהם ב-unknowns_he. פער שלא הוצהר נקרא ככיסוי מלא.

7. **ספרות (L#).** אם סופקו לך מאמרים — השתמש בהם דרך literature_support,
   וציין **במה המקרה שלפנינו שונה** מהמאמר (אוכלוסייה, גיל, הקשר).
   מאמר על מבוגרים אינו ראיה ישירה על ילד בן שנתיים.
   **אל תכתוב PMID או DOI בעצמך** — הפנה ל-L# והקוד ירחיב.
   מזהה שתכתוב מהזיכרון יחסום את הפלט כולו.`;

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
  withLiterature = true,
}) {
  // המנוע נמנע (תמונה לא רלוונטית/לא קריאה) — אין ממצאים, אין מה לפרש.
  if (!engineResult || engineResult.abstain) return null;

  const structured = engineResult.structured;
  const observations = extractObservations(structured);
  if (!observations.length) return null;

  const findings = toFindingStrings(observations);
  const patientData = toPatientFacts(observations, structured);
  const indeterminate = extractIndeterminateZones(structured);

  const invokeLLM = createInvokeLLM();   // ללא file_urls — אנחנו לא קוראים תמונה

  // שליפת הספרות רצה במקביל לטעינת ה-KB. כשל באחת מהן
  // אינו מפיל את השנייה — ואינו מפיל את הניתוח.
  const [kb, allowedTerms, evidence] = await Promise.all([
    loadKnowledgeBase(),
    loadVerifiedDrugTerms(),
    withLiterature
      ? retrieveEvidence({
          findings,
          patient,
          invokeLLM,
          extraContext: structured?.image_metadata ?? null,
        })
      : Promise.resolve({ literature: [], meta: { attempted: false, note_he: 'שליפת ספרות כובתה ע"י הקורא.' } }),
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
    invokeLLM,
    mode,
    knownTopicKeys: kb.knownTopicKeys,
    allowedTerms,
    literature: evidence.literature,
    extraContext: {
      ...(clinicalContext ? { clinical_context_he: clinicalContext } : {}),
      ...(indeterminate.length ? { zones_not_assessable_he: indeterminate } : {}),
    },
  });

  // אזורים שלא הוערכו — מוצהרים תמיד, גם אם המודל שכח.
  // "לא הוערך" שלא נאמר נקרא כמו "תקין".
  if (indeterminate.length) {
    const note = `אזורים שלא ניתן היה להעריך בתמונה ולכן לא נכללו בפרשנות: ${indeterminate.join(', ')}.`;
    if (!(envelope.unknowns_he ?? []).some((u) => u.includes(indeterminate[0]))) {
      envelope.unknowns_he = [...(envelope.unknowns_he ?? []), note];
    }
  }

  await writeAudit({ engine: 'radiology_grounded', envelope });

  return {
    ...envelope,
    // מוצג תמיד, גם בכשלון. שליפה שנכשלה בשקט היא הגרוע מכל:
    // הפלט ייראה מבוסס-ספרות בזמן שאין ספרות בכלל.
    evidence_meta: evidence.meta,
    observations,
    observation_note_he:
      'הממצאים למטה הם הקריאה הוויזואלית של המנוע. הם אינם מעוגנים ב-Knowledge Base ' +
      'ואינם מתיימרים להיות — זו תצפית. הפרשנות שמעליהם עברה אימות עיגון מלא.',
  };
}
