/**
 * בדיקות אחסון הספר.
 *
 * הבדיקה החשובה כאן היא לא "האם הספר נשמר" אלא **האם הציטוט מוביל
 * למקור**. עוגן שנשבר בשקט הוא כישלון גרוע יותר מקריסה: הפלט ייראה
 * מעוגן, הקישור יוביל לדף ריק, ואף בדיקה לא תתלונן.
 */

import assert from 'node:assert';
import {
  buildChapterRecords, searchBook, resolveAnchor, bookStats, topicKeyFor,
} from './bookCore.js';
import { bookToChunks, topicKeyFor as parserKey } from '../ingestion/bookParser.js';

let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
  catch (e) { fail += 1; console.log(`  ✗ ${name}\n      ${e.message}`); }
};
const eq = assert.strictEqual;
const ok = assert.ok;

const BOOK = {
  chapters: [
    {
      t: 'מחלות זיהומיות',
      topics: [
        {
          t: 'חום ללא מקור',
          pg: '12-14',
          b: [
            {
              k: 't', p: 12,
              v: [
                ['תינוק עד חודש', 'ילד מעל 3 חודשים'],
                [
                  'כל חום מעל 38 מחייב בירור ספסיס מלא כולל ניקור מותני',
                  'ניתן להסתפק בבדיקת שתן ובמעקב צמוד אם המצב הכללי טוב',
                ],
                ['קצר', 'גם קצר'],
              ],
            },
            {
              k: 'p',
              p: 13,
              v: 'ירוד/טוקסיים/מדדים חיוניים לא -תקינים יש חשד לזיהום חיידק י ולכן פנאומוקוק',
            },
          ],
        },
      ],
    },
    {
      t: 'המטולוגיה',
      topics: [
        { t: 'אנמיה', pg: '40', b: [{ k: 'p', v: 'טקסט פסקה בלבד, ארוך מספיק כדי לעבור סף' }] },
      ],
    },
  ],
};

console.log('\nbookCore\n');

test('פסקאות אינן נכנסות לספר', () => {
  const chapters = buildChapterRecords(BOOK);
  const all = JSON.stringify(chapters);
  ok(!all.includes('טוקסיים'), 'טקסט פסקה משובש נכנס לספר');
  ok(!all.includes('טקסט פסקה בלבד'), 'פסקה נכנסה לספר');
});

test('פרק שכולו פסקאות מושמט לגמרי', () => {
  const chapters = buildChapterRecords(BOOK);
  eq(chapters.length, 1, 'פרק ללא תאי טבלה לא אמור להישמר');
  eq(chapters[0].title_he, 'מחלות זיהומיות');
});

test('תאי טבלה נכנסים עם הכותרת והעמוד שלהם', () => {
  const [ch] = buildChapterRecords(BOOK);
  const [tp] = ch.topics;
  const flat = tp.s.flatMap((s) => s.c);
  eq(flat.length, 2, 'שני תאי תוכן');
  ok(tp.s.some((s) => s.h === 'תינוק עד חודש'));
  ok(tp.s.every((s) => s.p === 12), 'עמוד לא נשמר');
});

test('תאים קצרים מסוננים כתוויות ולא כידע', () => {
  const [ch] = buildChapterRecords(BOOK);
  const flat = ch.topics.flatMap((t) => t.s.flatMap((s) => s.c));
  ok(!flat.includes('קצר'));
});

test('ספירת התאים תואמת את התוכן בפועל', () => {
  const [ch] = buildChapterRecords(BOOK);
  const actual = ch.topics.reduce(
    (n, t) => n + t.s.reduce((m, s) => m + s.c.length, 0), 0,
  );
  eq(ch.cell_count, actual);
});

/* ── חוזה העוגן: זו הבדיקה שמונעת ציטוט שמוביל לשום מקום ─────────── */

test('מפתח העוגן בספר זהה לזה שמייצר החילוץ', () => {
  const [ch] = buildChapterRecords(BOOK);
  eq(ch.topics[0].k, parserKey('מחלות זיהומיות', 'חום ללא מקור'));
});

test('כל עוגן שהחילוץ מייצר נפתר בספר', () => {
  const chapters = buildChapterRecords(BOOK);
  const fromExtraction = bookToChunks(BOOK)
    .filter((c) => c.kind === 'table_cell')
    .map((c) => topicKeyFor(c.chapter, c.topic));

  ok(fromExtraction.length > 0, 'החילוץ לא ייצר קטעים — הבדיקה חסרת ערך');
  for (const key of new Set(fromExtraction)) {
    ok(resolveAnchor(chapters, key), `עוגן ${key} אינו נפתר בספר`);
  }
});

test('עוגן שאינו קיים מחזיר null ולא זורק', () => {
  const chapters = buildChapterRecords(BOOK);
  eq(resolveAnchor(chapters, 'nelson.לא.קיים'), null);
  eq(resolveAnchor(chapters, null), null);
});

test('resolveAnchor מחזיר את הפרק והנושא, לא רק דגל', () => {
  const chapters = buildChapterRecords(BOOK);
  const r = resolveAnchor(chapters, chapters[0].topics[0].k);
  eq(r.chapter.title_he, 'מחלות זיהומיות');
  eq(r.topic.t, 'חום ללא מקור');
});

/* ── חיפוש ─────────────────────────────────────────────────────────── */

test('חיפוש מחזיר את התא עם השיוך המלא שלו', () => {
  const chapters = buildChapterRecords(BOOK);
  const [hit] = searchBook(chapters, 'ניקור מותני');
  eq(hit.chapter, 'מחלות זיהומיות');
  eq(hit.topic, 'חום ללא מקור');
  eq(hit.page, 12);
  ok(hit.topic_key.startsWith('nelson.'));
});

test('שאילתה קצרה מדי אינה מחזירה את כל הספר', () => {
  const chapters = buildChapterRecords(BOOK);
  eq(searchBook(chapters, 'א').length, 0);
  eq(searchBook(chapters, '').length, 0);
});

test('חיפוש מכבד את מגבלת התוצאות', () => {
  const chapters = buildChapterRecords(BOOK);
  ok(searchBook(chapters, 'ב', { limit: 1 }).length <= 1);
});

test('חיפוש בספר ריק אינו קורס', () => {
  eq(searchBook(null, 'חום').length, 0);
  eq(searchBook([], 'חום').length, 0);
});

test('bookStats סופר את מה שבאמת נשמר', () => {
  const chapters = buildChapterRecords(BOOK);
  const s = bookStats(chapters);
  eq(s.chapters, 1);
  eq(s.topics, 1);
  eq(s.cells, 2);
});

test('קלט פגום אינו מפיל את הבנייה', () => {
  eq(buildChapterRecords(null).length, 0);
  eq(buildChapterRecords({}).length, 0);
  eq(buildChapterRecords({ chapters: [{ t: 'ריק' }] }).length, 0);
  eq(buildChapterRecords({ chapters: [{ t: 'א', topics: [{ t: 'ב', b: null }] }] }).length, 0);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
process.exit(fail > 0 ? 1 : 0);
