import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { buildReceipt } from './schema.js';

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, env?: object, maxLogChars?: number }} [opts]
 */
export function runCommand(cmd, args, opts = {}) {
  const started = Date.now();
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    shell: false,
  });
  const stdout = (result.stdout ?? '').slice(-(opts.maxLogChars ?? 4000));
  const stderr = (result.stderr ?? '').slice(-(opts.maxLogChars ?? 4000));
  return {
    name: [cmd, ...args].join(' '),
    exit_code: result.status ?? (result.error ? 1 : 0),
    duration_ms: Date.now() - started,
    stdout_tail: stdout,
    stderr_tail: stderr,
    error: result.error?.message ?? null,
  };
}

/**
 * @param {{ cwd?: string, commands?: { name: string, cmd: string, args?: string[] }[] }} [opts]
 */
export function runDefaultVerification(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const commands = opts.commands ?? [
    { name: 'build', cmd: 'npm', args: ['run', 'build'] },
  ];
  return commands.map(({ name, cmd, args }) => {
    const out = runCommand(cmd, args ?? [], { cwd });
    return { name, ...out };
  });
}

function gitMeta(cwd) {
  const sha = runCommand('git', ['rev-parse', 'HEAD'], { cwd, maxLogChars: 80 });
  const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, maxLogChars: 80 });
  const dirty = runCommand('git', ['status', '--porcelain'], { cwd, maxLogChars: 2000 });
  return {
    sha: sha.exit_code === 0 ? sha.stdout_tail.trim() : null,
    branch: branch.exit_code === 0 ? branch.stdout_tail.trim() : null,
    dirty: dirty.exit_code === 0 ? dirty.stdout_tail.trim().length > 0 : null,
  };
}

function changedFiles(cwd) {
  const diff = runCommand('git', ['diff', '--name-only', 'HEAD'], { cwd, maxLogChars: 8000 });
  if (diff.exit_code !== 0) return [];
  return diff.stdout_tail.split('\n').map((s) => s.trim()).filter(Boolean);
}

/**
 * Run verification checks and emit a receipt.
 * @param {object} params
 */
export function verifyAndBuildReceipt({
  task_id,
  agent_id,
  agent_platform = 'cursor-cloud',
  cwd = process.cwd(),
  commands,
  summary_he = '',
  summary_en = '',
  metadata = {},
} = {}) {
  if (!task_id || !agent_id) throw new Error('task_id and agent_id required');
  const checkResults = runDefaultVerification({ cwd, commands });
  const allPass = checkResults.every((c) => c.exit_code === 0);
  return buildReceipt({
    receipt_id: `rcpt_${randomUUID()}`,
    task_id,
    agent_id,
    agent_platform,
    status: allPass ? 'done' : 'failed',
    summary_he: summary_he || (allPass ? 'כל הבדיקות עברו' : 'בדיקה נכשלה'),
    summary_en: summary_en || (allPass ? 'All checks passed' : 'Verification failed'),
    git: gitMeta(cwd),
    files_changed: changedFiles(cwd),
    checks: { commands: checkResults },
    blockers: allPass ? [] : checkResults.filter((c) => c.exit_code !== 0).map((c) => c.name),
    metadata,
  });
}
