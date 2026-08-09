import { runRedTeamSuite } from './src/lib/redTeamSuite.js';
const r = runRedTeamSuite();
console.log('total', r.total, 'passed', r.passed, 'failed', r.failed_count, 'rate', r.pass_rate, 'all_ok', r.all_guards_ok);
console.log('by_domain', JSON.stringify(r.by_domain));
if (r.failures.length) console.log('FAILURES:', JSON.stringify(r.failures, null, 1));
