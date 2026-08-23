# Outreach queue — תגובות מוכנות (העתק → הדבק)

**מוצר:** https://drmarktzone-stack.github.io/medscan-ai/agentreceipt  
**Checkout:** https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/checkout

סמן ✅ אחרי שפורסם.

---

## #1 HN — Silent failures (עדיפות עליונה)

**קישור:** https://news.ycombinator.com/item?id=47802170  
**סטטוס:** [ ] לא פורסם

```
We've been hitting the same class of failures with coding agents (Cursor Cloud / multi-agent handoffs): step N "succeeds", step N+1 inherits garbage, nothing throws.

What helped us was a hard gate between steps — not just tracing:

1. Run verification (build/tests) after each agent
2. Emit a machine-readable receipt (JSON: exit codes, files, git sha)
3. Block the next agent unless the previous receipt passes

We open-sourced a tiny version of that as AgentReceipt:
https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Curious if others enforce contracts between agent steps, or still rely on logs after the fact.
```

---

## #2 HN — Debug multi-step when output wrong

**קישור:** https://news.ycombinator.com/item?id=47059704  
**סטטוס:** [ ] לא פורסם

```
Same pain: no exception, just wrong final output. Tracing shows *what* happened; it doesn't stop bad state from propagating.

We've been treating "agent done" as untrusted until a verification receipt exists (build/tests → JSON → gate). If the gate fails, the next agent never starts.

Small OSS sketch: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Would love to hear how others encode post-conditions between steps without making the lead agent an LLM-judge of everything.
```

---

## #3 HN — Agent-harness-kit (typed handoff)

**קישור:** https://news.ycombinator.com/item?id=48047826  
**סטטוס:** [ ] לא פורסם

```
Agreed that typed handoff + terminal statuses are the right primitive.

We're exploring a thinner layer for coding agents specifically: after each agent run, force a verification receipt (exit codes) and block handoff on failure — so "posted" isn't just a status flag, it's backed by build/test evidence.

https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Curious whether you'd want receipts as part of ahk's observe step, or keep verification outside the harness.
```

---

## #4 HN — Ait multi-agent

**קישור:** https://news.ycombinator.com/item?id=48195995  
**סטטוס:** [ ] לא פורסם

```
Love the review-gate blocking apply — that's the missing piece in most "run two agents" setups.

We're working on a complementary angle: proof-of-done receipts after each agent (build/tests) so the next agent (or reviewer) gets machine-checkable evidence, not just chat summary.

https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Would this fit as an adapter hook in ait's attempt lifecycle?
```

---

## #5 Reddit r/CursorAI

**קישור:** https://www.reddit.com/r/CursorAI/submit  
**Title:** Proof-of-done after Cloud Agents? Built a tiny receipt+gate tool  
**סטטוס:** [ ] לא פורסם

```
After a few Cloud Agent runs that said "done" with a red build, I wanted a dumb hard gate:

• run verify (npm run build / tests)
• store a JSON receipt
• block the next agent unless the previous receipt passes

Open-sourced as AgentReceipt (free OSS):
https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

CLI:
npm run agentreceipt:verify -- --task my-task --agent cursor-cloud

Anyone else gating handoffs between agents, or just hoping CI catches it later?
```

---

## #6 DEV.to article (אופציונלי)

**Title:** Stop trusting "agent done" — use a verification receipt  
**סטטוס:** [ ] לא פורסם

```
# Stop trusting "agent done"

AI coding agents (Cursor Cloud, Claude Code, …) often report success while build/tests are red. Chat summaries aren't a contract.

## Pattern
1. Agent finishes
2. Run verification
3. Write a machine-readable receipt
4. Next agent starts only if gate passes

## Tiny OSS
https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Built this for our own multi-agent inbox workflow. Feedback welcome.
```

---

## #7 LinkedIn DM (סטודיו / CTO)

```
היי {שם},

ראיתי שאתם עובדים עם Cursor / Lovable / סוכני AI.
אנחנו נתקלנו בבעיה: סוכן אומר "סיימתי" וה-build אדום — ואז הסוכן הבא ממשיך על זבל.

בנינו AgentReceipt — receipt מובנה + gate בין סוכנים.
חינם לנסות: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt
Team (Bit): https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/checkout

אם רלוונטי — אשמח ל-15 דק׳ דemo.
```

---

## Tracker

| # | ערוץ | פורסם? | תאריך | תגובות/לידים |
|---|------|--------|-------|----------------|
| 1 | HN silent failures | | | |
| 2 | HN debug workflows | | | |
| 3 | HN harness-kit | | | |
| 4 | HN Ait | | | |
| 5 | Reddit CursorAI | | | |
| 6 | DEV.to | | | |
| 7 | LinkedIn DMs ×3 | | | |
| 8 | WhatsApp groups ×2 | | | |
