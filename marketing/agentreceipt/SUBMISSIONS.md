# AgentReceipt — submissions & demand watch

Updated: 2026-08-26 ~00:05 UTC  
Product: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt  
**Demand watch:** timer every 6h (`agentreceipt-demand-watch`)

---

## Demand status (replies)

| Channel | State | Notes |
|---------|-------|-------|
| **Zijian-Ni#90** | CLOSED | Rejected: live URL HTTP 404 + maturity bar |
| **kailiu42#32** | CLOSED | Invited PR — still not listed |
| Other tracked issues | OPEN | 0 comments |
| aiagenttools.dev | submitted | search = 0 |
| Live `/agentreceipt` | **still HTTP 404** | Fix is in PR #19 — **NOT MERGED TO MAIN** |

**Verdict (demand-watch #7):** Blocked on merging [#19](https://github.com/drmarktzone-stack/medscan-ai/pull/19). Until Pages deploys the fix, every directory that probes the URL will reject us (as Zijian-Ni did).

---

## 🚨 DR ACTION (blocking)

1. **Merge PR #19** (CI green, mergeable) → wait for Pages deploy  
2. Verify: `curl -o /dev/null -w "%{http_code}\n" https://drmarktzone-stack.github.io/medscan-ai/agentreceipt` → expect **200**  
3. Paste Zijian-Ni draft (below) once 200  
4. Open kailiu42 PR from your GitHub account

### Draft for Zijian-Ni#90 (after URL is 200)

```text
Thanks for the clear quality-gate feedback — appreciated.

1. Live URL: the /agentreceipt path was incorrectly served as HTTP 404 via Pages' SPA fallback. We now materialize dist/agentreceipt/index.html so the canonical URL returns HTTP 200. Please re-check:
   https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
   Docs: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs

2. Maturity: agreed we are early. Happy to wait until there is clearer traction, or to be reconsidered once the URL is verified green. Canonical repo: https://github.com/drmarktzone-stack/medscan-ai

No rush — fixing the broken link first was the right call on your side.
```

### kailiu42 catalog row

```md
| 👀 | [AgentReceipt](https://github.com/drmarktzone-stack/medscan-ai) | verification, receipts, handoff-gates | Proof-of-done gate for coding agents: run verification (e.g. npm run build), write a JSON receipt, and block the next agent if checks fail |
```

---

## Round 7 submissions

| Channel | Status |
|---------|--------|
| aiagenttools.dev | `mt9bvz301d2bc` |
| 11010tianyi/awesome-ai-coding-projects | [#1](https://github.com/11010tianyi/awesome-ai-coding-projects/issues/1) |
| quome-cloud/awesome-coding-agents | [#14](https://github.com/quome-cloud/awesome-coding-agents/issues/14) |

---

## Watching

Every 6h until URL is 200 and listings move. Continuing to open issues, but **merge #19 is the bottleneck**.
