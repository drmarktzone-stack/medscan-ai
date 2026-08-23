/**
 * Local clinic session + backup round-trip.
 * node src/lib/clinic/clinic.test.mjs
 */
import { resolveLocalClinicMode, enableLocalClinic, LOCAL_CLINIC_KEY } from './localMode.js';
import { loadClinicProfile, saveClinicProfile, CLINIC_PROFILE_KEY } from './profile.js';
import { buildClinicBackup, parseClinicBackup, mergeEncounterRows } from './backup.js';
import { hasAgeParts, parseAgeParts } from './ageParts.js';
import { toAgeDays } from '../medscan/deterministic/labNormalize.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isValidNationalId, isValidLicenseNumber, isClinicianComplete, isParentComplete,
  isParentAllowedPath, visibleHomeDoors, postAuthPath, saveAccount, emptyAccount,
  hasChosenRole, needsRoleSelection, mustCompleteClinicianProfile,
  clinicianBlockingFields, isClinicianSwitchRequest, CLINICIAN_SWITCH_PATH,
} from './account.js';
import { reasonHe, displayText } from './engineDisplay.js';
import { AUTH_BOOT_DEADLINE_MS, isBase44CreditFailure, readStandaloneFlag, routerBasename, absoluteAppPath } from './standalone.js';
import { registerClinicPwa, serviceWorkerUrl } from './pwa.js';
import { decideCodeFirst } from '../medscan/codeFirstPolicy.js';
import { VISION_BILLING_GROUP, isVisionBillingRoute, visionPaywallOn } from './billingGroups.js';
import { onDeviceSkinEngine, onDeviceRadiologyEngine, onDeviceEcgReading } from './onDeviceVision.js';
import { assembleSkinResult } from '../medscan/engines/skinResultBuilder.js';
import { assembleRadiologyResult } from '../medscan/engines/radiologyResultBuilder.js';
import { assembleEcgResult } from '../medscan/engines/ecgResultBuilder.js';

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log('  ✓ ' + n); pass++; } catch (e) { console.log('  ✗ ' + n + '\n      ' + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

function memoryStore(seed = {}) {
  const data = { ...seed };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

console.log('\nDoctorPedAI — clinic local mode\n');

t('בלי מזהה אפליקציה חיצוני — המרפאה נפתחת במחשב זה', () => {
  assert(resolveLocalClinicMode({ env: {}, appId: null, token: null }) === true);
});

t('פיתוח בלי אסימון מציג התחברות', () => {
  assert(resolveLocalClinicMode({ env: { DEV: true }, appId: 'x', token: null, storage: memoryStore() }) === false);
});

t('ייצור עם מזהה יישום בלי אסימון דורש התחברות', () => {
  assert(resolveLocalClinicMode({
    env: { DEV: false },
    appId: 'hosted',
    token: null,
    storage: memoryStore(),
  }) === false);
});

t('אפליקציה מארחת עם אסימון — לא מדלגת על התחברות', () => {
  assert(resolveLocalClinicMode({
    env: { DEV: false },
    appId: 'hosted',
    token: 'tok',
    storage: memoryStore(),
  }) === false);
});

t('בחירה מפורשת במחשב זה נשמרת', () => {
  const storage = memoryStore();
  enableLocalClinic(storage);
  assert(storage.getItem(LOCAL_CLINIC_KEY) === '1');
  assert(resolveLocalClinicMode({ env: {}, appId: 'hosted', token: null, storage }) === true);
});

t('VITE_STANDALONE פותח מרפאה מקומית בלי Base44', () => {
  assert(resolveLocalClinicMode({
    env: { VITE_STANDALONE: 'true' },
    appId: 'hosted',
    token: 'tok',
    storage: memoryStore(),
  }) === true);
});

t('Base44 לא זמין — מרפאה מקומית', () => {
  assert(resolveLocalClinicMode({
    env: {},
    appId: 'hosted',
    token: null,
    storage: memoryStore(),
    base44Reachable: false,
  }) === true);
});

t('VITE_FORCE_AUTH חוסם דילוג גם בלי אסימון', () => {
  assert(resolveLocalClinicMode({
    env: { VITE_FORCE_AUTH: 'true', DEV: true, VITE_LOCAL_CLINIC: 'true' },
    appId: 'x',
    token: null,
  }) === false);
});

t('פרופיל מרפאה נחתך ונשמר', () => {
  const storage = memoryStore();
  saveClinicProfile({ clinicName: '  מרפאת ילדים  ', physicianName: 'ד"ר סמר' }, storage);
  const loaded = loadClinicProfile(storage);
  assert(loaded.clinicName === 'מרפאת ילדים');
  assert(loaded.physicianName === 'ד"ר סמר');
  assert(storage.getItem(CLINIC_PROFILE_KEY).includes('מרפאת ילדים'));
});

t('גיבוי וקריאה לא משנים מפגשים', () => {
  const backup = buildClinicBackup({
    profile: { clinicName: 'A', physicianName: 'B' },
    encounters: [{ id: 'local-1', rls_role: 'clinician' }],
  }, () => '2026-08-21T00:00:00.000Z');
  const parsed = parseClinicBackup(JSON.stringify(backup));
  assert(parsed.version === 1);
  assert(parsed.encounters[0].id === 'local-1');
  assert(parsed.profile.clinicName === 'A');
});

t('גיבוי פגום נדחה', () => {
  let threw = false;
  try { parseClinicBackup({ app: 'other', version: 1, encounters: [] }); } catch { threw = true; }
  assert(threw);
});

t('ייבוא ממזג בלי כפילות מזהה', () => {
  const merged = mergeEncounterRows(
    [{ id: 'a', n: 1 }],
    [{ id: 'a', n: 9 }, { id: 'b', n: 2 }],
  );
  assert(merged.length === 2);
  assert(merged.find((r) => r.id === 'a').n === 1);
  assert(merged.find((r) => r.id === 'b').n === 2);
});

t('גיל בשנים וחודשים מחובר לימים', () => {
  assert(toAgeDays({ age_days: 14 }) === 14);
  assert(toAgeDays({ age_years: 4 }) === 1461);
  assert(toAgeDays({ age_months: 6 }) === 183);
  assert(toAgeDays({ age_years: 2, age_months: 4 }) === 852);
  assert(toAgeDays({ age_years: 0, age_months: 8 }) === 244);
  assert(toAgeDays({}) === null);
  const parts = parseAgeParts({ ageYears: '2', ageMonths: '4', ageDays: '' });
  assert(parts.age_years === 2);
  assert(parts.age_months === 4);
  assert(parts.age_days === undefined);
  assert(hasAgeParts({ ageYears: '', ageMonths: '6', ageDays: '' }) === true);
  assert(hasAgeParts({ ageYears: '', ageMonths: '', ageDays: '' }) === false);
});

t('תעודת זהות ישראלית נבדקת לפי ספרת ביקורת', () => {
  assert(isValidNationalId('123456782') === true);
  assert(isValidNationalId('123456781') === false);
  assert(isValidLicenseNumber('12345') === true);
  assert(isValidLicenseNumber('ab') === false);
});

t('הורה — נתיבי מסע משפחתי מאושרים', () => {
  assert(isParentAllowedPath('/parent') === true);
  assert(isParentAllowedPath('/parent/visit') === true);
  assert(isParentAllowedPath('/parent/results') === true);
  assert(isParentAllowedPath('/parent/follow-up') === true);
  assert(isParentAllowedPath('/doctorped') === false);
});

t('הורה מוכן עם שם בלבד ונכנס רק לפורטל', () => {
  const parent = saveAccount({ role: 'parent', fullName: 'הורה בדיקה' }, memoryStore());
  assert(isParentComplete(parent) === true);
  assert(isClinicianComplete(parent) === false);
  assert(postAuthPath(parent) === '/parent');
  assert(isParentAllowedPath('/parent') === true);
  assert(isParentAllowedPath('/doctorped') === false);
  assert(isClinicianSwitchRequest(parent, 'clinician') === true);
  assert(isClinicianSwitchRequest(parent, 'parent') === false);
  assert(CLINICIAN_SWITCH_PATH === '/register?role=clinician');
});

t('בית מציג שולחן רופא ושולחן הורים גם לרופא', () => {
  assert(visibleHomeDoors('clinician').includes('/doctorped'));
  assert(visibleHomeDoors('clinician').includes('/parent'));
  assert(visibleHomeDoors('parent').includes('/parent'));
});

t('רופא בלי רישיון והתמחות נשאר בהרשמה', () => {
  const store = memoryStore();
  const incomplete = saveAccount({
    role: 'clinician', fullName: 'ד"ר בדיקה', clinicName: 'מרפאה',
  }, store);
  assert(isClinicianComplete(incomplete) === false);
  assert(mustCompleteClinicianProfile(incomplete) === true);
  assert(postAuthPath(incomplete) === '/register');
  assert(hasChosenRole(incomplete) === true);
  assert(needsRoleSelection(incomplete) === false);
  const complete = saveAccount({
    role: 'clinician',
    fullName: 'ד"ר בדיקה',
    licenseNumber: '12345',
    specialty: 'pediatrics',
  }, store);
  assert(clinicianBlockingFields(complete).length === 0);
  assert(isClinicianComplete(complete) === true);
  assert(mustCompleteClinicianProfile(complete) === false);
  assert(postAuthPath(complete) === '/');
  assert(emptyAccount().role === '');
  assert(needsRoleSelection(emptyAccount()) === true);
});

t('מרפאה מקומית בלי חשבון לא ממציאה רופא בלי רישיון', () => {
  assert(needsRoleSelection(emptyAccount()) === true);
  const parentStore = memoryStore();
  saveAccount({ role: 'parent', fullName: 'הורה' }, parentStore);
  const kept = saveAccount({ role: 'parent', fullName: 'הורה' }, parentStore);
  assert(kept.role === 'parent');
  assert(postAuthPath(kept) === '/parent');
});

t('סיבות מנוע מוצגות בעברית ושדות אובייקט נקראים', () => {
  assert(reasonHe('age_required').includes('גיל'));
  assert(displayText({ title_he: 'דפוס PKU' }) === 'דפוס PKU');
  assert(displayText(['a', { label_he: 'ב' }]).includes('ב'));
});

t('מצב עצמאי מזוהה מ-VITE_STANDALONE', () => {
  assert(readStandaloneFlag({ VITE_STANDALONE: 'true' }) === true);
  assert(readStandaloneFlag({ VITE_LOCAL_CLINIC: '1' }) === true);
  assert(readStandaloneFlag({}) === false);
});

t('מצב פיתוח אינו מדלג על שער השפה כשיש קלוד ומזהה יישום', () => {
  const fakeInvoke = async () => ({});
  assert(decideCodeFirst({ standalone: false, appId: 'hosted-app', invokeLLM: fakeInvoke }) === false);
  assert(decideCodeFirst({ standalone: true, appId: 'hosted-app', invokeLLM: fakeInvoke }) === true);
  assert(decideCodeFirst({ standalone: false, appId: 'hosted-app', invokeLLM: null }) === true);
  assert(decideCodeFirst({ standalone: false, appId: null, invokeLLM: fakeInvoke }) === true);
});

t('נתיב GitHub Pages נחתך ל-basename', () => {
  assert(routerBasename('/medscan-ai/') === '/medscan-ai');
  assert(routerBasename('/') === undefined);
});

t('קפיצה מלאה אחרי הרשמה כוללת את תיקיית GitHub Pages', () => {
  assert(absoluteAppPath('/parent', '/medscan-ai/') === '/medscan-ai/parent');
  assert(absoluteAppPath('/login', '/medscan-ai/') === '/medscan-ai/login');
  assert(absoluteAppPath('/', '/medscan-ai/') === '/medscan-ai/');
  assert(absoluteAppPath('/parent', '/') === '/parent');
  assert(absoluteAppPath('/medscan-ai/parent', '/medscan-ai/') === '/medscan-ai/parent');
});

t('דדליין אתחול Base44 מוגדר כדי שהמסך לא יישאר על ספינר', () => {
  assert(AUTH_BOOT_DEADLINE_MS <= 3000);
  assert(AUTH_BOOT_DEADLINE_MS >= 1000);
});

t('כלי דימות מסומנים כקבוצת תשלום עתידית בלי חומה עכשיו', () => {
  assert(visionPaywallOn() === false);
  assert(isVisionBillingRoute('/ecg') === true);
  assert(isVisionBillingRoute('/ecg-compare') === true);
  assert(isVisionBillingRoute('/skin') === true);
  assert(isVisionBillingRoute('/radiology') === true);
  assert(isVisionBillingRoute('/tox') === false);
  assert(VISION_BILLING_GROUP.paywall_enabled === false);
  assert(VISION_BILLING_GROUP.id === 'vision');
});

function makeRgba(w, h, pixel) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

t('עור במכשיר מחזיר טיוטה בלי שם אבחנה', () => {
  const img = makeRgba(80, 80, (x, y) => {
    const dx = x - 40;
    const dy = y - 40;
    if (dx * dx + dy * dy < 14 * 14) return [30, 20, 15];
    return [220, 185, 160];
  });
  const engine = onDeviceSkinEngine(img);
  assert(engine.abstain === false);
  assert((engine.structured.differential_diagnoses || []).length === 0);
  const ui = assembleSkinResult(engine, [], { fileUrl: 'blob:test', locale: 'he' });
  assert(ui.analysis && ui.summary);
  assert(ui.severity !== 'normal', 'on-device skin must not be called normal');
  assert(!/מלנומה|פסוריאזיס|melanoma/i.test(ui.summary), ui.summary);
  if (ui.matchedCases?.length) {
    assert(ui.matchedCases.every((m) => m.reference_only), 'atlas rows must be reference-only');
  }
});

t('צילום במכשיר מחזיר טיוטת צפיפויות בלי אבחנת ריאות', () => {
  const img = makeRgba(64, 64, (x, y) => {
    if (x >= 28 && x <= 36) return [230, 230, 230];
    if (x < 22 || x > 42) return [20, 20, 25];
    return [90, 90, 95];
  });
  const engine = onDeviceRadiologyEngine(img);
  assert(engine.abstain === false);
  assert((engine.structured.key_abnormalities || []).length === 0);
  const ui = assembleRadiologyResult(engine, [], { fileUrl: 'blob:test', locale: 'he' });
  assert(ui.analysis && ui.summary);
  assert(ui.severity !== 'normal', 'on-device radiology must not be called normal');
  assert(!/בגבולות הנורמה/.test(ui.analysis));
  assert((engine.structured.differential_diagnoses || []).length === 0);
  assert(!(ui.matchedCases || []).some((c) => /pneumothorax|דלקת ריאות/i.test(c.title || '')));
});

t('אק״ג במכשיר לא ממציא PR/QRS בלי כיול', () => {
  const reading = onDeviceEcgReading({});
  assert(reading.abstain === false);
  assert(reading.measured.measurable === false);
  const ui = assembleEcgResult(reading, [], { locale: 'he' });
  assert(ui.analysis);
  assert(!/\bPR=\d/.test(ui.analysis));
  assert(!/ללא ממצא פתולוגי/.test(ui.summary), ui.summary);
  assert(ui.severity !== 'normal', 'uncalibrated ECG must not be green-normal');
  assert(ui.microReading === reading);
});

t('כשל קרדיט/מכסה של Base44 מזוהה', () => {
  assert(isBase44CreditFailure({ status: 402 }) === true);
  assert(isBase44CreditFailure({ message: 'insufficient credits' }) === true);
  assert(isBase44CreditFailure({ status: 403 }) === false);
});

t('כתובת Service Worker כוללת את בסיס GitHub Pages', () => {
  assert(serviceWorkerUrl('/medscan-ai/') === '/medscan-ai/sw.js');
  assert(serviceWorkerUrl('/medscan-ai') === '/medscan-ai/sw.js');
  assert(serviceWorkerUrl('/') === '/sw.js');
});

t('רישום PWA לא רץ במצב פיתוח', () => {
  let called = false;
  registerClinicPwa({
    env: { DEV: true, BASE_URL: '/medscan-ai/' },
    register: () => { called = true; },
  });
  assert(called === false);
});

t('מניפסט ההתקנה משתמש בנתיבים יחסיים', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8'));
  assert(manifest.start_url === './');
  assert(manifest.scope === './');
  assert(manifest.theme_color === '#4da3ff');
  assert(manifest.icons.every((icon) => !String(icon.src).startsWith('/')));
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
