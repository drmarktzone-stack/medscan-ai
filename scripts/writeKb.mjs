#!/usr/bin/env node
/**
 * טעינת חילוץ מאומת ל-KB — כתיבה בפועל.
 *
 * ## למה הקובץ הזה נפרד מ-ingestKb.mjs
 * `ingestKb.mjs` מתכנן ופולט בלבד. ההפרדה נשמרת: תכנון ניתן להריץ
 * בלי סיכון, וכתיבה דורשת קריאה מפורשת לסקריפט אחר עם דגל --write.
 *
 * ## למה הוא קיים בכלל
 * הנתיב הקודם היה העתקה ידנית של כל רשומה לתוך קריאת MCP. בשני
 * פרקים ראשונים ההעתקה ייצרה ארבע סטיות טקסט — אות שנשמטה בשם
 * דגל אדום, סיומת שנחתכה בהוראת פעולה. שלוש נתפסו באימות
 * הקריאה-החוזרת, אחת נתפסה רק כי הרחבנו את VERIFY_FIELDS.
 *
 * ערוץ שמכניס שגיאות טקסט לידע קליני אינו ערוץ שאפשר לתקן בבדיקות
 * בדיעבד. הקובץ הזה מסיר את ההעתקה: מה שנכתב הוא בדיוק מה שבקובץ.
 *
 * ## ⚠ מה הקובץ הזה מסתמך עליו — ויש לדעת זאת
 * קריאות HTTP מסביבת הריצה של Base44 **עוקפות את נעילות ה-RLS**
 * שהוצבו על ישויות הידע. POST מכאן מצליח גם כשאותה קריאה מעמדה
 * חיצונית מוחזרת ב-403. זו אינה תוצאה של הקובץ הזה — זו עובדה
 * שהתגלתה קודם לכן, והיא נכונה גם בלעדיו.
 *
 * המשמעות: הקובץ הזה אינו «נתיב מאומת» במובן המלא. הוא נתיב
 * מדויק. שתי ההגנות שנשארות אמיתיות הן שהתוכן נבדק מבנית לפני
 * הכתיבה, ושכל רשומה נכנסת כ-draft_needs_verification ולכן אינה
 * משתתפת בפלט קליני עד לחתימת רופא/ה.
 *
 * ⚠ אין להשתמש בקובץ הזה לבדיקות סכמה. בדיקת סכמה בכתיבה מהסביבה
 * הזו כבר יצרה רשומות זבל שלא ניתן היה למחוק — DELETE דווקא נחסם.
 *
 * שימוש:
 *   node scripts/writeKb.mjs <extraction.json>            # תכנון בלבד
 *   node scripts/writeKb.mjs <extraction.json> --write    # כתיבה + אימות
 */
import fs from 'node:fs';
import path from 'node:path';

import { planIngestion, applyPlan, summarize } from '../src/lib/medscan/ingestion/ingestExtraction.js';
import { NATURAL_KEY, WRITE_ORDER } from '../src/lib/medscan/ingestion/kbRecords.js';

const APP_ID = process.env.BASE44_APP_ID || '6a44d05c8195d3fd459fae15';
const BASE = `${process.env.BASE44_URL || 'https://base44.app'}/api/apps/${APP_ID}/entities`;

const file = process.argv[2];
const doWrite = process.argv.includes('--write');

if (!file || file.startsWith('--')) {
  console.error('שימוש: node scripts/writeKb.mjs <extraction.json> [--write]');
  process.exit(2);
}

/** קריאת כל הרשומות של ישות. מוגבל ל-500 — מעבר לזה יש לעמד. */
async function listRecords(entity) {
  const res = await fetch(`${BASE}/${entity}?limit=500`);
  if (!res.ok) throw new Error(`קריאת ${entity} נכשלה: ${res.status}`);
  return res.json();
}

async function createRecord(entity, rec) {
  const res = await fetch(`${BASE}/${entity}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(rec),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

const extraction = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

// ── מצב ה-KB הנוכחי ────────────────────────────────────────────────────
// נטען לפני התכנון, כדי ששתי שאלות ייענו מנתונים אמיתיים ולא מהנחה:
// מה כבר קיים (ולכן יידלג), ואילו נושאים קיימים (ולכן עוגן המפנה
// אליהם תקין). בלי זה, טעינה מצטברת מפילה כל כלל שמפנה לנושא
// שנטען בסבב קודם.
const existingKeys = new Set();
const existingTopicKeys = new Set();

for (const entity of WRITE_ORDER) {
  let rows = [];
  try {
    rows = await listRecords(entity);
  } catch (e) {
    console.error(`  ✗ ${entity}: ${e.message}`);
    process.exit(1);
  }
  const keyField = NATURAL_KEY[entity];
  for (const r of rows ?? []) {
    if (!r?.[keyField]) continue;
    existingKeys.add(`${entity}:${r[keyField]}`);
    if (entity === 'KnowledgeTopic') existingTopicKeys.add(r[keyField]);
  }
}

const plan = planIngestion({ extraction, existingKeys, existingTopicKeys });

console.log(`\n  ${path.basename(file)}  ·  ב-KB כרגע: ${existingKeys.size} רשומות\n`);
for (const entity of WRITE_ORDER) {
  const n = (plan.toCreate[entity] ?? []).length;
  if (n) console.log(`  + ${entity.padEnd(16)} ${n}`);
}
for (const line of summarize(plan)) console.log(`  ${line}`);

if (!plan.ok) {
  console.log('\n  ⚠ התכנית חסומה. לא בוצעה כתיבה.\n');
  for (const b of plan.blockers) console.log(`    • ${b.message_he}`);
  process.exit(1);
}

if (!doWrite) {
  console.log('\n  ℹ תכנון בלבד. להרצה בפועל: הוסף --write\n');
  process.exit(0);
}

if (!plan.createCount) {
  console.log('\n  אין מה לכתוב — הכול כבר ב-KB.\n');
  process.exit(0);
}

const result = await applyPlan({
  plan,
  deps: { createRecord, listRecords },
  onProgress: ({ entity, done, total }) => {
    process.stdout.write(`\r  כותב ${entity}: ${done}/${total}   `);
  },
});
process.stdout.write('\r' + ' '.repeat(50) + '\r');

console.log('');
for (const line of summarize(plan, result)) console.log(`  ${line}`);

for (const f of result.failed) console.log(`    ✗ ${f.entity}/${f.key}: ${f.error}`);
for (const m of result.mismatches) console.log(`    ✗ ${m.entity}/${m.key} · ${m.field}: ${m.why_he}`);

console.log('');
process.exit(result.ok ? 0 : 1);
