/**
 * בדיקת שלמות מודולים.
 *
 * ## למה זו הבדיקה החשובה ביותר בקובץ הזה
 * `extractFromChunk` רצה בפרודקשן וזרקה `EXTRACTION_SYSTEM_PROMPT is
 * not defined`: היא הועברה בין מודולים בריפקטור, והאימפורטים שלה
 * נשארו מאחור. 947 קריאות נכשלו.
 *
 * 253 בדיקות עברו באותו רגע. כולן ייבאו את הפונקציות שהן בדקו —
 * אבל אף אחת לא ייבאה את **כל** המודולים, ולכן קובץ עם אימפורט
 * חסר יכול היה לשבת שם שלם ומקולקל.
 *
 * הבדיקה הזו מייבאת כל מודול. היא לא בודקת התנהגות; היא בודקת
 * שהקוד בכלל טוען. זה הרף שאי-אפשר לרדת מתחתיו.
 *
 * ⚠ מודולים שנשענים על `@/` (קוד דפדפן בלבד) אינם נפתרים ב-node
 * ולכן מדולגים במפורש — עם רשימה גלויה, כדי שהדילוג לא יגדל בשקט.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = 'src/lib/medscan';

/** מודולים שמייבאים קוד דפדפן ולכן אינם נטענים ב-node. */
const BROWSER_ONLY = new Set([
  'llmAdapter.js',
  'knowledge/bookStore.js',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.js') && !entry.name.includes('.test.')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).sort();
let pass = 0, fail = 0, skipped = 0;

console.log('\nשלמות מודולים\n');

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);

  if (BROWSER_ONLY.has(rel)) {
    skipped += 1;
    console.log(`  – ${rel} (קוד דפדפן — מדולג במפורש)`);
    continue;
  }

  try {
    const mod = await import(pathToFileURL(path.resolve(file)).href);
    assert.ok(mod && typeof mod === 'object', 'המודול לא החזיר ייצוא');
    pass += 1;
    console.log(`  ✓ ${rel}`);
  } catch (e) {
    fail += 1;
    console.log(`  ✗ ${rel}\n      ${e.message.split('\n')[0]}`);
  }
}

/* ── הבדל בין "לא נטען" ל"נטען אבל חסר לו משהו" ──────────────────── */

// מודול יכול להיטען בהצלחה ועדיין להתפוצץ בזמן ריצה, אם המזהה
// החסר נמצא בתוך גוף פונקציה. לכן הקריאות עצמן נבדקות בקבצי
// הבדיקה הייעודיים — כאן רק הטעינה.

console.log(`\n  ${pass} נטענו · ${skipped} דולגו · ${fail} נכשלו\n`);
process.exit(fail > 0 ? 1 : 0);
