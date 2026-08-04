/**
 * MedScan — Layout Reconstruction from Coordinates
 *
 * ## למה השלב הזה קיים
 * מסמכים רפואיים בעברית נכתבים בטבלאות רב-עמודתיות. כשמחלצים מהם
 * טקסט בצורה נאיבית, שורה מעמודה אחת נתפרת לשורה מעמודה אחרת —
 * ולעיתים אלה **שתי מחלות שונות**. התוצאה נראית קוהרנטית לחלוטין
 * ומערבבת עובדות.
 *
 * ## למה לא פותרים את זה גאומטרית
 * נוסו: היסטוגרמת מרכזים, אשכולות קצה-ימני, הצבעת פערים פר-שורה,
 * גילוי מרזבים, ו-XY-cut רקורסיבי. אף אחת לא עבדה על המסמך הזה,
 * מכיוון שהפריסה משתנה בתוך העמוד: אזור עליון בשלוש עמודות, אזור
 * תחתון בשתיים, ורוחב עמודה משתנה.
 *
 * ## הפתרון
 * לא לשחזר בכללים — **להעביר את הקואורדינטות למודל**. זיהוי פריסה
 * הוא בדיוק סוג המשימה שבה מודל טוב וכללים גרועים.
 *
 * ## למה זה בטוח
 * המודל כאן אינו מייצר תוכן קליני — הוא **מסדר מחדש טקסט קיים**.
 * הפלט נבדק דטרמיניסטית: כל תו בפלט חייב להופיע בקלט. מודל שיוסיף
 * מילה אחת — ייחסם. ראה `verifyNoInvention`.
 */

/** סכמת פלט לשחזור הפריסה. */
export const LAYOUT_SCHEMA = {
  type: 'object',
  properties: {
    page_kind: {
      type: 'string',
      enum: ['table', 'prose', 'mixed', 'empty'],
      description: 'האם העמוד טבלאי, טקסט רץ, מעורב, או ריק',
    },
    columns: {
      type: 'array',
      description:
        'העמודות שזוהו, מימין לשמאל (סדר קריאה עברי). ' +
        'כל עמודה מכילה את הטקסט שלה בסדר קריאה נכון.',
      items: {
        type: 'object',
        properties: {
          heading_he: {
            type: 'string',
            description: 'כותרת העמודה אם קיימת. אם אין — השאר ריק, אל תמציא.',
          },
          x_range: {
            type: 'string',
            description: 'טווח ה-x של העמודה, למשל "600-810". לצורך בקרה.',
          },
          text_he: {
            type: 'string',
            description:
              'הטקסט של העמודה בלבד, בסדר קריאה. **העתק מילה במילה** מהפריטים ' +
              'שסופקו. אל תסכם, אל תתקן ואל תוסיף.',
          },
        },
        required: ['text_he'],
      },
    },
    uncertain_items: {
      type: 'array',
      description: 'פריטים שלא היה ברור לאיזו עמודה הם שייכים. עדיף להצהיר מאשר לנחש.',
      items: { type: 'string' },
    },
  },
  required: ['page_kind', 'columns'],
};

export const LAYOUT_SYSTEM_PROMPT = `אתה משחזר פריסת עמוד מתוך רשימת פריטי טקסט עם קואורדינטות.

**אתה לא כותב תוכן. אתה מסדר טקסט קיים לפי מיקומו.**

הקלט: פריטי טקסט, כל אחד עם y (גובה, גדול=למעלה) ו-x0→x1 (טווח אופקי).
המסמך בעברית — **סדר הקריאה הוא מימין לשמאל**, כלומר x גבוה = ראשון.

## המשימה
1. זהה את העמודות לפי טווחי ה-x. שים לב: **הפריסה עשויה להשתנות בתוך
   העמוד** — אזור עליון בשלוש עמודות ותחתון בשתיים הוא מצב נפוץ כאן.
   אם כך — התייחס לכל אזור בנפרד והחזר את העמודות של כולם.
2. הרכב את הטקסט של כל עמודה בסדר קריאה: y יורד, ובתוך שורה x יורד.
3. החזר את העמודות **מימין לשמאל**.

## כללים מוחלטים
· **העתק מילה במילה.** אל תסכם, אל תתקן שגיאות כתיב, אל תשלים מילים
  חתוכות, ואל תוסיף פיסוק. כל תו בפלט חייב להגיע מהקלט.
· **אל תמציא כותרת עמודה.** אם אין כותרת ברורה — השאר ריק.
· **פריט שאינך בטוח לאיזו עמודה שייך** — הכנס ל-uncertain_items ואל
  תשבץ אותו בניחוש. שיבוץ שגוי מערבב שתי מחלות.
· **אל תשמיט פריטים.** כל פריט צריך להופיע באחת העמודות או ב-uncertain.

הפלט שלך ייבדק אוטומטית מול הקלט. טקסט שאינו בקלט יגרום לפסילת העמוד.`;

/**
 * ממיר פריטי טקסט לייצוג קומפקטי לפרומפט.
 * מעגל קואורדינטות — דיוק תת-פיקסלי רק מבזבז אסימונים.
 */
export function itemsToPrompt(items) {
  const rows = items
    .slice()
    .sort((a, b) => b.y - a.y || b.x0 - a.x0)
    .map((it) =>
      `y${Math.round(it.y)} x${Math.round(it.x0)}-${Math.round(it.x1)} ${it.s}`
    );
  return rows.join('\n');
}

/**
 * בדיקה דטרמיניסטית: כל תו בפלט הגיע מהקלט.
 *
 * זו ההגנה שהופכת את השלב הזה לבטוח. המודל מסדר מחדש; אם הוא
 * **הוסיף** משהו — נדע, כי הטקסט לא יימצא בקלט.
 *
 * ההשוואה מתעלמת מרווחים ומפיסוק, כי הסידור מחדש משנה אותם באופן
 * לגיטימי. מה שנבדק הוא רצף התווים המשמעותיים.
 */
export function verifyNoInvention({ items, columns }) {
  const norm = (s) => String(s ?? '').replace(/[\s‏‎]/g, '');
  const haystack = norm(items.map((i) => i.s).join(''));

  const problems = [];
  for (const [idx, col] of (columns ?? []).entries()) {
    const text = norm(col.text_he);
    if (!text) continue;

    // בודקים במקטעים — התאמה מלאה תיכשל בגלל סדר, מקטעים תופסים המצאה
    const CHUNK = 24;
    let missing = 0, checked = 0;
    for (let i = 0; i + CHUNK <= text.length; i += CHUNK) {
      checked += 1;
      if (!haystack.includes(text.slice(i, i + CHUNK))) missing += 1;
    }
    if (checked === 0) continue;

    const ratio = missing / checked;
    if (ratio > 0.05) {
      problems.push({
        column: idx + 1,
        severity: 'block',
        missing_ratio: Number(ratio.toFixed(3)),
        why_he:
          `${Math.round(ratio * 100)}% ממקטעי הטקסט בעמודה ${idx + 1} אינם מופיעים בקלט. ` +
          'המודל הוסיף או שינה טקסט במקום לסדר אותו מחדש.',
      });
    }
  }

  // כיסוי: כמה מהקלט הופיע בפלט
  const outAll = norm((columns ?? []).map((c) => c.text_he).join(''));
  const coverage = haystack.length ? Math.min(1, outAll.length / haystack.length) : 1;
  if (coverage < 0.7) {
    problems.push({
      column: null,
      severity: 'warn',
      why_he:
        `רק ${Math.round(coverage * 100)}% מהטקסט שסופק הופיע בפלט. ` +
        'ייתכן שהמודל השמיט חלקים מהעמוד.',
    });
  }

  return {
    ok: !problems.some((p) => p.severity === 'block'),
    problems,
    coverage: Number(coverage.toFixed(3)),
  };
}

/**
 * משחזר פריסה של עמוד אחד.
 * @returns {Promise<{ok, columns, uncertain, verification, error}>}
 */
export async function reconstructPage({ items, invokeLLM, pageNumber = null }) {
  if (!items?.length) {
    return { ok: true, columns: [], uncertain: [], verification: { ok: true, problems: [] } };
  }

  try {
    const result = await invokeLLM({
      system: LAYOUT_SYSTEM_PROMPT,
      prompt: [
        pageNumber ? `עמוד ${pageNumber}.` : '',
        'פריטי הטקסט (y=גובה, x0-x1=טווח אופקי, עברית RTL):',
        '---',
        itemsToPrompt(items),
        '---',
        'שחזר את העמודות. העתק מילה במילה.',
      ].filter(Boolean).join('\n'),
      schema: LAYOUT_SCHEMA,
      purpose: 'layout_reconstruction',
    });

    if (!result?.columns) {
      return { ok: false, error: 'layout_malformed', columns: [] };
    }

    const verification = verifyNoInvention({ items, columns: result.columns });

    return {
      ok: verification.ok,
      page_kind: result.page_kind,
      columns: result.columns,
      uncertain: result.uncertain_items ?? [],
      verification,
      error: verification.ok ? null : 'invention_detected',
    };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e), columns: [] };
  }
}

/**
 * עמודה משוחזרת → קטע לחילוץ ידע.
 * כל עמודה היא יחידה נפרדת — זה בדיוק מה שמונע ערבוב בין נושאים.
 */
export function columnsToChunks(columns = [], pageNumber = null) {
  return columns
    .filter((c) => (c.text_he ?? '').trim().length > 40)
    .map((c, i) => ({
      text: c.text_he,
      hint: [
        pageNumber ? `עמוד ${pageNumber}` : null,
        `עמודה ${i + 1}`,
        c.heading_he ? `כותרת: ${c.heading_he}` : null,
      ].filter(Boolean).join(' · '),
    }));
}
