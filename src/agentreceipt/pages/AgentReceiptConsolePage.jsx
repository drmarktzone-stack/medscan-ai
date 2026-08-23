import React, { useMemo, useState } from "react";
import { RefreshCw, Download } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import {
  loadLedgerFromStorage,
  saveLedgerToStorage,
  emptyLedger,
  appendReceipt,
  buildReceipt,
  gateForTask,
} from "@/lib/agentreceipt/browser.js";

const DEMO_RECEIPT = () => buildReceipt({
  receipt_id: `rcpt_demo_${Date.now()}`,
  task_id: 'demo:handoff',
  agent_id: 'cursor-cloud-demo',
  agent_platform: 'cursor-cloud',
  status: 'done',
  summary_he: 'דemo — build עבר',
  checks: { commands: [{ name: 'npm run build', exit_code: 0, duration_ms: 4200 }] },
});

export default function AgentReceiptConsolePage() {
  const [tick, setTick] = useState(0);
  const ledger = useMemo(() => loadLedgerFromStorage(typeof localStorage !== 'undefined' ? localStorage : null) ?? emptyLedger(), [tick]);

  const addDemo = () => {
    let l = loadLedgerFromStorage(localStorage) ?? emptyLedger();
    l = appendReceipt(l, DEMO_RECEIPT());
    saveLedgerToStorage(l, localStorage);
    setTick((x) => x + 1);
  };

  const clear = () => {
    saveLedgerToStorage(emptyLedger(), localStorage);
    setTick((x) => x + 1);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(ledger, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentreceipt-ledger.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tasks = Object.values(ledger.tasks ?? {});

  return (
    <AgentReceiptLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Console</h1>
          <p className="text-sm text-white/50">Ledger מקומי (localStorage). CLI כותב ל-<code>.agentreceipt/ledger.json</code></p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setTick((x) => x + 1)} className="px-3 py-2 rounded-lg border border-white/15 text-xs font-bold flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> רענן
          </button>
          <button type="button" onClick={addDemo} className="px-3 py-2 rounded-lg bg-violet-600 text-xs font-bold">+ Demo receipt</button>
          <button type="button" onClick={exportJson} className="px-3 py-2 rounded-lg border border-white/15 text-xs font-bold flex items-center gap-1">
            <Download className="w-3 h-3" /> ייצוא
          </button>
          <button type="button" onClick={clear} className="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 text-xs font-bold">נקה</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <p className="text-xs text-white/50">Receipts</p>
          <p className="text-2xl font-bold">{ledger.receipts?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <p className="text-xs text-white/50">Tasks</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <p className="text-xs text-white/50">Waitlist</p>
          <p className="text-2xl font-bold">{ledger.waitlist?.length ?? 0}</p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-white/50">אין משימות. הרץ CLI או הוסף demo.</p>
        ) : tasks.map((task) => {
          const g = gateForTask(ledger, task.task_id);
          return (
            <div key={task.task_id} className="rounded-xl border border-white/10 p-4 bg-black/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{task.task_id}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${g.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {g.ok ? 'GATE OK' : `GATE FAIL: ${g.reason}`}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">agent: {task.last_agent_id} · status: {task.status}</p>
            </div>
          );
        })}
      </div>

      <pre className="mt-8 text-xs bg-black/40 rounded-lg p-4 overflow-auto max-h-64 text-left" dir="ltr">
        {JSON.stringify(ledger, null, 2)}
      </pre>
    </AgentReceiptLayout>
  );
}
