#!/usr/bin/env node
/**
 * סורק את NelsonChapter ומדפיס את התאים ה"משובשים" — תאים ארוכים חריגים
 * שנוצרו כשעמודות טבלה נמעכו לתא אחד בחילוץ ה-PDF.
 *
 * ⚠ הסדר חייב להישאר יציב בין הרצות, אחרת מספרי התאים בקבצי החילוץ
 * מפסיקים להצביע על אותו תא. הסדר: אורך יורד, ושובר-שוויון דטרמיניסטי
 * (פרק → נושא → טבלה → שורה → עמודה) כדי ששני תאים באותו אורך לא יתחלפו.
 *
 * שימוש:  node scripts/corruptCells.mjs <from> <to>     (אינדקסים 1-based, לא כולל from)
 *         node scripts/corruptCells.mjs --list
 */
import { readFileSync } from 'node:fs';

const MIN_LEN = 600;

const raw = JSON.parse(readFileSync(new URL('./.nelson-cache.json', import.meta.url), 'utf8'));

const cells = [];
for (const ch of raw) {
  for (const [ti, t] of (ch.topics ?? []).entries()) {
    for (const [bi, tb] of (t.tb ?? []).entries()) {
      for (const [ri, row] of (tb.r ?? []).entries()) {
        for (const [ci, cell] of (row ?? []).entries()) {
          const text = String(cell ?? '').trim();
          if (text.length >= MIN_LEN) {
            cells.push({ ch: ch.chapter_no, chTitle: ch.title_he, topic: t.t, key: t.k, ti, bi, ri, ci, len: text.length, text });
          }
        }
      }
    }
  }
}

cells.sort((a, b) =>
  b.len - a.len || a.ch - b.ch || a.ti - b.ti || a.bi - b.bi || a.ri - b.ri || a.ci - b.ci
);

const [, , argA, argB] = process.argv;

if (argA === '--list') {
  console.log(`סה"כ תאים משובשים (>= ${MIN_LEN} תווים): ${cells.length}\n`);
  cells.forEach((c, i) => console.log(`#${i + 1} · פרק ${c.ch} · ${c.chTitle} › ${c.topic} (${c.len})`));
  process.exit(0);
}

const from = Number(argA ?? 0);
const to = Number(argB ?? from + 1);

for (let i = from; i < Math.min(to, cells.length); i++) {
  const c = cells[i];
  console.log(`\n${'='.repeat(70)}`);
  console.log(`#${i + 1} · פרק ${c.ch} · ${c.chTitle} › ${c.topic}  (${c.len} תווים)`);
  console.log(`topic_key: ${c.key}`);
  console.log('='.repeat(70));
  console.log(c.text);
}
