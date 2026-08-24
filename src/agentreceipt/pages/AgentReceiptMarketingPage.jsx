import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, CheckCircle2, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import {
  whatsAppBroadcastUrl,
  twitterShareUrl,
  AGENT_RECEIPT_HOME,
  AGENT_RECEIPT_CHECKOUT,
  DIRECTORY_SUBMISSIONS,
} from "@/agentreceipt/lib/marketing.js";
import {
  LIVE,
  WHATSAPP_REPLIES,
  BROADCASTS,
  DIRECTORY_PACK,
} from "@/agentreceipt/lib/templates.js";

const OUTREACH_SNIPPETS = [
  {
    id: "hn1",
    titleHe: "HN #1 — Silent failures (הכי חשוב)",
    url: "https://news.ycombinator.com/item?id=47802170",
    text: `We've been hitting the same class of failures with coding agents (Cursor Cloud / multi-agent handoffs): step N "succeeds", step N+1 inherits garbage, nothing throws.

What helped us was a hard gate between steps — not just tracing:

1. Run verification (build/tests) after each agent
2. Emit a machine-readable receipt (JSON: exit codes, files, git sha)
3. Block the next agent unless the previous receipt passes

We open-sourced a tiny version of that as AgentReceipt:
https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Curious if others enforce contracts between agent steps, or still rely on logs after the fact.`,
  },
  {
    id: "reddit",
    titleHe: "Reddit r/CursorAI",
    url: "https://www.reddit.com/r/CursorAI/submit",
    text: `After a few Cloud Agent runs that said "done" with a red build, I wanted a dumb hard gate:

• run verify (npm run build / tests)
• store a JSON receipt
• block the next agent unless the previous receipt passes

Open-sourced as AgentReceipt (free OSS):
https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

Anyone else gating handoffs between agents, or just hoping CI catches it later?`,
  },
  {
    id: "showhn",
    titleHe: "Show HN — submit חדש",
    url: "https://news.ycombinator.com/submit",
    text: `Show HN: AgentReceipt – proof-of-done for AI coding agents

URL: https://drmarktzone-stack.github.io/medscan-ai/agentreceipt

When Cursor/Cloud agents say "done", there's often no structured proof that build/tests passed. AgentReceipt runs verification, stores a JSON receipt, and blocks the next agent handoff on failure. Free OSS CLI.`,
  },
];

function CopyBlock({ label, text }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex justify-between items-center px-3 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs font-bold">{label}</span>
        <button type="button" onClick={copy} className="text-xs text-violet-300 flex items-center gap-1 shrink-0">
          {ok ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {ok ? "הועתק" : "העתק"}
        </button>
      </div>
      <pre className="p-3 text-xs text-white/65 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">{text}</pre>
    </div>
  );
}

export default function AgentReceiptMarketingPage() {
  const home = AGENT_RECEIPT_HOME();
  const checkout = AGENT_RECEIPT_CHECKOUT();

  return (
    <AgentReceiptLayout>
      <h1 className="text-3xl font-extrabold mb-2">שיווק + מכירה</h1>
      <p className="text-white/60 text-sm mb-6">העתק → הדבק. תשובות WhatsApp מוכנות כשמגיע לקוח.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <a href={whatsAppBroadcastUrl("he")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-sm font-bold">
          <MessageCircle className="w-4 h-4" /> שתף ב-WhatsApp
        </a>
        <a href={twitterShareUrl("he")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-bold">
          <Share2 className="w-4 h-4" /> X
        </a>
        <Link to="/agentreceipt/checkout" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-bold">
          דף מכירה
        </Link>
      </div>

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 mb-8 text-sm space-y-2">
        <p className="font-bold text-emerald-300">פרסום באתרי מפתחים + מעקב ביקוש</p>
        <p className="text-xs text-amber-200/90">נכון לעכשיו: אין תשובות ממנהלי awesome-lists (0 comments). מעקב אוטומטי כל 6 שעות.</p>
        <ul className="text-white/70 space-y-1 text-xs list-disc list-inside">
          <li>AI Agent Tools directory — submitted</li>
          <li>12+ listing issues ב-awesome lists (e2b, Claude Code, Cursor, DevOps AI…)</li>
          <li>לוג: marketing/agentreceipt/SUBMISSIONS.md</li>
        </ul>
      </div>

      <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 mb-8 text-sm space-y-1">
        <p><strong>Live:</strong> <a href={home} className="text-violet-300 underline break-all">{LIVE.home}</a></p>
        <p><strong>Checkout:</strong> <a href={checkout} className="text-violet-300 underline break-all">{LIVE.checkout}</a></p>
        <p><strong>Bit:</strong> {LIVE.bitPhone} · Team ₪149</p>
      </div>

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-1 text-amber-300">מציאת קונים — תגובות מוכנות</h2>
        <p className="text-xs text-white/50 mb-4">
          העתק → פתח את הקישור → הדבק. אני לא יכול להתחבר ל-HN/Reddit בלי החשבון שלך.
        </p>
        <div className="space-y-3">
          {OUTREACH_SNIPPETS.map((o) => (
            <div key={o.id} className="space-y-1">
              <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-300 flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> פתח thread / submit
              </a>
              <CopyBlock label={o.titleHe} text={o.text} />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-1 text-emerald-300">תשובות WhatsApp שלך</h2>
        <p className="text-xs text-white/50 mb-4">כשמגיע צילום Bit — העתק תשובה מתאימה</p>
        <div className="space-y-3">
          {WHATSAPP_REPLIES.map((r) => (
            <CopyBlock key={r.id} label={r.titleHe} text={r.text} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-4">שיתוף / פוסטים</h2>
        <div className="space-y-3">
          {BROADCASTS.map((b) => (
            <CopyBlock key={b.id} label={b.titleHe} text={b.text} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold text-lg mb-3">Directories</h2>
        <ul className="space-y-2 mb-4">
          {DIRECTORY_SUBMISSIONS.map((d) => (
            <li key={d.name}>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200">
                <ExternalLink className="w-4 h-4" /> {d.name}
              </a>
            </li>
          ))}
        </ul>
        <CopyBlock
          label="טופס submission (EN)"
          text={`Name: ${DIRECTORY_PACK.name}
Tagline: ${DIRECTORY_PACK.tagline}
URL: ${DIRECTORY_PACK.url}
Category: ${DIRECTORY_PACK.category}

${DIRECTORY_PACK.descriptionEn}`}
        />
      </section>

      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <strong>רשימה שלך (15 דק׳):</strong>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-white/70">
          <li>לחץ &quot;שתף ב-WhatsApp&quot; לקבוצה אחת</li>
          <li>העתק Show HN → news.ycombinator.com/submit</li>
          <li>העתק Reddit → r/cursor</li>
          <li>כשמגיע Bit → תשובה #1</li>
        </ol>
      </div>
    </AgentReceiptLayout>
  );
}
