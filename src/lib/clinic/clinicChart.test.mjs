/**
 * Clinic chart helpers — coding, exam tokens, workup start/end.
 * node src/lib/clinic/clinicChart.test.mjs
 */
import { searchIcd, findIcd, manualIcdEntry, toChartDiagnosis, ICD_CATALOG } from './icdCatalog.js';
import { examToSignals, vitalsToSignals, mergeChartFindings } from './physicalExam.js';
import { toggleOrder, LAB_ORDERS } from './referralOrders.js';
import { buildWorkupGuide } from '../medscan/doctorped/workupGuide.js';

let pass = 0;
let fail = 0;
const t = (n, fn) => {
  try { fn(); console.log('  ✓ ' + n); pass++; }
  catch (e) { console.log('  ✗ ' + n + '\n      ' + e.message); fail++; }
};
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

console.log('\nClinic chart — ICD / exam / workup\n');

t('קטלוג הקידוד כולל חום בשתי מערכות ולא ממציא אבחנת מנוע', () => {
  assert(ICD_CATALOG.length >= 40);
  const fever = findIcd('R50.9');
  assert(fever && fever.icd9 === '780.60');
  const hit = searchIcd('חום');
  assert(hit.some((r) => r.icd10 === 'R50.9'));
  const dx = toChartDiagnosis(fever);
  assert(dx.engine_assigned === false);
  assert(dx.source === 'physician');
});

t('קוד ידני נכנס רק אם יש מספר', () => {
  assert(manualIcdEntry({}).ok === false);
  const made = manualIcdEntry({ icd10: 'j06.9', label_he: 'אורי' });
  assert(made.ok);
  assert(made.row.icd10 === 'J06.9');
  assert(made.row.source === 'physician_manual');
});

t('בדיקה מובנית מזריקה אסימונים למנועים הקיימים', () => {
  const sig = examToSignals({ general: 'general.lethargy', skin: 'skin.petechiae' });
  assert(sig.tokens.includes('lethargy'));
  assert(sig.tokens.includes('petechiae'));
  assert(sig.features.lethargy === true);
  assert(sig.features.petechiae === true);
});

t('חום מתועד במדדים הופך לאסימון fever בלי לאבחן', () => {
  const v = vitalsToSignals({ temp: 38.6 });
  assert(v.tokens.includes('fever'));
  const merged = mergeChartFindings({
    findings: ['cough'],
    exam: { lungs: 'lungs.distress' },
    vitals: { temp: 39 },
  });
  assert(merged.findings.includes('cough'));
  assert(merged.findings.includes('fever'));
  assert(merged.findings.includes('difficulty breathing'));
});

t('הזמנת מעבדה מתחלפת בלי לשכפל', () => {
  const once = toggleOrder([], LAB_ORDERS[0].id);
  assert(once.length === 1);
  const twice = toggleOrder(once, LAB_ORDERS[0].id);
  assert(twice.length === 0);
});

t('מסלול חום מהמאגר יש לו התחלה, שלב נוכחי וסוף', () => {
  const start = buildWorkupGuide({ query: 'fever חום', age_days: 800 });
  assert(start.ok, start.message_he);
  assert(start.is_start === true);
  assert(start.start_step_id);
  assert(Array.isArray(start.actions_he));
  if (start.next_branches?.length) {
    const nxt = buildWorkupGuide({
      query: 'fever חום',
      age_days: 800,
      currentStepId: start.next_branches[0].next_step_id,
    });
    assert(nxt.ok);
    assert(nxt.current_step_id === start.next_branches[0].next_step_id);
  }
});

t('אין מינון בקטלוג ההפניות', () => {
  const blob = JSON.stringify(LAB_ORDERS);
  assert(!/mg\/kg|NAC|nac /i.test(blob));
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
process.exit(0);
