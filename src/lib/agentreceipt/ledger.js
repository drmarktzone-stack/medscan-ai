import { receiptPassesGate } from './schema.js';

export const DEFAULT_LEDGER_PATH = '.agentreceipt/ledger.json';

/**
 * @param {object} [seed]
 * @returns {object}
 */
export function emptyLedger(seed = {}) {
  return {
    version: '0.1.0',
    updated_at: new Date().toISOString(),
    tasks: {},
    receipts: [],
    waitlist: [],
    ...seed,
  };
}

/**
 * @param {object} ledger
 * @param {object} receipt
 * @returns {object}
 */
export function appendReceipt(ledger, receipt) {
  const next = {
    ...ledger,
    updated_at: new Date().toISOString(),
    receipts: [...(ledger.receipts ?? []), receipt],
    tasks: { ...(ledger.tasks ?? {}) },
  };
  const task = next.tasks[receipt.task_id] ?? {
    task_id: receipt.task_id,
    created_at: receipt.finished_at,
    receipts: [],
    status: 'open',
  };
  task.receipts = [...(task.receipts ?? []), receipt.receipt_id];
  task.updated_at = receipt.finished_at;
  task.last_status = receipt.status;
  task.last_agent_id = receipt.agent_id;
  const gate = receiptPassesGate(receipt);
  task.gate_passed = gate.ok;
  if (gate.ok) task.status = 'verified';
  else if (receipt.status === 'failed') task.status = 'failed';
  else task.status = 'blocked';
  next.tasks[receipt.task_id] = task;
  return next;
}

/**
 * @param {object} ledger
 * @param {string} taskId
 * @returns {object|null}
 */
export function latestReceiptForTask(ledger, taskId) {
  const ids = ledger.tasks?.[taskId]?.receipts ?? [];
  if (!ids.length) return null;
  const lastId = ids[ids.length - 1];
  return (ledger.receipts ?? []).find((r) => r.receipt_id === lastId) ?? null;
}

/**
 * @param {object} ledger
 * @param {string} taskId
 * @returns {{ ok: boolean, reason?: string, receipt?: object }}
 */
export function gateForTask(ledger, taskId) {
  const receipt = latestReceiptForTask(ledger, taskId);
  if (!receipt) return { ok: false, reason: 'no_receipt' };
  const gate = receiptPassesGate(receipt);
  return gate.ok ? { ok: true, receipt } : { ok: false, reason: gate.reason, receipt, ...gate };
}

/**
 * @param {object} ledger
 * @param {string} prerequisiteTaskId
 * @param {string} nextTaskId
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canStartTask(ledger, prerequisiteTaskId, nextTaskId) {
  if (!prerequisiteTaskId) return { ok: true };
  const g = gateForTask(ledger, prerequisiteTaskId);
  if (!g.ok) {
    return {
      ok: false,
      reason: 'prerequisite_failed',
      prerequisite_task_id: prerequisiteTaskId,
      next_task_id: nextTaskId,
      detail: g.reason,
    };
  }
  return { ok: true, prerequisite_receipt: g.receipt };
}

/**
 * @param {object} ledger
 * @param {{ email: string, plan?: string, note?: string }} entry
 */
export function appendWaitlist(ledger, entry) {
  return {
    ...ledger,
    updated_at: new Date().toISOString(),
    waitlist: [...(ledger.waitlist ?? []), { ...entry, created_at: new Date().toISOString() }],
  };
}
