# AgentReceipt — submissions & demand watch

Updated: 2026-08-25 ~18:05 UTC  
Product: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt  
**Demand watch:** timer every 6h (`agentreceipt-demand-watch`)

---

## Demand status (replies)

| Channel | State | Notes |
|---------|-------|-------|
| **Zijian-Ni/awesome-ai-agents-2026#90** | **CLOSED** | Rejected: live URL returned **HTTP 404**; maturity bar (stars/adoption). |
| **kailiu42/awesome-coding-agents#32** | **CLOSED** | Invited PR — **still not listed**; agent cannot fork. |
| All other tracked issues | OPEN | 0 comments |
| aiagenttools.dev | submitted | search = 0 hits |
| Checkout / WhatsApp Bit | — | **you must check WhatsApp** |

**Verdict (demand-watch #6):** First rejection (broken Pages deep link) + pending kailiu42 PR. **Fixing HTTP 404 for `/agentreceipt` in this PR** so listings can be re-opened.

---

## 🔧 Critical fix this round

GitHub Pages served `/agentreceipt` via root `404.html` → **HTTP 404**. Maintainers (correctly) reject that.

**Change:** `scripts/pages-combined-404.mjs` now writes `dist/agentreceipt/index.html` (HTTP 200) and includes `agentreceipt` in SPA redirect prefixes.

After merge to `main` + Pages deploy, verify:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
# expect 200
```

---

## 🔔 Draft reply for Zijian-Ni#90 (paste after URL returns 200)

```text
Thanks for the clear quality-gate feedback — appreciated.

1. Live URL: the /agentreceipt path was incorrectly served as HTTP 404 via Pages' SPA fallback. We now materialize dist/agentreceipt/index.html so the canonical URL returns HTTP 200. Please re-check:
   https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
   Docs: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs

2. Maturity: agreed we are early (new public artefact). Happy to wait until there is clearer traction, or to be reconsidered once the URL is verified green. Canonical repo remains https://github.com/drmarktzone-stack/medscan-ai (AgentReceipt module + docs).

No rush — fixing the broken link first was the right call on your side.
```

---

## 🔔 ACTION FOR DR — kailiu42 PR (still pending)

Fork `kailiu42/awesome-coding-agents`, add under CLI Agent Helpers:

```md
| 👀 | [AgentReceipt](https://github.com/drmarktzone-stack/medscan-ai) | verification, receipts, handoff-gates | Proof-of-done gate for coding agents: run verification (e.g. npm run build), write a JSON receipt, and block the next agent if checks fail |
```

Patch: `marketing/agentreceipt/patches/kailiu42-awesome-coding-agents-agentreceipt.patch`

---

## ✅ Submitted / requested (round 6)

| Channel | Status |
|---------|--------|
| aiagenttools.dev | Resubmit id `mt8z0usaboluc` |
| kaushikb11/awesome-llm-agents | [#314](https://github.com/kaushikb11/awesome-llm-agents/issues/314) |
| natnew/Awesome-Agentic-Engineering | [#33](https://github.com/natnew/Awesome-Agentic-Engineering/issues/33) |
| pandego/awesome-agentic | [#8](https://github.com/pandego/awesome-agentic/issues/8) |
| Dmaner/awesome-agent-projects | [#3](https://github.com/Dmaner/awesome-agent-projects/issues/3) |
| (+ ~20 earlier awesome-list issues) | see prior rounds |

---

## Watching

Every 6h: re-check issues, verify live URL HTTP status, continue submissions. After Pages deploy of this fix, paste Zijian-Ni draft + open kailiu42 PR.
