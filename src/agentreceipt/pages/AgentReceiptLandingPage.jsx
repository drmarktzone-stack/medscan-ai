import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, GitBranch, Terminal, ArrowRight, CheckCircle2 } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import { PRODUCT_NAME, PRODUCT_TAGLINE_HE } from "@/lib/agentreceipt/browser.js";

const STEPS = [
  { icon: Terminal, title: "סוכן AI מסיים", body: "Cursor, Cloud, Lovable, MedScan — לא משנה. מריצים verify." },
  { icon: ShieldCheck, title: "Receipt + Gate", body: "build/tests → JSON. Gate חוסם handoff אם נכשל." },
  { icon: GitBranch, title: "Handoff הבא", body: "סוכן B קורא receipt, לא סיכום צ'אט." },
];

export default function AgentReceiptLandingPage() {
  return (
    <AgentReceiptLayout>
      <section className="text-center space-y-6 pb-12">
        <p className="text-violet-400 text-sm font-bold tracking-wide">CI לסוכני AI</p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          {PRODUCT_NAME}
          <span className="block text-lg md:text-xl font-normal text-white/60 mt-3">{PRODUCT_TAGLINE_HE}</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto leading-relaxed">
          כשסוכן AI אומר &quot;סיימתי&quot; — אין הוכחה. AgentReceipt מריץ build, שומר receipt מובנה,
          וחוסם את הסוכן הבא אם הבדיקות נכשלו.
        </p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            to="/agentreceipt/docs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm transition-colors"
          >
            התחל בחינם <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/agentreceipt/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-bold text-sm"
          >
            מחירים + Waitlist
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 pb-12">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Icon className="w-8 h-8 text-violet-400 mb-3" />
            <h2 className="font-bold text-lg mb-2">{title}</h2>
            <p className="text-sm text-white/65 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          כבר בתוך MedScan
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          אינטגרציה ל-<code className="text-emerald-300">prompts/inbox</code>: אחרי כל פרומפט —
          <code className="text-emerald-300 mx-1">npm run agentreceipt:verify</code>
          או <code className="text-emerald-300">inbox-done</code>. רק receipt ירוק → מעבר ל-done.
        </p>
        <pre className="text-xs bg-black/40 rounded-lg p-4 overflow-x-auto text-left" dir="ltr">{`node scripts/agentreceipt.mjs inbox-done \\
  --prompt prompts/inbox/02_skin_upgrade.md \\
  --agent cursor-cloud`}</pre>
      </section>
    </AgentReceiptLayout>
  );
}
