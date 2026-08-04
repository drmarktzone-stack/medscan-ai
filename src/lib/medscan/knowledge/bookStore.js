/**
 * MedScan — אחסון הספר באפליקציה
 *
 * הספר נטען פעם אחת ונשמר בישות NelsonChapter. מרגע זה הוא חלק
 * מהאפליקציה: נגיש מהמאגר, ומשמש כיעד לכל source_anchor שהמערכת מצטטת.
 *
 * ## מה נשמר ומה לא — ולמה
 *
 * **נשמר:** תאי הטבלאות. כל תא הוא יחידת ידע עצמאית, עם שיוך מלא
 * (פרק › נושא › סעיף › עמוד). זה מה שהופך ציטוט לניתן-לבדיקה.
 *
 * **לא נשמר:** בלוקי הפסקאות שבמקור. בבדיקה שלהם התברר שהם שאריות
 * טקסט משובש מחילוץ ה-PDF — רסיסי משפטים משתי עמודות שנתפרו זה לזה.
 * הם קריאים למראית עין ולכן מסוכנים במיוחד: משפט אחד יכול לערבב
 * עובדות משתי מחלות שונות. גלאי-התפר לא סימן אותם, כי התפר עובר בין
 * שורות ולא בתוך שורה — פער שמתועד ב-detectSeams.
 *
 * ההחלטה נשמרת בשדה source_note_he של כל פרק, כדי שתמיד יהיה ברור
 * מה בפנים ומה לא.
 */

import { base44 } from "@/api/base44Client";

const NBSP = / /g;

/** תווית קצרה מדי / כותרת — לא תוכן. */
const HEADING_MAX = 60;
/** מתחת לזה, תא הוא בדרך כלל תווית עמודה ולא ידע. */
const CONTENT_MIN = 30;

export const BOOK_SOURCE_NOTE_HE =
  "ספרון סיכומי נלסון 21 בטבלאות. נכללים תאי הטבלאות בלבד — " +
  "בלוקי הפסקאות הושמטו בכוונה: הם טקסט משובש מחילוץ ה-PDF " +
  "(רסיסי משפטים מעמודות שונות) ואינם מקור מהימן.";

const clean = (s) => String(s ?? "").replace(NBSP, " ").replace(/[ \t]+/g, " ").trim();

const isHeading = (s) =>
  s.length > 0 && s.length < HEADING_MAX && !/[•\n]/.test(s) && !/[.:]$/.test(s);

export const slug = (s) =>
  String(s ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

export function topicKeyFor(chapterTitle, topicTitle) {
  return `nelson.${slug(chapterTitle)}.${slug(topicTitle)}`;
}

/**
 * הופך את מבנה BOOK הגולמי לרשומות פרק מוכנות לשמירה.
 *
 * כל תא נקשר לכותרת העמודה שלו. הכותרת נלקחת מהעמודה עצמה, ואם אין —
 * מהשכנה. בטבלאות מוזגות-תאים הכותרת יושבת לעתים בעמודה סמוכה, וזו
 * הסטייה היחידה שנצפתה בפועל.
 */
export function buildChapterRecords(book) {
  const chapters = [];

  (book?.chapters ?? []).forEach((ch, ci) => {
    const topics = [];

    for (const tp of ch.topics ?? []) {
      const sections = [];
      const heading = {};
      const headingFor = (col) => heading[col] ?? heading[col + 1] ?? heading[col - 1] ?? null;

      for (const block of tp.b ?? []) {
        if (block.k !== "t") continue; // פסקאות — ראה הערת הקובץ

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
        topics.push({
          t: tp.t,
          k: topicKeyFor(ch.t, tp.t),
          pg: tp.pg ?? null,
          s: sections,
        });
      }
    }

    if (topics.length) {
      chapters.push({
        chapter_no: ci + 1,
        title_he: ch.t,
        topic_count: topics.length,
        cell_count: topics.reduce(
          (n, t) => n + t.s.reduce((m, s) => m + s.c.length, 0),
          0,
        ),
        topics,
        source_note_he: BOOK_SOURCE_NOTE_HE,
      });
    }
  });

  return chapters;
}

/** שומר את הספר באפליקציה. מעדכן פרק קיים במקום לשכפל אותו. */
export async function saveBookToApp(book, { onProgress } = {}) {
  const records = buildChapterRecords(book);
  const existing = await base44.entities.NelsonChapter.list("chapter_no", 200);
  const byNo = new Map(existing.map((r) => [r.chapter_no, r]));

  const summary = { created: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    onProgress?.({ done: i, total: records.length, title: rec.title_he });
    try {
      const prev = byNo.get(rec.chapter_no);
      if (prev) {
        await base44.entities.NelsonChapter.update(prev.id, rec);
        summary.updated++;
      } else {
        await base44.entities.NelsonChapter.create(rec);
        summary.created++;
      }
    } catch (e) {
      summary.failed++;
      summary.errors.push({ chapter: rec.title_he, error: e?.message || String(e) });
    }
  }

  onProgress?.({ done: records.length, total: records.length, title: null });
  return summary;
}

export async function loadBook() {
  return base44.entities.NelsonChapter.list("chapter_no", 200);
}

/** האם הספר כבר באפליקציה. זול — לא מושך את התוכן. */
export async function isBookLoaded() {
  try {
    const rows = await base44.entities.NelsonChapter.list("chapter_no", 1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * חיפוש חופשי בספר.
 *
 * מחזיר תאים, לא נושאים — כי היחידה שהרופא/ה צריך/ה לראות היא המשפט
 * עצמו במקומו, ולא הפניה לנושא שצריך לסרוק ידנית.
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
 * שאי-אפשר לבדוק — וכזה חסום ממילא ב-anchorGuard.
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
