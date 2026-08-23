/**
 * AgentReceipt unit tests
 * node src/lib/agentreceipt/agentreceipt.test.mjs
 */
import {
  buildReceipt,
  validateReceipt,
  receiptPassesGate,
  emptyLedger,
  appendReceipt,
  gateForTask,
  canStartTask,
} from './index.js';

let pass = 0;
let fail = 0;
const t = (n, fn) => {
  try {
    fn();
    console.log('  ✓ ' + n);
    pass++;
  } catch (e) {
    console.log('  ✗ ' + n + '\n      ' + e.message);
    fail++;
  }
};
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

console.log('\nAgentReceipt\n');

t('valid receipt passes validation', () => {
  const r = buildReceipt({
    receipt_id: 'rcpt_1',
    task_id: 'task_a',
    agent_id: 'cursor-1',
    status: 'done',
    checks: { commands: [{ name: 'build', exit_code: 0, duration_ms: 100 }] },
  });
  assert(validateReceipt(r).ok);
});

t('gate passes when checks exit 0', () => {
  const r = buildReceipt({
    receipt_id: 'rcpt_2',
    task_id: 'task_b',
    agent_id: 'cursor-1',
    status: 'done',
    checks: { commands: [{ name: 'build', exit_code: 0, duration_ms: 50 }] },
  });
  assert(receiptPassesGate(r).ok);
});

t('gate fails when build failed', () => {
  const r = buildReceipt({
    receipt_id: 'rcpt_3',
    task_id: 'task_c',
    agent_id: 'cursor-1',
    status: 'failed',
    checks: { commands: [{ name: 'build', exit_code: 1, duration_ms: 50 }] },
  });
  assert(!receiptPassesGate(r).ok);
});

t('ledger append + gate for task', () => {
  let ledger = emptyLedger();
  const r = buildReceipt({
    receipt_id: 'rcpt_4',
    task_id: 'inbox:02_skin',
    agent_id: 'cursor-cloud',
    status: 'done',
    checks: { commands: [{ name: 'build', exit_code: 0, duration_ms: 10 }] },
  });
  ledger = appendReceipt(ledger, r);
  assert(gateForTask(ledger, 'inbox:02_skin').ok);
  assert(ledger.tasks['inbox:02_skin'].status === 'verified');
});

t('canStartTask blocks when prerequisite failed', () => {
  let ledger = emptyLedger();
  const bad = buildReceipt({
    receipt_id: 'rcpt_5',
    task_id: 'step1',
    agent_id: 'a',
    status: 'failed',
    checks: { commands: [{ name: 'build', exit_code: 1, duration_ms: 10 }] },
  });
  ledger = appendReceipt(ledger, bad);
  const chain = canStartTask(ledger, 'step1', 'step2');
  assert(!chain.ok);
  assert(chain.reason === 'prerequisite_failed');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
