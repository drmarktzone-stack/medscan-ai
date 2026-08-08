#!/usr/bin/env node
/**
 * אימות קריאה-חוזרת מול המסד החי.
 *
 * הכתיבה עצמה מתבצעת דרך ערוץ מאומת (MCP או ממשק Base44), ולא מכאן.
 * הכלי הזה עונה על השאלה שאחריה: **האם מה שנכתב הוא מה שהתכוונו לכתוב.**
 *
 * הוא נדרש משום ששכבת האחסון יכולה להחזיר הצלחה ולהשמיט שדה בשקט —
 * זה קרה בפועל עם source_edition — ומשום שהעברה ידנית של רשומות
 * דרך ערוץ הכתיבה יכולה לאבד טקסט. בטעינת פרק 536 הכלי תפס שני
 * שדות action_he שאיבדו סיומת בהעתקה; בלעדיו הם היו נכנסים למסד.
 *
 * ההשוואה היא על VERIFY_FIELDS בלבד — שדות הזיהוי, התוכן הקליני,
 * העוגן, סטטוס האימות, וכן שדות הייחוס (פרק, עמודים) ושדות
 * הבטיחות (חלון הגיל בדגל אדום). השמטה של אלה אינה נראית לעין
 * ברשומה שנראית תקינה.
 *
 * שימוש:
 *   node scripts/verifyKb.mjs <extraction.json>
 *   node scripts/verifyKb.mjs <extraction.json> --base https://base44.app
 *
 * יציאה 0 = הכול תואם. יציאה 1 = יש אי-התאמה, כלומר יש מה לתקן.
 */
import fs from 'node:fs';
import path from 'node:path';
import { VERIFY_FIELDS, NATURAL_KEY, WRITE_ORDER, toKbRecords } from '../src/lib/medscan/ingestion/kbRecords.js';

const APP_ID = process.env.BASE44_APP_ID || '6a44d05c8195d3fd459fae15';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  console.error('שימוש: node scripts/verifyKb.mjs <extraction.json>');
  process.exit(2);
}

const base = `${arg('--base', 'https://base44.app')}/api/apps/${APP_ID}/entities`;
const extraction = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const expected = toKbRecords(extraction);

/** השוואה סלחנית לטיפוס, קפדנית לתוכן. null ו-undefined נחשבים ריקים. */
const norm = (v) =>
  v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

let checked = 0;
const problems = [];

console.log(`\n  אימות ${path.basename(file)} מול ${arg('--base', 'https://base44.app')}\n`);

for (const entity of WRITE_ORDER) {
  const want = expected[entity] || [];
  if (!want.length) continue;

  const res = await fetch(`${base}/${entity}?limit=500`);
  if (!res.ok) {
    problems.push({ entity, key: '—', field: '—', note: `קריאה נכשלה: ${res.status}` });
    console.log(`  ✗ ${entity}: קריאה נכשלה (${res.status})`);
    continue;
  }
  const live = await res.json();
  const nk = NATURAL_KEY[entity];
  const byKey = new Map(live.map((r) => [r[nk], r]));

  let entityProblems = 0;
  for (const rec of want) {
    const got = byKey.get(rec[nk]);
    if (!got) {
      problems.push({ entity, key: rec[nk], field: '—', note: 'לא נמצאה במסד' });
      console.log(`  ✗ ${entity}/${rec[nk]} — לא נמצאה במסד`);
      entityProblems++;
      continue;
    }
    for (const f of VERIFY_FIELDS[entity]) {
      checked++;
      const a = norm(rec[f]);
      const b = norm(got[f]);
      if (a === b) continue;
      entityProblems++;
      problems.push({ entity, key: rec[nk], field: f, expected: a, actual: b });
      console.log(`  ✗ ${entity}/${rec[nk]} · ${f}`);
      console.log(`      צפוי: ${a.slice(0, 160)}${a.length > 160 ? '…' : ''}`);
      console.log(`      במסד: ${b.slice(0, 160)}${b.length > 160 ? '…' : ''}`);
    }
  }
  if (!entityProblems) console.log(`  ✓ ${entity}: ${want.length} רשומות תואמות`);
}

console.log(`\n  שדות שנבדקו: ${checked}  ·  אי-התאמות: ${problems.length}\n`);

if (problems.length) {
  console.log('  ⚠ רשומה שאינה תואמת אינה בת-אימות מול המקור. יש לתקן לפני חתימה כ-verified.\n');
  process.exit(1);
}
