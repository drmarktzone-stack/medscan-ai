# AgentReceipt — receipt schema v0

Machine-readable proof that an AI agent finished a task and verification passed.

## Quick start

```bash
# After agent work — run build and record receipt
npm run agentreceipt:verify -- --task my-feature --agent cursor-cloud-xyz

# Or full CLI
node scripts/agentreceipt.mjs verify --task inbox:02_skin --agent cursor-cloud
node scripts/agentreceipt.mjs gate --task inbox:02_skin
node scripts/agentreceipt.mjs gate --task step2 --requires step1
node scripts/agentreceipt.mjs status
```

## Inbox integration (MedScan)

After completing a prompt in `prompts/inbox/`:

```bash
node scripts/agentreceipt.mjs inbox-done \
  --prompt prompts/inbox/02_skin_upgrade.md \
  --agent cursor-cloud
```

Exit code `0` → safe to move prompt to `prompts/done/`.  
Exit code `1` → build failed; do not hand off to next agent.

## Receipt shape

See `src/lib/agentreceipt/schema.js`. Required fields:

- `version`, `receipt_id`, `task_id`, `agent_id`, `status`, `finished_at`
- `checks.commands[]` with `name`, `exit_code`

## Gate rules

1. `status === 'done'`
2. Every check `exit_code === 0`

## Web UI

- `/agentreceipt` — product landing
- `/agentreceipt/pricing` — plans + waitlist
- `/agentreceipt/console` — local ledger viewer (browser storage)

## Sell

Team plan waitlist is stored in browser localStorage (console) or `.agentreceipt/ledger.json` (CLI export via future sync). No Stripe yet — contact via pricing page mailto.

## License

AgentReceipt core (CLI + `src/lib/agentreceipt/` + product UI under `src/agentreceipt/`) is **MIT** — see `src/lib/agentreceipt/LICENSE`.  
The rest of the MedScan app is not covered by that license.
