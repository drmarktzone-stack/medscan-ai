import React, { useState } from "react";
import { Copy, CheckCircle2, ExternalLink } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";

const DIRECTORIES = [
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new" },
  { name: "There's An AI For That", url: "https://theresanaiforthat.com/submit/" },
  { name: "Futurepedia", url: "https://www.futurepedia.io/submit-tool" },
  { name: "Hacker News — Show HN", url: "https://news.ycombinator.com/submit" },
];

const PITCH_HE = `AgentReceipt — הוכחת סיום לסוכני AI

כש-Cursor / Cloud Agent אומר "סיימתי" — אין JSON עם build/tests.
AgentReceipt מריץ verify, שומר Receipt, וחוסם handoff לסוכן הבא אם נכשל.

חינם (OSS) · Team waitlist · אינטגרציה ל-MedScan inbox

🔗 https://YOUR-DOMAIN/agentreceipt`;

const PITCH_EN = `AgentReceipt — proof-of-done for AI agents

When your Cursor/Cloud agent says "done" — there's no structured build/test receipt.
AgentReceipt runs verification, stores a machine-readable Receipt, and blocks the next agent if checks fail.

Free OSS · Team waitlist · MedScan inbox integration

🔗 https://YOUR-DOMAIN/agentreceipt`;

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
        <button type="button" onClick={copy} className="text-xs text-violet-300 flex items-center gap-1">
          {ok ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {ok ? 'הועתק' : 'העתק'}
        </button>
      </div>
      <pre className="p-3 text-xs text-white/65 whitespace-pre-wrap font-sans">{text}</pre>
    </div>
  );
}

export default function AgentReceiptMarketingPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR-DOMAIN';

  return (
    <AgentReceiptLayout>
      <h1 className="text-3xl font-extrabold mb-2">שיווק</h1>
      <p className="text-white/60 text-sm mb-8">העתק, פרסם, שלח. החלף YOUR-DOMAIN בכתובת החיה.</p>

      <div className="space-y-4 mb-10">
        <CopyBlock label="פיץ' עברית" text={PITCH_HE.replace('https://YOUR-DOMAIN', origin)} />
        <CopyBlock label="Pitch English" text={PITCH_EN.replace('https://YOUR-DOMAIN', origin)} />
      </div>

      <h2 className="font-bold mb-3">Submit ל-directories</h2>
      <ul className="space-y-2">
        {DIRECTORIES.map((d) => (
          <li key={d.name}>
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200">
              <ExternalLink className="w-4 h-4" /> {d.name}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <strong>כנה:</strong> עדיין אין Stripe. Waitlist + מייל. מכירה אמיתית מתחילה כשיש 1 לקוח שמשלם ידנית (Bit/העברה) על Team.
      </div>
    </AgentReceiptLayout>
  );
}
