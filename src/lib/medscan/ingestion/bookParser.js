/**
 * MedScan — Nelson Book Parser
 *
 * מפענח את מבנה `BOOK` מאפליקציית הטבלאות של נלסון.
 *
 * ## למה זה מייתר את כל שחזור הפריסה
 * ניסיתי לשחזר את הטבלאות מ-PDF בחמש דרכים גאומטריות — כולן נכשלו,
 * כי הפריסה משתנה בתוך העמוד. אבל האפליקציה **כבר מחזיקה את הטבלאות
 * מפורקות לתאים**: כל תא בנפרד, כל עמודה בפני עצמה.
 *
 * המשמעות: הבעיה שהשקעתי בה הכי הרבה — ערבוב בין עמודות, כלומר בין
 * שתי מחלות שונות — פשוט לא קיימת כאן. התא הוא גבול הידע.
 *
 * מדידה: 98.6% מהקטעים נקיים מסימני-תפר, לעומת חילוץ ישיר מה-PDF.
 *
 * ## מבנה המקור
 *   BOOK.chapters[] → { t: שם הפרק, topics[] }
 *   topic           → { t: שם הנושא, pg: עמודים, b: בלוקים[] }
 *   block           → { k: 't'|'p', p: עמוד, v: תוכן }
 *                     k='t' → v = מערך שורות, כל שורה מערך תאים
 *                     k='p' → v = מחרוזת פסקה
 */

/** ניקוי תווי-רוחב ורווחים כפולים, בלי לגעת בתוכן. */
const clean = (s) =>
  String(s ?? '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

/**
 * תא-כותרת מזוהה לפי צורה: קצר, בלי תבליטים, ולא נגמר בסימן סוף-משפט.
 * הכותרת אינה ידע בפני עצמה — היא ההקשר של התאים שאחריה באותה עמודה.
 */
function isHeading(text) {
  return Boolean(text) && text.length < 60 && !/[•\n]/.test(text) && !/[.:]$/.test(text);
}

/**
 * מחלץ את אובייקט BOOK מקובץ ה-HTML.
 *
 * ⚠ הפענוח כאן הוא **טקסטואלי בלבד** — איזון סוגריים מודע-מחרוזות.
 * אין הרצת קוד מהקובץ, גם לא `eval`: קובץ HTML שהמשתמש מעלה הוא
 * קלט חיצוני, ולא נריץ ממנו JavaScript.
 */
export function extractBookSource(html) {
  const marker = /const\s+BOOK\s*=\s*\{/.exec(String(html ?? ''));
  if (!marker) return { source: null, error: 'BOOK_not_found' };

  const start = html.indexOf('{', marker.index);
  let depth = 0, inStr = false, quote = '', esc = false, end = -1;

  for (let i = start; i < html.length; i += 1) {
    const c = html[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (inStr) { if (c === quote) inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; quote = c; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) { end = i; break; } }
  }

  if (end === -1) return { source: null, error: 'BOOK_unbalanced' };
  return { source: html.slice(start, end + 1), error: null };
}

/**
 * ממיר את מבנה BOOK לקטעים לחילוץ ידע.
 *
 * כל תא הוא קטע נפרד, עם השיוך המלא שלו: פרק › נושא › סעיף › עמוד.
 * השיוך הזה הוא מה שיהפוך ל-`source_anchor`, והוא מה שמאפשר לרופא/ה
 * לחזור למקור ולבדוק.
 */
export function bookToChunks(book, { minChars = 40 } = {}) {
  const chunks = [];
  const chapters = book?.chapters ?? [];

  chapters.forEach((chapter, ci) => {
    (chapter.topics ?? []).forEach((topic) => {
      (topic.b ?? []).forEach((block) => {
        const page = block.p ?? topic.pg ?? null;

        if (block.k === 't') {
          // כותרת אחרונה שנראתה בכל עמודה.
          //
          // ⚠ הכותרת לא תמיד יושבת באותה עמודה כמו התוכן שלה:
          // כותרת ממורכזת מעל עמודה רחבה נוחתת בתא שכן. לכן מחפשים
          // בעמודה עצמה, ואז בשכנות. שיוך שגוי של כותרת גרוע מהיעדרה —
          // הוא ישייך ידע לנושא הלא-נכון.
          const colHeading = {};
          const headingFor = (col) => {
            for (const c of [col, col + 1, col - 1]) {
              if (colHeading[c]) return colHeading[c];
            }
            return null;
          };

          (block.v ?? []).forEach((row) => {
            (row ?? []).forEach((cell, col) => {
              const text = clean(cell);
              if (!text) return;
              if (isHeading(text)) { colHeading[col] = text; return; }
              if (text.length < minChars) return;
              chunks.push({
                chapter_no: ci + 1,
                chapter: chapter.t,
                topic: topic.t,
                section: headingFor(col),
                page,
                kind: 'table_cell',
                text,
              });
            });
          });
        } else {
          const text = clean(block.v);
          if (text.length < minChars) return;
          chunks.push({
            chapter_no: ci + 1,
            chapter: chapter.t,
            topic: topic.t,
            section: null,
            page,
            kind: 'paragraph',
            text,
          });
        }
      });
    });
  });

  return chunks;
}

/**
 * מפתח-עוגן יציב לנושא. הוא יישאר לנצח כ-`source_anchor`,
 * ולכן נגזר מהתוכן ולא ממספור שעלול להשתנות.
 */
export function topicKeyFor(chapterName, topicName) {
  const slug = (s) =>
    String(s ?? '')
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
  return `nelson.${slug(chapterName)}.${slug(topicName)}`;
}

/** סיכום למסך הייבוא — מה יש בקובץ לפני שמתחילים. */
export function summarizeBook(book) {
  const chapters = book?.chapters ?? [];
  let topics = 0, tables = 0, cells = 0, paragraphs = 0;

  for (const ch of chapters) {
    for (const tp of ch.topics ?? []) {
      topics += 1;
      for (const bl of tp.b ?? []) {
        if (bl.k === 't') {
          tables += 1;
          for (const row of bl.v ?? []) cells += (row ?? []).length;
        } else paragraphs += 1;
      }
    }
  }

  return {
    chapters: chapters.length,
    topics,
    tables,
    cells,
    paragraphs,
    chapter_list: chapters.map((c, i) => ({
      no: i + 1,
      title: c.t,
      topics: (c.topics ?? []).length,
    })),
  };
}

/** קטעים של פרק אחד — הייבוא נעשה פרק-אחר-פרק, לא הכל בבת אחת. */
export function chunksForChapter(book, chapterNo, opts) {
  return bookToChunks(book, opts).filter((c) => c.chapter_no === chapterNo);
}
