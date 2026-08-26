# AgentReceipt — submissions & demand watch

Updated: 2026-08-26 ~06:05 UTC  
Product: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt  
**Demand watch:** timer every 6h (`agentreceipt-demand-watch`)

---

## Demand status

| Item | Status |
|------|--------|
| Live `/agentreceipt` | **HTTP 404** (unchanged) |
| PR [#19](https://github.com/drmarktzone-stack/medscan-ai/pull/19) | OPEN, mergeable, CI green — **not merged** |
| Zijian-Ni#90 | CLOSED — rejected for 404 |
| kailiu42#32 | CLOSED — invited PR; not listed |
| Other issues | OPEN, 0 comments |
| aiagenttools search | 0 hits |

**Verdict (demand-watch #8):** Still blocked on merging #19. Opening more listing issues while the URL 404s has diminishing returns.

---

## 🚨 DR — merge #19

1. Merge https://github.com/drmarktzone-stack/medscan-ai/pull/19  
2. Wait for Pages deploy  
3. `curl -o /dev/null -w "%{http_code}\n" https://drmarktzone-stack.github.io/medscan-ai/agentreceipt` → **200**  
4. Paste Zijian-Ni draft (below) + open kailiu42 PR

### Zijian-Ni#90 draft (after 200)

```text
Thanks for the clear quality-gate feedback — appreciated.

1. Live URL: /agentreceipt was incorrectly served as HTTP 404 via Pages' SPA fallback. We now materialize dist/agentreceipt/index.html so the canonical URL returns HTTP 200:
   https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
   Docs: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs

2. Maturity: agreed we are early. Happy to wait for clearer traction, or reconsider once the URL is verified green.
   Repo: https://github.com/drmarktzone-stack/medscan-ai
```

### kailiu42 row

```md
| 👀 | [AgentReceipt](https://github.com/drmarktzone-stack/medscan-ai) | verification, receipts, handoff-gates | Proof-of-done gate for coding agents: run verification (e.g. npm run build), write a JSON receipt, and block the next agent if checks fail |
```

---

## Round 8 submissions

| Channel | Status |
|---------|--------|
| aiagenttools.dev | `mt9oqwvu6yazv` |
| 0xWelt/Awesome-Vibe-Coding | [#262](https://github.com/0xWelt/Awesome-Vibe-Coding/issues/262) |
| awesome-vibe-coding/awesome-vibe-coding | [#140](https://github.com/awesome-vibe-coding/awesome-vibe-coding/issues/140) |

---

## Watching

Every 6h. Priority remains: **merge #19 → URL 200 → reply Zijian-Ni + kailiu42 PR**.
