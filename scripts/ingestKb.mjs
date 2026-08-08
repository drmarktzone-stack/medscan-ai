/**
 * MedScan — CLI לטעינת חילוץ ל-KB
 *
 * מריץ את אותו צינור שהאפליקציה מריצה (`ingestExtraction.js`) —
 * אותו אימות, אותו מיפוי, אותן בדיקות. הנתיב שונה, החוזה זהה.
 *
 * ## על ההרשאות
 * קריאת ישויות פתוחה, ולכן שלב התכנון רץ כאן במלואו: הוא יודע מה
 * כבר קיים ב-KB ומה יידלג. **כתיבה דורשת אדמין מאומת** — ולכן
 * ה-CLI אינו כותב. הוא פולט אצווה מאומתת, והכתיבה נעשית בנתיב
 * מאומת (מסך האדמין באפליקציה, או כלי MCP של בעל האפליקציה).
 *
 * זו אינה מגבלה טכנית שיש לעקוף — זו הנקודה. הצינור הקודם כתב
 * ללא אימות כלל, וזה בדיוק מה שאיפשר לכל אחד להזריק דגל אדום.
 *
 * ## ⚠ אזהרה: ל-sandbox יש גישה שעוקפת RLS
 * קריאות HTTP מתוך סביבת הריצה של Base44 **עוקפות את נעילות
 * הכתיבה**. POST מכאן יחזיר 200 גם כשאותה קריאה מבחוץ מחזירה 403.
 *
 * משמעות מעשית: **אין לבדוק סכמה או הרשאות על ידי כתיבה
 * למסד החי מכאן.** בדיקה כזו כבר יצרה שלוש רשומות זבל
 * בישויות קליניות (DoseRecord, NelsonChapter, Protocol) שלא ניתן
 * היה למחוק — DELETE דווקא כן נחסם. לבדיקת סכמה יש לשלוח
 * רשומה חסרת שדות חובה ולקרוא את ה-422, לעולם לא רשומה תקינה.
 *
 * בדיקת הרשאות אמיתית חייבת לרוץ מעמדה חיצונית.
 *
 * שימוש:
 *   node scripts/ingestKb.mjs <extraction.json>              # תכנון בלבד
 *   node scripts/ingestKb.mjs <extraction.json> --emit <dir> # + פליטת אצווה
 *   node scripts/ingestKb.mjs <extraction.json> --json       # פלט מכונה
 */

import fs from 'node:fs';
import path from 'node:path';
import { planIngestion, summarize } from '../src/lib/medscan/ingestion/ingestExtraction.js';
import { NATURAL_KEY, WRITE_ORDER } from '../src/lib/medscan/ingestion/kbRecords.js';

const argv = process.argv.slice(2);
const file = argv[0];
if (!file) {
  console.error('usage: node scripts/ingestKb.mjs <extraction.json> [--emit <dir>] [--json]');
  process.exit(2);
}
const emitIdx = argv.indexOf('--emit');
const emitDir = emitIdx >= 0 ? argv[emitIdx + 1] : null;
const asJson = argv.includes('--json');

const BASE = process.env.VITE_BASE44_BACKEND_URL;
const APP = process.env.VITE_BASE44_APP_ID;

/** טוען את המפתחות הקיימים ב-KB. קריאה בלבד — אינה דורשת אימות. */
async function loadExisting() {
  const keys = new Set();
  const topicKeys = new Set();
  if (!BASE || !APP) return { keys, topicKeys, reachable: false };

  for (const entity of WRITE_ORDER) {
    const field = NATURAL_KEY[entity];
    try {
      const r = await fetch(`${BASE}/api/apps/${APP}/entities/${entity}?limit=5000`);
      if (!r.ok) continue;
      const rows = await r.json();
      for (const row of rows ?? []) {
        const k = row?.[field];
        if (!k) continue;
        keys.add(`${entity}:${k}`);
        if (entity === 'KnowledgeTopic') topicKeys.add(k);
      }
    } catch {
      // ישות שאינה נגישה נחשבת ריקה. התוצאה: פחות דילוגים על
      // כפילויות, לא כתיבה שגויה — ולכן זו כשל בטוח.
    }
  }
  return { keys, topicKeys, reachable: true };
}

const extraction = JSON.parse(fs.readFileSync(file, 'utf8'));
const { keys, topicKeys, reachable } = await loadExisting();

const plan = planIngestion({ extraction, existingKeys: keys, existingTopicKeys: topicKeys });

if (asJson) {
  console.log(JSON.stringify({
    ok: plan.ok,
    createCount: plan.createCount,
    droppedCount: plan.droppedCount,
    duplicates: plan.duplicates.length,
    danglingAnchors: plan.danglingAnchors,
    blockers: plan.blockers,
    warnings: plan.warnings,
  }, null, 2));
} else {
  console.log(`\nתכנון טעינה — ${path.basename(file)}\n`);
  if (!reachable) console.log('  ⚠ ה-KB אינו נגיש. התכנון רץ בלי ידיעה מה כבר קיים.\n');

  for (const entity of WRITE_ORDER) {
    const n = (plan.toCreate[entity] ?? []).length;
    const inFile = (plan.records[entity] ?? []).length;
    if (!inFile) continue;
    const mark = n === inFile ? '✓' : '·';
    console.log(`  ${mark} ${entity.padEnd(16)} ${String(n).padStart(3)} / ${inFile}`);
  }

  console.log('');
  for (const line of summarize(plan)) console.log(`  ${line}`);

  if (plan.danglingAnchors.length) {
    console.log('\n  עוגנים תלויים:');
    for (const d of plan.danglingAnchors.slice(0, 20)) {
      console.log(`    ✗ ${d.entity}/${d.key} → ${d.anchor}`);
    }
    if (plan.danglingAnchors.length > 20) console.log(`    … ועוד ${plan.danglingAnchors.length - 20}`);
  }

  const dropped = plan.problems.filter((p) => p.severity === 'drop');
  if (dropped.length) {
    console.log('\n  פריטים שנדחו באימות:');
    for (const d of dropped) console.log(`    ✗ ${d.kind}/${d.key}: ${d.why_he}`);
  }

  if (plan.duplicates.length) {
    const inKb = plan.duplicates.filter((d) => d.where === 'kb').length;
    const inBatch = plan.duplicates.filter((d) => d.where === 'batch').length;
    console.log(`\n  כפילויות: ${inKb} כבר ב-KB · ${inBatch} בתוך הקובץ`);
  }
}

if (emitDir && plan.ok) {
  fs.mkdirSync(emitDir, { recursive: true });
  let total = 0;
  for (const entity of WRITE_ORDER) {
    const rows = plan.toCreate[entity] ?? [];
    if (!rows.length) continue;
    fs.writeFileSync(path.join(emitDir, `${entity}.json`), JSON.stringify(rows, null, 0));
    total += rows.length;
  }
  fs.writeFileSync(path.join(emitDir, '_plan.json'), JSON.stringify({
    source_file: path.basename(file),
    created_at_note: 'חותמת זמן נוספת ע"י הכותב, לא כאן',
    provenance_he: plan.provenance_he,
    counts: Object.fromEntries(WRITE_ORDER.map((e) => [e, (plan.toCreate[e] ?? []).length])),
    warnings: plan.warnings,
    gaps_he: plan.gaps_he,
    dosing_mentions_he: plan.dosing_mentions_he,
  }, null, 2));
  if (!asJson) console.log(`\n  נפלטו ${total} רשומות → ${emitDir}`);
}

if (!asJson) {
  if (!plan.ok) {
    console.log('\n  ✗ האצווה חסומה. לא נפלט דבר.\n');
  } else {
    console.log('\n  ℹ הכתיבה עצמה דורשת אדמין מאומת ואינה מתבצעת מכאן.\n');
  }
}

process.exit(plan.ok ? 0 : 1);
