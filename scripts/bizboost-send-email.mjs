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
 *   node scripts/bizboost-send-email.mjs --enterprise --dry-run
 *   node scripts/bizboost-send-email.mjs --enterprise --limit=10
 *
 * ברירת מחדל: dry-run + enterprise (חברות גדולות, לא Facebook)
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
const enterprise = process.argv.includes('--enterprise') || !process.argv.includes('--smb');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 30;

const user = process.env.GMAIL_USER || 'drmarktzone@gmail.com';
const pass = process.env.GMAIL_APP_PASSWORD || '';

const { buildOutreachBatch, buildEnterpriseOutreachBatch } = await import('../src/bizboost/lib/outreachEngine.js');

let batch;
if (enterprise) {
  const { enterpriseWithEmail } = await import('../src/bizboost/data/enterpriseProspects.js');
  batch = buildEnterpriseOutreachBatch(enterpriseWithEmail()).slice(0, limit);
} else {
  const { prospectsWithContact } = await import('../src/bizboost/data/prospectsCatalog.js');
  batch = buildOutreachBatch(prospectsWithContact())
    .filter((m) => m.hasEmail)
    .slice(0, limit);
}

console.log(`BizBoost email sender`);
console.log(`From: ${user}`);
console.log(`Target: ${enterprise ? 'ENTERPRISE (חברות גדולות)' : 'SMB (עסקים קטנים)'}`);
console.log(`Mode: ${dryRun ? 'DRY-RUN (לא נשלח)' : 'SEND'}`);
console.log(`Recipients: ${batch.length}`);
console.log('');

if (!batch.length) {
  console.log('אין יעדים עם אימייל.');
  process.exit(0);
}

for (const m of batch) {
  console.log(`---`);
  console.log(`To: ${m.email || '(no email)'} — ${m.name}`);
  console.log(`Subject: ${m.emailSubject}`);
  console.log(m.emailBody.slice(0, 200) + '...');
  console.log('');
}

if (dryRun) {
  console.log('\nלהפעלה אמיתית (מקומית בלבד):');
  console.log('1. צור App Password ב-Google Account → Security');
  console.log('2. הוסף ל-.env.local: GMAIL_APP_PASSWORD=...');
  console.log('3. הרץ: node scripts/bizboost-send-email.mjs --enterprise --send --limit=5');
  console.log('\nאו: פתח /bizboost/outreach → לשונית "חברות גדולות" → לחץ "שלח מייל" על כל אחת.');
  console.log('פייסבוק — רק אחרי שסיימת את המיילים.');
  process.exit(0);
}

if (!pass) {
  console.error('חסר GMAIL_APP_PASSWORD ב-.env.local — לא שולחים.');
  process.exit(1);
}

console.error(`
שליחה אמיתית דורשת nodemailer מקומית.
התקן: npm i nodemailer
הרחב את הסקריפט — או השתמש ב-mailto מ-/bizboost/outreach.

כרגע --send חסום עד SMTP מקומי (לא מהענן).
`);
process.exit(2);
