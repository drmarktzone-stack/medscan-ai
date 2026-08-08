/**
 * MedScan — בדיקות אינווריאנטים ארכיטקטוניים
 *
 * הבדיקות כאן אינן בודקות התנהגות אלא **מבנה**. הן קיימות כדי
 * שאינווריאנט שתוקן לא ייסוג בשקט בשינוי הבא.
 *
 * כל אחת מהן מתעדת החלטה שהתקבלה במפורש — ולא העדפת סגנון.
 *
 * הרצה:  npm test
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const GATE_DIR = join('src', 'lib', 'medscan');

let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed += 1; console.log(`  ✓ ${name}`); }
  catch (e) { failed += 1; failures.push({ name, error: e.message }); console.log(`  ✗ ${name}\n      ${e.message}`); }
}
function assert(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
function section(t) { console.log(`\n${t}`); }

/** כל קובצי המקור, רקורסיבית. */
function sourceFiles(dir = SRC) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** שורות קוד בלבד — הערות אינן הפרה. */
function codeLines(text) {
  return text
    .split('\n')
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => {
      const t = line.trim();
      return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
    });
}

section('אינווריאנטים ארכיטקטוניים');

test('אין קריאה ישירה ל-Core.InvokeLLM מחוץ ל-src/lib/medscan/', () => {
  // ההחלטה: נקודת אכיפה יחידה. המתאם מוודא סכמת פלט חובה,
  // משבית add_context_from_internet, ומרכז ניטור. קריאה ישירה
  // עוקפת את שלושתם בשקט.
  const offenders = [];
  for (const file of sourceFiles()) {
    const rel = relative(ROOT, file);
    if (rel.startsWith(GATE_DIR)) continue;
    for (const { line, n } of codeLines(readFileSync(file, 'utf8'))) {
      if (line.includes('Core.InvokeLLM')) offenders.push(`${rel}:${n}`);
    }
  }
  assert(
    offenders.length === 0,
    `נמצאו ${offenders.length} קריאות ישירות — יש לנתב דרך createInvokeLLM / createVisionInvokeLLM:\n      ${offenders.join('\n      ')}`
  );
});

test('אף קריאת LLM אינה מפעילה add_context_from_internet', () => {
  // מקור-האמת הוא ה-FACT BLOCK והתמונה. הקשר מהאינטרנט מכניס
  // טענות שאינן ניתנות לעקיבה לאף אחד משניהם.
  const offenders = [];
  for (const file of sourceFiles()) {
    const rel = relative(ROOT, file);
    for (const { line, n } of codeLines(readFileSync(file, 'utf8'))) {
      if (/add_context_from_internet\s*:\s*true/.test(line)) offenders.push(`${rel}:${n}`);
    }
  }
  assert(offenders.length === 0, `הקשר-אינטרנט מופעל ב:\n      ${offenders.join('\n      ')}`);
});

test('המתאם דורש סכמת פלט ונכשל רועש בלעדיה', () => {
  const src = readFileSync(join(SRC, 'lib/medscan/llmAdapter.js'), 'utf8');
  const throwsOnMissingSchema = (src.match(/if \(!schema\) \{[\s\S]{0,400}?throw new Error/g) ?? []).length;
  assert(
    throwsOnMissingSchema >= 2,
    `שני המתאמים חייבים לזרוק בהיעדר schema; נמצאו ${throwsOnMissingSchema}`
  );
});

test('המתאם כופה השבתת אינטרנט ואינו נסמך על הקורא', () => {
  const src = readFileSync(join(SRC, 'lib/medscan/llmAdapter.js'), 'utf8');
  assert(
    /add_context_from_internet:\s*false/.test(src),
    'המתאם אינו כופה add_context_from_internet: false'
  );
});

console.log(`\n${'─'.repeat(60)}`);
console.log(`עברו: ${passed}  ·  נכשלו: ${failed}`);
if (failed) {
  console.log('\nכשלים:');
  for (const f of failures) console.log(`  · ${f.name}\n      ${f.error}`);
  process.exit(1);
}
console.log('כל הבדיקות עברו.');
