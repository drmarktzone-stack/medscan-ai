import React from "react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";

export default function AgentReceiptDocsPage() {
  return (
    <AgentReceiptLayout>
      <h1 className="text-3xl font-extrabold mb-6">תיעוד</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section className="rounded-xl border border-white/10 p-5 bg-white/5">
          <h2 className="text-lg font-bold mb-2">התקנה</h2>
          <p className="text-white/70">כבר בתוך repo MedScan. אין npm package נפרד ב-v0.</p>
          <pre className="mt-3 bg-black/40 p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">{`npm run agentreceipt:verify -- --task TASK_ID --agent AGENT_ID
npm run agentreceipt:status`}</pre>
        </section>

        <section className="rounded-xl border border-white/10 p-5 bg-white/5">
          <h2 className="text-lg font-bold mb-2">Gate — חסימת handoff</h2>
          <p className="text-white/70">סוכן B לא מתחיל אם receipt של A נכשל:</p>
          <pre className="mt-3 bg-black/40 p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">{`node scripts/agentreceipt.mjs gate --task step2 --requires step1`}</pre>
        </section>

        <section className="rounded-xl border border-white/10 p-5 bg-white/5">
          <h2 className="text-lg font-bold mb-2">Receipt JSON</h2>
          <pre className="bg-black/40 p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">{`{
  "version": "0.1.0",
  "receipt_id": "rcpt_...",
  "task_id": "inbox:02_skin",
  "agent_id": "cursor-cloud",
  "agent_platform": "cursor-cloud",
  "status": "done",
  "checks": { "commands": [{ "name": "build", "exit_code": 0 }] }
}`}</pre>
        </section>

        <p className="text-white/50 text-xs">
          מסמך מלא: <code>docs/AGENT_RECEIPT.md</code> ב-repo.
        </p>
      </div>
    </AgentReceiptLayout>
  );
}
