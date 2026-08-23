/** AgentReceipt v0 — machine-readable proof that an AI agent finished work. */

export const RECEIPT_VERSION = '0.1.0';

export const RECEIPT_STATUS = Object.freeze(['done', 'failed', 'blocked']);

export const KNOWN_AGENT_PLATFORMS = Object.freeze([
  'cursor-cloud',
  'cursor-desktop',
  'claude-code',
  'lovable',
  'medscan-engine',
  'github-copilot',
  'custom',
]);

/**
 * @param {object} raw
 * @returns {{ ok: boolean, receipt?: object, errors?: string[] }}
 */
export function validateReceipt(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['receipt must be an object'] };

  if (raw.version !== RECEIPT_VERSION) errors.push(`version must be ${RECEIPT_VERSION}`);
  if (!raw.receipt_id || typeof raw.receipt_id !== 'string') errors.push('receipt_id required');
  if (!raw.task_id || typeof raw.task_id !== 'string') errors.push('task_id required');
  if (!raw.agent_id || typeof raw.agent_id !== 'string') errors.push('agent_id required');
  if (!RECEIPT_STATUS.includes(raw.status)) errors.push(`status must be one of: ${RECEIPT_STATUS.join(', ')}`);
  if (!raw.finished_at) errors.push('finished_at required');

  const checks = raw.checks;
  if (!checks || typeof checks !== 'object') {
    errors.push('checks object required');
  } else {
    if (!Array.isArray(checks.commands)) errors.push('checks.commands must be an array');
    for (const c of checks.commands ?? []) {
      if (!c?.name || typeof c.exit_code !== 'number') {
        errors.push('each check needs name + numeric exit_code');
        break;
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, receipt: raw };
}

/**
 * @param {object} params
 * @returns {object}
 */
export function buildReceipt({
  receipt_id,
  task_id,
  agent_id,
  agent_platform = 'custom',
  status,
  summary_he = '',
  summary_en = '',
  git = {},
  files_changed = [],
  checks = { commands: [] },
  blockers = [],
  next_agent_id = null,
  metadata = {},
} = {}) {
  const receipt = {
    version: RECEIPT_VERSION,
    receipt_id,
    task_id,
    agent_id,
    agent_platform,
    status,
    finished_at: new Date().toISOString(),
    summary_he,
    summary_en,
    git: {
      sha: git.sha ?? null,
      branch: git.branch ?? null,
      dirty: git.dirty ?? null,
    },
    files_changed,
    checks,
    blockers,
    next_agent_id,
    metadata,
  };
  const v = validateReceipt(receipt);
  if (!v.ok) throw new Error(v.errors.join('; '));
  return receipt;
}

/** Receipt passes the verification gate when status is done and all checks exited 0. */
export function receiptPassesGate(receipt) {
  const v = validateReceipt(receipt);
  if (!v.ok) return { ok: false, reason: 'invalid_receipt', errors: v.errors };
  if (receipt.status !== 'done') {
    return { ok: false, reason: 'status_not_done', status: receipt.status, blockers: receipt.blockers ?? [] };
  }
  const failed = (receipt.checks?.commands ?? []).filter((c) => c.exit_code !== 0);
  if (failed.length) {
    return { ok: false, reason: 'check_failed', failed };
  }
  return { ok: true };
}
