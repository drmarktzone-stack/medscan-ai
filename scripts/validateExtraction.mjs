/**
 * מאמת חילוץ לפני כתיבה ל-KB.
 *
 * זהו אותו validateExtraction שמשמש את מסלול ה-LLM באפליקציה. החילוץ
 * שנעשה ידנית עובר דרכו בדיוק כמו חילוץ אוטומטי — פריט בלי ציטוט-מקור
 * נופל, פריט עם מינון בכלל נופל, וכן הלאה. הנתיב שונה, החוזה זהה.
 *
 * שימוש:  node scripts/validateExtraction.mjs <extraction.json> [--emit out.json]
 */

import fs from 'node:fs';
import { validateExtraction } from '../src/lib/medscan/ingestion/extractionCore.js';

const [file, ...rest] = process.argv.slice(2);
if (!file) {
  console.error('usage: node scripts/validateExtraction.mjs <extraction.json> [--emit out.json]');
  process.exit(2);
}

const emitIdx = rest.indexOf('--emit');
const emitTo = emitIdx >= 0 ? rest[emitIdx + 1] : null;

const extraction = JSON.parse(fs.readFileSync(file, 'utf8'));
const { kept, problems, dropped } = validateExtraction(extraction);

const LISTS = ['topics', 'lab_patterns', 'red_flags', 'clinical_rules', 'associations'];
const count = (o) => LISTS.reduce((n, k) => n + (o[k]?.length ?? 0), 0);

console.log('\nאימות חילוץ\n');
for (const k of LISTS) {
  const inCount = extraction[k]?.length ?? 0;
  const outCount = kept[k]?.length ?? 0;
  const mark = inCount === outCount ? '✓' : '⚠';
  console.log(`  ${mark} ${k.padEnd(16)} ${String(outCount).padStart(3)} / ${inCount}`);
}
console.log(`\n  סה"כ נשמרים: ${count(kept)}  ·  נפלו: ${dropped?.length ?? 0}`);

if (dropped?.length) {
  console.log('\n  פריטים שנפלו:');
  for (const d of dropped) console.log(`    ✗ ${d.kind}/${d.key}: ${d.why_he}`);
}
if (problems?.length) {
  console.log('\n  הערות:');
  for (const p of problems) console.log(`    · ${p.kind}/${p.key}: ${p.why_he}`);
}

// gaps_he ריק בפרק ארוך הוא סימן אזהרה בפני עצמו — ראה extractionSchema
if (!extraction.gaps_he?.length) {
  console.log('\n  ⚠ gaps_he ריק. בקטע ארוך זה כמעט תמיד אומר שמשהו הושלם במקום לדווח עליו.');
}

if (emitTo) {
  fs.writeFileSync(emitTo, JSON.stringify(kept, null, 0));
  console.log(`\n  נכתב: ${emitTo}`);
}
console.log('');

process.exit(dropped?.length ? 1 : 0);
