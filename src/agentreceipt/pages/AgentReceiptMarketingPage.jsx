import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Copy, CheckCircle2, ExternalLink, MessageCircle, Share2 } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import {
  pitchHe,
  pitchEn,
  whatsAppBroadcastUrl,
  twitterShareUrl,
  AGENT_RECEIPT_HOME,
  AGENT_RECEIPT_CHECKOUT,
  DIRECTORY_SUBMISSIONS,
} from "@/agentreceipt/lib/marketing.js";

function CopyBlock({ label, text }) {
  const [ok, setOk] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex justify-between items-center px-3 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs font-bold">{label}</span>
        <button type="button" onClick={copy} className="text-xs text-violet-300 flex items-center gap-1">
          {ok ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {ok ? "הועתק" : "העתק"}
        </button>
      </div>
      <pre className="p-3 text-xs text-white/65 whitespace-pre-wrap font-sans">{text}</pre>
    </div>
  );
}

export default function AgentReceiptMarketingPage() {
  const home = useMemo(() => AGENT_RECEIPT_HOME(), []);
  const checkout = useMemo(() => AGENT_RECEIPT_CHECKOUT(), []);

  return (
    <AgentReceiptLayout>
      <h1 className="text-3xl font-extrabold mb-2">שיווק</h1>
      <p className="text-white/60 text-sm mb-6">קישורים חיים + כפתורי שיתוף. העתק ל-directories.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <a href={whatsAppBroadcastUrl("he")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-sm font-bold">
          <MessageCircle className="w-4 h-4" /> שתף ב-WhatsApp
        </a>
        <a href={twitterShareUrl("he")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-bold">
          <Share2 className="w-4 h-4" /> שתף ב-X
        </a>
        <Link to="/agentreceipt/checkout" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-sm font-bold">
          דף מכירה
        </Link>
      </div>

      <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 mb-8 text-sm">
        <p><strong>URL:</strong> <a href={home} className="text-violet-300 underline">{home}</a></p>
        <p className="mt-1"><strong>Checkout:</strong> <a href={checkout} className="text-violet-300 underline">{checkout}</a></p>
      </div>

      <div className="space-y-4 mb-10">
        <CopyBlock label="פיץ' עברית" text={pitchHe()} />
        <CopyBlock label="Pitch English" text={pitchEn()} />
      </div>

      <h2 className="font-bold mb-3">Submit ל-directories</h2>
      <ul className="space-y-2 mb-8">
        {DIRECTORY_SUBMISSIONS.map((d) => (
          <li key={d.name}>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200">
              <ExternalLink className="w-4 h-4" /> {d.name}
            </a>
          </li>
        ))}
      </ul>

      <CopyBlock
        label="TAAFT / Futurepedia — תיאור קצר (EN)"
        text={`AgentReceipt — proof-of-done for AI coding agents (Cursor, Cloud, Lovable). Runs build verification, stores structured JSON receipts, blocks agent handoff on failure. Free OSS + Team plan.

URL: ${home}
Docs: ${home}/docs
Category: Developer Tools, AI Agents, CI/CD`}
      />
    </AgentReceiptLayout>
  );
}
