# AgentReceipt — submissions & demand watch

Updated: 2026-08-26 ~12:05 UTC  
Product: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt (**HTTP 200**)  
**Demand watch:** timer every 6h (`agentreceipt-demand-watch`)

---

## Demand status

| Item | Status |
|------|--------|
| Live `/agentreceipt` + `/docs` | **HTTP 200** |
| Zijian-Ni#90 | CLOSED (404) — **reply draft ready; agent cannot comment** |
| kailiu42#32 | CLOSED — invited PR; **still not in README** |
| Jenqyang#448 | CLOSED — no OSS license + not a dedicated repo |
| Other issues | OPEN, 0 comments |
| aiagenttools | resubmitted `mta1m00gasbi8`; search still 0 |

---

## 🔔 DR actions (agent cannot do these)

### 1. Paste on Zijian-Ni#90
```text
Thanks for the clear quality-gate feedback — appreciated.

1. Live URL fixed — now HTTP 200:
   https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
   Docs: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs

2. Maturity: agreed we are early. Happy to reconsider once you've verified the URL.
   Repo: https://github.com/drmarktzone-stack/medscan-ai
```

### 2. Open PR on kailiu42/awesome-coding-agents
Under `## CLI Agent Helpers`:
```md
| 👀 | [AgentReceipt](https://github.com/drmarktzone-stack/medscan-ai) | verification, receipts, handoff-gates | Proof-of-done gate for coding agents: run verification (e.g. npm run build), write a JSON receipt, and block the next agent if checks fail |
```

### 3. Jenqyang#448 — they want a dedicated licensed repo
They closed because: (a) no standard OSS license, (b) MedScan monorepo isn’t a standalone AgentReceipt artefact.

**This round we added** MIT for the AgentReceipt module (`src/lib/agentreceipt/LICENSE`).

**Still needed for their bar:** create a public repo e.g. `drmarktzone-stack/agentreceipt` with MIT + README + CLI. Agent token cannot create repos (403).

Draft reply after MIT lands on main:
```text
Thanks for the curation notes.

1. AgentReceipt core is now MIT-licensed in-tree: src/lib/agentreceipt/LICENSE
   Docs: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs
2. Agreed a dedicated repo is cleaner — spinning that up next; will resubmit with the canonical URL when ready.

Understood on the Free OSS claim — we will not claim full-repo OSS until the dedicated artefact exists.
```

---

## Round 9 submissions

| Channel | Status |
|---------|--------|
| aiagenttools.dev | `mta1m00gasbi8` |
| acvnace/awesome-vibe-coding-resources | [#72](https://github.com/acvnace/awesome-vibe-coding-resources/issues/72) |
| Serennity007/awesome-ai-coding | [#1](https://github.com/Serennity007/awesome-ai-coding/issues/1) |

---

## Watching

URL blocker cleared. Next bottlenecks are **human replies/PRs** + optional **dedicated AgentReceipt repo**.
