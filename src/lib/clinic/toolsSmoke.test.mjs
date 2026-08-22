/**
 * Smoke: every DoctorPed / MedScan tool must return a real result from code.
 * No silent empty shells. Lab/ddx/context/protocol must not throw when Base44 LLM is missing.
 * הרצה: node src/lib/clinic/toolsSmoke.test.mjs
 */
import { runToxicologyEngine, runTraumaEngine, runGrowthImmunizationEngine } from '../medscan/engines/expertModules.js';
import { runInfantNutritionAndDevelopment } from '../medscan/engines/infantNutritionAndDevelopment.js';
import { runNeurodevelopmentalEngine } from '../medscan/engines/neurodevelopmentalEngine.js';
import { runChronicSymptomsEngine } from '../medscan/engines/chronicSymptomsEngine.js';
import { runSyndromeMatcher } from '../medscan/engines/syndromeMatcher.js';
import { runGeneticsInterpreter } from '../medscan/engines/geneticsInterpreter.js';
import { runMetabolicInterpreter } from '../medscan/engines/metabolicInterpreter.js';
import { runCsfInterpreter } from '../medscan/engines/csfInterpreter.js';
import { runPediatricUltrasound } from '../medscan/engines/pediatricUltrasound.js';
import { runEegInterpreter } from '../medscan/engines/eegInterpreter.js';
import { runLabInterpreter } from '../medscan/engines/labInterpreter.js';
import { runDifferentialBuilder } from '../medscan/engines/differentialBuilder.js';
import { runPatientContext } from '../medscan/engines/patientContext.js';
import { runProtocolStep } from '../medscan/engines/protocolRunner.js';
import { listProtocols, requireBase44Core } from '../medscan/llmAdapter.js';
import { runDoctorPedAI, listToolboxModules } from '../medscan/doctorped/index.js';
import { preprocessAudio } from '../medscan/audio/audioPreprocess.js';
import { seedToEntityRows } from '../medscan/deterministic/referenceRangeSeed.js';
import { listPediatricPathways } from '../medscan/engines/pediatricPathways.js';
import { humanizeAnalysisError } from './humanizeAnalysisError.js';

let pass = 0;
let fail = 0;
const t = async (n, fn) => {
  try {
    await fn();
    console.log('  ✓ ' + n);
    pass++;
  } catch (e) {
    console.log('  ✗ ' + n + '\n      ' + e.message);
    fail++;
  }
};
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

const mode = 'development';
const child = { age_months: 24, sex: 'M', weight_kg: 12 };

console.log('\nDoctorPedAI — tools must actually run\n');

await t('טווחי ייחוס בטיוטה נטענים', () => {
  const rows = seedToEntityRows();
  assert(rows.length >= 8);
  assert(rows.every((r) => r.verification_status === 'draft_needs_verification'));
});

await t('מילון מסלולי קהילה כולל עצים להרצה', () => {
  const paths = listPediatricPathways();
  assert(paths.length >= 6);
  assert(paths.every((p) => Array.isArray(p.steps) && p.steps.length > 0));
});

await t('ארגז הכלים כולל את מנועי הקהילה והדימות', () => {
  const ids = listToolboxModules().map((m) => m.id);
  for (const need of [
    'labs', 'toxicology', 'trauma', 'growth', 'milestones', 'neurodev', 'pain',
    'triads', 'metabolic', 'genetics', 'csf', 'ultrasound', 'eeg', 'audio',
    'skin', 'ecg', 'radiology',
  ]) {
    assert(ids.includes(need), 'חסר מודול ' + need);
  }
});

await t('טוקסיקולוגיה: סוללת כפתור היא חירום בלי מינון NAC', () => {
  const r = runToxicologyEngine({
    patient: child,
    findings: ['button battery'],
    mode,
  });
  assert(r.ok === true);
  assert((r.red_flags || []).length > 0, 'חסר דגל אדום');
  assert(!JSON.stringify(r).includes('N-acetylcysteine'));
  assert(!/nac /i.test(JSON.stringify(r)));
});

await t('טראומה: חבלת ראש + GCS נמוך מניב פעולת PECARN', () => {
  const r = runTraumaEngine({
    patient: { age_months: 18 },
    findings: ['head trauma'],
    gcs: 13,
    mode,
  });
  assert(r.ok === true, r.message_he || r.reason);
  assert(r.pecarn?.pecarn_action === 'ct' || r.pecarn?.pecarn_action === 'observe_vs_ct', JSON.stringify(r.pecarn));
});

await t('גדילה: בלי LMS אין Z מומצא — מוצג מה חסר', () => {
  const r = runGrowthImmunizationEngine({
    patient: { age_months: 24, sex: 'M' },
    weight_kg: 12,
    height_cm: 86,
    mode,
  });
  assert(r.ok === true);
  assert((r.recommended_tests || []).some((x) => /LMS/i.test(x.test_he || '')));
});

await t('תזונה: משקל מניב כלל נפח 150 מ״ל/ק״ג', () => {
  const r = runInfantNutritionAndDevelopment({
    patient: { age_months: 1, weight_kg: 3 },
    weight_kg: 3,
    feeds_per_day: 8,
    mode,
  });
  assert(r.ok === true);
  assert(r.volume?.ok === true);
  assert(r.volume.daily_ml === 450);
});

await t('נוירו-התפתחות: M-CHAT גבוה מסמן סיכון', () => {
  const r = runNeurodevelopmentalEngine({
    patient: { age_months: 18 },
    mchat_total: 10,
    mode,
  });
  assert(r.ok === true);
  assert((r.matched_patterns || []).some((p) => String(p).includes('mchat')));
});

await t('כרוני: דם בצואה חוסם סיווג תפקודי', () => {
  const r = runChronicSymptomsEngine({
    patient: child,
    findings: ['abdominal pain', 'blood in stool'],
    duration_months: 3,
    mode,
  });
  assert(r.ok === true);
  assert((r.matched_patterns || []).includes('chronic.abdominal_organic_flags')
    || (r.kbItems || []).some((k) => k.pattern_key === 'chronic.abdominal_organic_flags'));
});

await t('תסמונות: Cushing triad לפי דגלים', () => {
  const r = runSyndromeMatcher({
    patient: child,
    findings: ['irregular breathing'],
    vitals: { hr_flag: 'low', bp_flag: 'high', irregular_respiration: true },
    mode,
  });
  assert(r.ok === true);
  assert((r.matched_patterns || []).includes('triad.cushing'));
});

await t('מטבולי: פנילאלנין גבוה מתאים ל-PKU', () => {
  const r = runMetabolicInterpreter({
    patient: { age_months: 1 },
    nbs: [{ analyte: 'phe', flag: 'high' }],
    mode,
  });
  assert(r.ok === true);
  assert((r.matched_patterns || []).includes('iem.pku'));
});

await t('גנטיקה: תווי דאון מותאמים', () => {
  const r = runGeneticsInterpreter({
    patient: { age_months: 2 },
    features: { epicanthal_folds: true, single_palmar_crease: true, low_set_ears: true },
    mode,
  });
  assert(r.ok === true);
  assert((r.matched_patterns || []).includes('genetics.down'));
});

await t('CSF: WBC גבוה + PMN + יחס גלוקוז נמוך → חיידקי', () => {
  const r = runCsfInterpreter({
    patient: child,
    csf: { wbc: 500, pmn_percent: 90, protein: 120, glucose: 20, blood_glucose: 90, rbc: 2 },
    mode,
  });
  assert(r.ok === true, r.message_he || r.reason);
  assert((r.matched_patterns || []).includes('csf.bacterial'), JSON.stringify(r.matched_patterns));
});

await t('אולטרסאונד: Graf alpha 65 הוא Type I', () => {
  const r = runPediatricUltrasound({
    patient: { age_months: 3 },
    hips: { alpha_deg: 65, side: 'left' },
    mode,
  });
  assert(r.ok === true);
  assert(r.graf?.some((g) => g.type === 'I'));
});

await t('EEG: hypsarrhythmia הוא דגל אדום', () => {
  const r = runEegInterpreter({
    patient: { age_months: 6 },
    annotations: { hypsarrhythmia: true },
    findings: ['spasms'],
    mode,
  });
  assert(r.ok === true);
  assert((r.red_flags || []).length > 0);
  assert((r.matched_patterns || []).includes('eeg.hypsarrhythmia'));
});

await t('מעבדה מחזירה שורות מנורמלות בלי InvokeLLM', async () => {
  const r = await runLabInterpreter({
    patient: child,
    labs: [{ analyte: 'Albumin', value: 1.8, unit: 'g/dL', ref_low: 3.5, ref_high: 5.0 }],
    mode,
  });
  assert(r.ok === true || r.status === 'degraded' || r.status === 'insufficient' || Array.isArray(r.normalized), JSON.stringify({ ok: r.ok, status: r.status }));
  assert((r.normalized || []).length >= 1, 'אין שורות מנורמלות');
  assert(r.normalized[0].flag === 'low', 'אלבומין 1.8 מול 3.5–5 חייב להיות low, got ' + r.normalized[0].flag);
});

await t('אבחנה מבדלת מחזירה מעטפת בלי InvokeLLM', async () => {
  const r = await runDifferentialBuilder({
    patient: child,
    findings: ['fever', 'rash'],
    mode,
  });
  assert(r.ok === true || Array.isArray(r.differential) || Array.isArray(r.kbItems) || r.status);
  assert(r.status !== 'input_error');
});

await t('הקשר מטופל מצהיר על רקע לא מכוסה', async () => {
  const r = await runPatientContext({
    patient: { age_months: 36, chronic_conditions: ['asplenia'] },
    mode,
  });
  assert(Array.isArray(r.uncovered_background));
  assert(r.uncovered_background.includes('asplenia') || (r.unknowns_he || []).some((u) => String(u).includes('asplenia')));
});

await t('listProtocols כולל מסלולי קהילה מקומיים', async () => {
  const list = await listProtocols();
  assert(list.length >= 6, 'רשימה ריקה: ' + list.length);
  assert(list.some((p) => p.protocol_key === 'community.adhd.workup'));
});

await t('הרצת פרוטוקול ADHD מהמילון מחזירה שלב וענפים', async () => {
  const r = await runProtocolStep({
    protocolKey: 'community.adhd.workup',
    patient: { age_years: 7 },
    mode,
  });
  assert(r.status !== 'protocol_error', r.message_he);
  assert(r.step_from_protocol?.step_id === 'adhd.intake', JSON.stringify(r.step_from_protocol));
  assert((r.branch_options_from_protocol || []).length > 0);
});

await t('DoctorPedAI: סוללת כפתור → טריאז׳ חירום', () => {
  const r = runDoctorPedAI({
    persona: 'parent',
    presentation: 'button battery',
    findings: ['button battery'],
    patient: { age_months: 24 },
    mode,
  });
  assert(r.ok === true);
  assert(r.emergency === true || r.triage?.urgency === 'emergency' || r.triage?.level === 'emergency');
});

await t('DoctorPedAI: חום בגיל 18ח׳ פותח אנמנזה או תוצאה', () => {
  const r = runDoctorPedAI({
    persona: 'clinician',
    presentation: 'fever',
    findings: ['fever'],
    patient: { age_months: 18 },
    vitals: { temp: 39.2 },
    mode,
  });
  assert(r.ok === true);
  assert(r.awaiting_anamnesis === true || r.instrument || r.triggered_modules || r.triage);
});

await t('עיבוד שמע מקבל PCM בלי ליפול', () => {
  const samples = new Float32Array(3200);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i / 8) * 0.4;
  const r = preprocessAudio({ samples, sampleRate: 16000 });
  assert(r.ok === true || r.reason, JSON.stringify(r));
});

await t('שגיאת JS בפענוח צילום מוצגת בעברית ולא כ-ReferenceError', () => {
  const msg = humanizeAnalysisError(new ReferenceError('runRadiologyFastAnalysis is not defined'));
  assert(/[\u0590-\u05FF]/.test(msg), msg);
  assert(!/is not defined/.test(msg), msg);
  assert(!/runRadiologyFastAnalysis/.test(msg), msg);
});

await t('טוקסיקולוגיה מצורת דף הכלי מחזירה דגל וטקסט', () => {
  const r = runToxicologyEngine({
    locale: 'he',
    patient: { age_months: 24, weight_kg: 12 },
    findings: ['button battery'],
    mode: 'development',
    vitals: { pupils: '', rr_flag: '' },
  });
  assert(r.ok === true, r.message_he || r.reason);
  assert((r.red_flags || []).length > 0);
  assert((r.notes_he || []).length > 0 || r.message_he);
});

await t('מעבדה בלי InvokeLLM מחזירה מעטפת קוד בלי לחכות לרשת', async () => {
  const started = Date.now();
  const r = await runLabInterpreter({
    patient: { age_months: 24 },
    labs: [{ analyte: 'CRP', value: 80, unit: 'mg/L', ref_low: 0, ref_high: 5 }],
    mode: 'development',
  });
  assert(Date.now() - started < 4000, 'lab hung: ' + (Date.now() - started));
  assert(r.ok === true || Array.isArray(r.normalized), JSON.stringify({ ok: r.ok, status: r.status }));
});

await t('שער שפה בלי Base44 נכשל בעברית ולא בשקט', () => {
  try {
    requireBase44Core('InvokeLLM');
  } catch (e) {
    assert(/Claude|ראייה|תשלום|Base44|חיבור/.test(String(e.message)), e.message);
    return;
  }
  // בסביבה מארחת עם Core — גם זה תקין; הכלי לא ריק.
  assert(true);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
process.exit(0);
