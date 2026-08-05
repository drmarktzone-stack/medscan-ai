/**
 * מריץ את כל הבדיקות.
 *
 * הרצה:  node --import ./scripts/aliasLoader.mjs scripts/test.mjs
 *
 * ה-loader נטען פעם אחת ומועבר לכל תת-תהליך, כדי שגם מודולים
 * שנוגעים בשכבת ה-I/O ייבדקו — ולא רק אלה שנוח לטעון.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.test.mjs')) out.push(p);
  }
  return out;
}

const files = walk('src/lib/medscan').sort();
let passed = 0;
const failed = [];

for (const file of files) {
  const name = file.replace('src/lib/medscan/', '');
  try {
    execFileSync('node', ['--import', './scripts/aliasLoader.mjs', file], { stdio: 'pipe' });
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed.push([name, String(e.stdout ?? '')]);
    console.log(`  ✗ ${name}`);
  }
}

if (failed.length) {
  console.log('\n──────── פירוט הכשלים ────────');
  for (const [name, out] of failed) {
    console.log(`\n### ${name}`);
    console.log(out.split('\n').filter((l) => l.includes('✗')).join('\n') || out.slice(-800));
  }
}

console.log(`\n${passed} קבצי בדיקה עברו · ${failed.length} נכשלו\n`);
process.exit(failed.length ? 1 : 0);
