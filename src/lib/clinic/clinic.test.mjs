/**
 * Local clinic session + backup round-trip.
 * node src/lib/clinic/clinic.test.mjs
 */
import { resolveLocalClinicMode, enableLocalClinic, LOCAL_CLINIC_KEY } from './localMode.js';
import { loadClinicProfile, saveClinicProfile, CLINIC_PROFILE_KEY } from './profile.js';
import { buildClinicBackup, parseClinicBackup, mergeEncounterRows } from './backup.js';
import { hasAgeParts, parseAgeParts } from './ageParts.js';
import { toAgeDays } from '../medscan/deterministic/labNormalize.js';
import {
  isValidNationalId, isValidLicenseNumber, isClinicianComplete, isParentComplete,
  isParentAllowedPath, postAuthPath, saveAccount, emptyAccount,
  hasChosenRole, needsRoleSelection, mustCompleteClinicianProfile,
} from './account.js';
import { reasonHe, displayText } from './engineDisplay.js';
import { isBase44CreditFailure, readStandaloneFlag, routerBasename } from './standalone.js';

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

t('הורה מוכן עם שם בלבד ונכנס רק לפורטל', () => {
  const parent = saveAccount({ role: 'parent', fullName: 'הורה בדיקה' }, memoryStore());
  assert(isParentComplete(parent) === true);
  assert(isClinicianComplete(parent) === false);
  assert(postAuthPath(parent) === '/parent');
  assert(isParentAllowedPath('/parent') === true);
  assert(isParentAllowedPath('/doctorped') === false);
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
    nationalId: '123456782',
    licenseNumber: '12345',
    specialty: 'pediatrics',
    clinicName: 'מרפאת ילדים',
    phone: '0501234567',
  }, store);
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

t('נתיב GitHub Pages נחתך ל-basename', () => {
  assert(routerBasename('/medscan-ai/') === '/medscan-ai');
  assert(routerBasename('/') === undefined);
});

t('כשל קרדיט/מכסה של Base44 מזוהה', () => {
  assert(isBase44CreditFailure({ status: 402 }) === true);
  assert(isBase44CreditFailure({ message: 'insufficient credits' }) === true);
  assert(isBase44CreditFailure({ status: 403 }) === false);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
