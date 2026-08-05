/**
 * בדיקת שלמות מודולים.
 *
 * ## למה זו הבדיקה החשובה ביותר כאן
 * `extractFromChunk` רצה בפרודקשן וזרקה `EXTRACTION_SYSTEM_PROMPT is
 * not defined`: היא הועברה בין מודולים בריפקטור, והאימפורטים שלה
 * נשארו מאחור. 947 קריאות נכשלו.
 *
 * 253 בדיקות עברו באותו רגע. כולן ייבאו את הפונקציות שהן בדקו —
 * אבל אף אחת לא ייבאה את **כל** המודולים, ולכן קובץ עם אימפורט
 * חסר יכול היה לשבת שם שלם ומקולקל.
 *
 * הבדיקה הזו מייבאת כל מודול. היא אינה בודקת התנהגות; היא בודקת
 * שהקוד בכלל טוען. זה הרף שאי-אפשר לרדת מתחתיו.
 *
 * ה-alias `@/` נפתר דרך scripts/aliasResolve.mjs, ו-`@/api/base44Client`
 * מוחלף בבדל. לכן **כל** המודולים נטענים כאן, כולל שכבת ה-I/O —
 * מודול שלא ניתן לטעון בבדיקה הוא מודול שלא נבדק.
 *
 * הרצה:
 *   node --import ./scripts/aliasLoader.mjs src/lib/medscan/imports.test.mjs
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = 'src/lib/medscan';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.js') && !entry.name.includes('.test.')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).sort();
let pass = 0, fail = 0;
const failures = [];

console.log('\nשלמות מודולים\n');

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  try {
    const mod = await import(pathToFileURL(path.resolve(file)).href);
    assert.ok(mod && typeof mod === 'object', 'המודול לא החזיר ייצוא');
    pass += 1;
  } catch (e) {
    fail += 1;
    failures.push([rel, e.message.split('\n')[0]]);
  }
}

for (const [rel, msg] of failures) console.log(`  ✗ ${rel}\n      ${msg}`);
if (!failures.length) console.log(`  ✓ כל ${pass} המודולים נטענים`);

/* ── מודול שנטען עדיין יכול להתפוצץ בזמן ריצה ─────────────────────── */

// מזהה חסר בתוך גוף פונקציה אינו מתגלה בטעינה. לכן הפונקציות
// שנקראות בפרודקשן נבדקות בקבצי הבדיקה הייעודיים, עם בדלים —
// ראה extractFromChunk.test.mjs, שנולד בדיוק מהכשל הזה.

console.log(`\n  ${pass} נטענו · ${fail} נכשלו\n`);
process.exit(fail > 0 ? 1 : 0);
