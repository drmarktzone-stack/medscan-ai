/**
 * טוען רשומות KB שנפלטו מ-emitKbRecords אל שכבת הישויות.
 * ⚠ כל הרשומות נכתבות בסטטוס draft_needs_verification — הכתיבה כאן
 * אינה מאמתת דבר, היא רק מעבירה טיוטות למסך האימות.
 */
import fs from 'node:fs';
const url = process.env.VITE_BASE44_BACKEND_URL, app = process.env.VITE_BASE44_APP_ID;
const dir = process.argv[2];
const ORDER = ['KnowledgeTopic', 'LabPattern', 'RedFlag', 'ClinicalRule', 'Association'];
let ok = 0, fail = 0;
for (const ent of ORDER) {
  const p = `${dir}/${ent}.json`;
  if (!fs.existsSync(p)) continue;
  for (const rec of JSON.parse(fs.readFileSync(p, 'utf8'))) {
    const r = await fetch(`${url}/api/apps/${app}/entities/${ent}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec),
    });
    if (r.ok) ok++;
    else { fail++; console.log('  ✗', ent, Object.values(rec)[0], r.status, (await r.text()).slice(0, 180)); }
  }
  console.log(`  ${ent.padEnd(16)} ✓`);
}
console.log(`\nנכתבו ${ok} · נכשלו ${fail}`);
