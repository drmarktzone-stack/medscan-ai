/**
 * node src/lib/auth/authAdapter.test.mjs
 */
import { loadStoredSession, saveStoredSession, clearStoredSession, mapSupabaseUser } from './supabaseAuth.js';

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log('  ✓ ' + n); pass++; } catch (e) { console.log('  ✗ ' + n + '\n      ' + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || 'assert'); };

console.log('\nSupabase auth helpers\n');

t('מיפוי משתמש Supabase', () => {
  const u = mapSupabaseUser({ user: { id: 'abc', email: 'a@b.com', user_metadata: { full_name: 'Test' } } });
  assert(u.id === 'abc');
  assert(u.supabase === true);
});

t('שמירה וניקוי session', () => {
  if (typeof localStorage === 'undefined') return;
  saveStoredSession({ access_token: 'tok', user: { id: '1', email: 'x@y.z' } });
  assert(loadStoredSession()?.access_token === 'tok');
  clearStoredSession();
  assert(loadStoredSession() === null);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
process.exit(0);
