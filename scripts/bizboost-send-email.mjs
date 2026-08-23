#!/usr/bin/env node
/**
 * BizBoost email outreach — דורש Gmail App Password ב-.env
 *
 * הגדרה:
 *   GMAIL_USER=drmarktzone@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *
 * שימוש:
 *   node scripts/bizboost-send-email.mjs --dry-run
 *   node scripts/bizboost-send-email.mjs --limit=5
 *
 * ברירת מחדל: dry-run (לא שולח). בלי App Password — יוצא עם הודעת שגיאה.
 * אזהרה: דיוור קר המוני עלול להפר מדיניות Gmail / חוק ספאם.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

loadDotEnv();

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--send');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 20;

const user = process.env.GMAIL_USER || 'drmarktzone@gmail.com';
const pass = process.env.GMAIL_APP_PASSWORD || '';

const { prospectsWithContact } = await import('../src/bizboost/data/prospectsCatalog.js');
const { buildOutreachBatch } = await import('../src/bizboost/lib/outreachEngine.js');

const batch = buildOutreachBatch(prospectsWithContact())
  .filter((m) => m.hasEmail)
  .slice(0, limit);

console.log(`BizBoost email sender`);
console.log(`From: ${user}`);
console.log(`Mode: ${dryRun ? 'DRY-RUN (לא נשלח)' : 'SEND'}`);
console.log(`Recipients with email: ${batch.length}`);
console.log('');

if (!batch.length) {
  console.log('אין יעדים עם אימייל ברשימה הנוכחית.');
  process.exit(0);
}

for (const m of batch) {
  console.log(`- ${m.name} <email on file> | ${m.emailSubject}`);
}

if (dryRun) {
  console.log('\nלהפעלה אמיתית:');
  console.log('1. צור App Password ב-Google Account → Security');
  console.log('2. הוסף ל-.env.local: GMAIL_APP_PASSWORD=...');
  console.log('3. הרץ: node scripts/bizboost-send-email.mjs --send --limit=5');
  console.log('\nהסוכן בענן לא יכול לשלוח בשמך בלי הסיסמה הזו — ואל תדביק אותה בצ׳אט.');
  process.exit(0);
}

if (!pass) {
  console.error('חסר GMAIL_APP_PASSWORD ב-.env.local — לא שולחים.');
  process.exit(1);
}

console.error(`
שליחה אמיתית דורשת חבילת nodemailer.
התקן מקומית: npm i nodemailer
ואז הרחב את הסקריפט — או השתמש ב-mailto מ-/bizboost/outreach.

כרגע --send חסום עד שתאשר ותתקין SMTP מקומית (לא מהענן).
`);
process.exit(2);
