#!/usr/bin/env node
/**
 * AgentReceipt CLI — verify, submit, gate, status, waitlist-export
 *
 * Usage:
 *   node scripts/agentreceipt.mjs verify --task TASK --agent AGENT [--platform cursor-cloud]
 *   node scripts/agentreceipt.mjs submit --file receipt.json
 *   node scripts/agentreceipt.mjs gate --task TASK [--requires TASK_ID]
 *   node scripts/agentreceipt.mjs status [--task TASK]
 *   node scripts/agentreceipt.mjs inbox-done --prompt FILE --agent AGENT
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
  verifyAndBuildReceipt,
  validateReceipt,
  appendReceipt,
  gateForTask,
  canStartTask,
  loadLedgerFromFile,
  saveLedgerToFile,
  DEFAULT_LEDGER_PATH,
} from '../src/lib/agentreceipt/index.js';

const args = process.argv.slice(2);
const cmd = args[0];

function parseFlags(list) {
  const flags = {};
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = list[i + 1];
      if (!next || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    }
  }
  return flags;
}

const flags = parseFlags(args.slice(1));
const ledgerPath = flags.ledger ? resolve(flags.ledger) : DEFAULT_LEDGER_PATH;

function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function loadReceiptFile(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  if (!cmd || cmd === 'help' || flags.help) {
    console.log(`AgentReceipt CLI

  verify   Run checks (default: npm run build) and write receipt
           --task ID --agent ID [--platform cursor-cloud] [--out file.json]

  submit   Append receipt JSON to ledger
           --file receipt.json

  gate     Check if task passed verification gate
           --task ID [--requires PREREQ_TASK_ID]

  status   Show ledger summary
           [--task ID]

  inbox-done  Verify after inbox prompt (task id = prompt basename)
           --prompt prompts/inbox/02_foo.md --agent cursor-cloud-abc

  waitlist-export  Print waitlist entries from ledger (for manual CRM)
`);
    process.exit(0);
  }

  if (cmd === 'verify') {
    const taskId = flags.task;
    const agentId = flags.agent;
    if (!taskId || !agentId) {
      console.error('verify requires --task and --agent');
      process.exit(1);
    }
    const receipt = verifyAndBuildReceipt({
      task_id: taskId,
      agent_id: agentId,
      agent_platform: flags.platform ?? 'cursor-cloud',
      summary_he: flags.summary_he ?? '',
      summary_en: flags.summary_en ?? '',
      metadata: { cli: true },
    });
    const outPath = flags.out ? resolve(flags.out) : resolve('.agentreceipt', `receipt-${taskId}.json`);
    writeFileSync(outPath, JSON.stringify(receipt, null, 2), 'utf8');
    let ledger = loadLedgerFromFile(ledgerPath);
    ledger = appendReceipt(ledger, receipt);
    saveLedgerToFile(ledger, ledgerPath);
    printJson({ ok: receipt.checks.commands.every((c) => c.exit_code === 0), receipt_path: outPath, receipt });
    process.exit(receipt.status === 'done' ? 0 : 1);
  }

  if (cmd === 'submit') {
    if (!flags.file) {
      console.error('submit requires --file');
      process.exit(1);
    }
    const receipt = loadReceiptFile(resolve(flags.file));
    const v = validateReceipt(receipt);
    if (!v.ok) {
      printJson({ ok: false, errors: v.errors });
      process.exit(1);
    }
    let ledger = loadLedgerFromFile(ledgerPath);
    ledger = appendReceipt(ledger, receipt);
    saveLedgerToFile(ledger, ledgerPath);
    printJson({ ok: true, receipt_id: receipt.receipt_id, task_id: receipt.task_id });
    process.exit(0);
  }

  if (cmd === 'gate') {
    const taskId = flags.task;
    if (!taskId) {
      console.error('gate requires --task');
      process.exit(1);
    }
    const ledger = loadLedgerFromFile(ledgerPath);
    if (flags.requires) {
      const chain = canStartTask(ledger, flags.requires, taskId);
      printJson(chain);
      process.exit(chain.ok ? 0 : 1);
    }
    const g = gateForTask(ledger, taskId);
    printJson(g);
    process.exit(g.ok ? 0 : 1);
  }

  if (cmd === 'status') {
    const ledger = loadLedgerFromFile(ledgerPath);
    if (flags.task) {
      const task = ledger.tasks?.[flags.task];
      printJson({ task, latest: ledger.receipts?.filter((r) => r.task_id === flags.task).slice(-3) });
      process.exit(0);
    }
    const summary = {
      updated_at: ledger.updated_at,
      receipt_count: ledger.receipts?.length ?? 0,
      task_count: Object.keys(ledger.tasks ?? {}).length,
      waitlist_count: ledger.waitlist?.length ?? 0,
      tasks: ledger.tasks,
    };
    printJson(summary);
    process.exit(0);
  }

  if (cmd === 'inbox-done') {
    const promptPath = flags.prompt;
    const agentId = flags.agent ?? 'cursor-cloud';
    if (!promptPath || !existsSync(promptPath)) {
      console.error('inbox-done requires --prompt path to existing file');
      process.exit(1);
    }
    const taskId = `inbox:${basename(promptPath, '.md')}`;
    const receipt = verifyAndBuildReceipt({
      task_id: taskId,
      agent_id: agentId,
      agent_platform: flags.platform ?? 'cursor-cloud',
      summary_he: `inbox prompt ${basename(promptPath)}`,
      metadata: { prompt_path: promptPath, inbox: true },
    });
    let ledger = loadLedgerFromFile(ledgerPath);
    ledger = appendReceipt(ledger, receipt);
    saveLedgerToFile(ledger, ledgerPath);
    printJson({
      ok: receipt.status === 'done',
      task_id: taskId,
      move_to: receipt.status === 'done' ? 'prompts/done/' : null,
      receipt,
    });
    process.exit(receipt.status === 'done' ? 0 : 1);
  }

  if (cmd === 'waitlist-export') {
    const ledger = loadLedgerFromFile(ledgerPath);
    printJson(ledger.waitlist ?? []);
    process.exit(0);
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
