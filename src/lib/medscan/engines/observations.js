/**
 * MedScan — Vision Observation Extraction (לוגיקה טהורה)
 *
 * מופרד בכוונה מ-`radiologyGrounded.js`: כאן אין I/O, אין תלות ב-Base44
 * ואין alias של Vite. לכן הלוגיקה הזו ניתנת לבדיקה ב-node בלי האפליקציה
 * כולה — וזה מה שמאפשר לבדוק בפועל את ההפרדה בין תפיסה לפרשנות,
 * שהיא הנקודה הרגישה ביותר במודולי Vision.
 *
 * ## ההפרדה
 *
 *   תפיסה (observations)   — מה נראה בתמונה. קריאת המודל. אינה מעוגנת
 *                             ב-KB ואינה מתיימרת להיות. זו עדות.
 *   פרשנות (interpretation) — למה זה מרמז. עוברת grounding מלא.
 *
 * מודל שאומר "אני רואה תסנין" — קריאה לגיטימית.
 * אותו מודל שאומר "זו דלקת ריאות שדורשת אנטיביוטיקה" — הזיה, אלא אם
 * הפרשנות מעוגנת בידע מאומת.
 */

/**
 * מחלץ ממצאים נצפים מהפלט המובנה של מנוע רדיולוגיה.
 *
 * ⚠ הכלל המרכזי: מוציאים רק את **מה שנראה**, לא את הפרשנות של המודל.
 * `differential_diagnoses` ו-`primary_impression` נשארים בחוץ בכוונה —
 * הם מסקנות, והזרמתן פנימה תיצור לולאה שבה המודל מאשר את עצמו:
 * הוא ינמק את האבחנה שלו על סמך האבחנה שלו.
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
    // רק אזורים שסומנו כחריגים. "תקין" ו-"לא ניתן להעריך" אינם ממצא —
    // וספירת Indeterminate כממצא הייתה יוצרת ממצאים יש-מאין.
    if (!/abnormal|חריג/i.test(f.status ?? '')) continue;
    observations.push({
      finding_he: f.description || f.anatomical_zone,
      location_he: f.anatomical_zone,
      severity: null,
      characteristics_he: null,
      source: 'systematic_finding',
    });
  }

  // דגלים שהמודל דיווח נכנסים כ**ממצאים**, לא כדגלי מערכת.
  // דגל מערכת מגיע אך ורק ממנוע ה-RedFlag הדטרמיניסטי.
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
export function toFindingStrings(observations = []) {
  const out = new Set();
  for (const o of observations) {
    if (o.finding_he) out.add(o.finding_he);
    if (o.finding_he && o.location_he) out.add(`${o.finding_he} ${o.location_he}`);
  }
  return [...out];
}

/**
 * ממצאים נצפים → פריטי P# עבור ה-FACT BLOCK.
 *
 * חשוב: הממצא הוויזואלי נכנס כ-P# (תצפית על המטופל) ולא כ-F# (ידע מאומת).
 * זה נכון עובדתית — זו תצפית על המקרה הזה, לא עובדה על העולם — וזה גם
 * מה שמונע מהמודל לצטט את הקריאה של עצמו כאילו הייתה מקור סמכות.
 */
export function toPatientFacts(observations = [], structured = null) {
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

/**
 * אזורים שלא ניתן היה להעריך — פער שחייב להיות מוצהר.
 * בלי זה, "לא הוערך" נקרא בפלט כמו "תקין".
 */
export function extractIndeterminateZones(structured) {
  return (structured?.systematic_findings ?? [])
    .filter((f) => /indeterminate|לא ניתן|לא הוערך/i.test(f.status ?? ''))
    .map((f) => f.anatomical_zone)
    .filter(Boolean);
}
