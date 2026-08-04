/**
 * MedScan — לוגיקת הספר, ללא צד-שרת
 *
 * מופרד מ-bookStore.js כדי שיהיה בדיק: אין כאן ייבוא של base44,
 * ולכן הכל רץ ב-node ישירות. bookStore מוסיף מעליו רק את ה-I/O.
 *
 * ## מה נכנס לספר ומה לא — ולמה
 *
 * **נכנס:** תאי הטבלאות. כל תא הוא יחידת ידע עצמאית עם שיוך מלא
 * (פרק › נושא › סעיף › עמוד). זה מה שהופך ציטוט לניתן-לבדיקה.
 *
 * **לא נכנס:** בלוקי הפסקאות שבמקור. בבדיקתם התברר שהם שאריות טקסט
 * משובש מחילוץ ה-PDF — רסיסי משפטים משתי עמודות שנתפרו זה לזה. הם
 * קריאים למראית עין, ולכן מסוכנים במיוחד: משפט אחד יכול לערבב עובדות
 * משתי מחלות שונות.
 *
 * ⚠ גלאי-התפר (detectSeams) לא סימן אותם. הוא מחפש תפר *בתוך* שורה,
 * וכאן החיבור עובר *בין* שורות. זה פער ידוע של הגלאי, ולכן ההחרגה
 * כאן מבנית ולא מבוססת-גלאי: בלוק k='p' לא נכנס, נקודה.
 */

import { clean, isHeading, topicKeyFor } from '../ingestion/bookParser.js';

export { topicKeyFor };

/** מתחת לזה, תא הוא בדרך כלל תווית עמודה ולא ידע. */
export const CONTENT_MIN = 30;

export const BOOK_SOURCE_NOTE_HE =
  'ספרון סיכומי נלסון 21 בטבלאות. נכללים תאי הטבלאות בלבד — ' +
  'בלוקי הפסקאות הושמטו בכוונה: הם טקסט משובש מחילוץ ה-PDF ' +
  '(רסיסי משפטים מעמודות שונות) ואינם מקור מהימן.';

/**
 * הופך את מבנה BOOK הגולמי לרשומות פרק מוכנות לשמירה.
 *
 * כל תא נקשר לכותרת העמודה שלו. הכותרת נלקחת מהעמודה עצמה, ואם אין —
 * מהשכנה: בטבלאות מוזגות-תאים כותרת ממורכזת נוחתת בעמודה סמוכה. אותה
 * לוגיקה בדיוק כמו ב-bookToChunks, כדי שהספר וההַפְנָיוֹת אליו יסכימו.
 */
export function buildChapterRecords(book) {
  const chapters = [];

  (book?.chapters ?? []).forEach((ch, ci) => {
    const topics = [];

    for (const tp of ch.topics ?? []) {
      const sections = [];
      const heading = {};
      const headingFor = (col) => {
        for (const c of [col, col + 1, col - 1]) if (heading[c]) return heading[c];
        return null;
      };

      for (const block of tp.b ?? []) {
        if (block.k !== 't') continue; // פסקאות — ראה הערת הקובץ

        for (const row of block.v ?? []) {
          (row ?? []).forEach((raw, col) => {
            const value = clean(raw);
            if (!value) return;
            if (isHeading(value)) {
              heading[col] = value;
              return;
            }
            if (value.length < CONTENT_MIN) return;

            const h = headingFor(col);
            const last = sections[sections.length - 1];
            if (last && last.h === h) last.c.push(value);
            else sections.push({ h, p: block.p ?? tp.pg ?? null, c: [value] });
          });
        }
      }

      if (sections.length) {
        topics.push({ t: tp.t, k: topicKeyFor(ch.t, tp.t), pg: tp.pg ?? null, s: sections });
      }
    }

    if (topics.length) {
      chapters.push({
        chapter_no: ci + 1,
        title_he: ch.t,
        topic_count: topics.length,
        cell_count: topics.reduce((n, t) => n + t.s.reduce((m, s) => m + s.c.length, 0), 0),
        topics,
        source_note_he: BOOK_SOURCE_NOTE_HE,
      });
    }
  });

  return chapters;
}

/**
 * חיפוש חופשי בספר.
 *
 * מחזיר תאים, לא נושאים — היחידה שהרופא/ה צריך/ה לראות היא המשפט עצמו
 * במקומו, ולא הפניה לנושא שצריך לסרוק ידנית.
 */
export function searchBook(chapters, query, { limit = 80 } = {}) {
  const q = clean(query).toLowerCase();
  if (q.length < 2) return [];

  const hits = [];
  for (const ch of chapters ?? []) {
    for (const tp of ch.topics ?? []) {
      for (const sec of tp.s ?? []) {
        for (const cell of sec.c ?? []) {
          if (!cell.toLowerCase().includes(q)) continue;
          hits.push({
            chapter_no: ch.chapter_no,
            chapter: ch.title_he,
            topic: tp.t,
            topic_key: tp.k,
            heading: sec.h,
            page: sec.p,
            text: cell,
          });
          if (hits.length >= limit) return hits;
        }
      }
    }
  }
  return hits;
}

/**
 * פותר source_anchor לנושא בספר.
 *
 * זה החיבור בין הפלט הקליני למקור: עוגן שאינו נפתר כאן הוא ציטוט
 * שאי-אפשר לבדוק — וכזה חסום ממילא ב-anchorGuard לפני שהגיע לכאן.
 */
export function resolveAnchor(chapters, anchor) {
  if (!anchor) return null;
  const key = String(anchor).trim();
  for (const ch of chapters ?? []) {
    for (const tp of ch.topics ?? []) {
      if (tp.k === key) return { chapter: ch, topic: tp };
    }
  }
  return null;
}

export function bookStats(chapters) {
  let topics = 0;
  let cells = 0;
  for (const ch of chapters ?? []) {
    topics += ch.topics?.length ?? 0;
    for (const tp of ch.topics ?? []) {
      for (const sec of tp.s ?? []) cells += sec.c?.length ?? 0;
    }
  }
  return { chapters: chapters?.length ?? 0, topics, cells };
}
