import React, { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import {
  PRICING_PLANS,
  appendWaitlist,
  loadLedgerFromStorage,
  saveLedgerToStorage,
} from "@/lib/agentreceipt/browser.js";

const WAITLIST_KEY = 'agentreceipt_waitlist_v1';

function loadWaitlist() {
  try {
    return JSON.parse(localStorage.getItem(WAITLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWaitlist(entries) {
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
}

export default function AgentReceiptPricingPage() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('team');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(() => loadWaitlist().length);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const entry = {
      email: email.trim(),
      plan,
      note: note.trim(),
      created_at: new Date().toISOString(),
    };
    const list = [...loadWaitlist(), entry];
    saveWaitlist(list);
    let ledger = loadLedgerFromStorage(localStorage) ?? emptyLedger();
    ledger = appendWaitlist(ledger, entry);
    saveLedgerToStorage(ledger, localStorage);
    setCount(list.length);
    setDone(true);
  };

  return (
    <AgentReceiptLayout>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold">מחירים</h1>
        <p className="text-white/60 mt-2 text-sm">Team / Compliance — waitlist. תשלום יופעל כשיש Stripe / Bit.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {PRICING_PLANS.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-5 flex flex-col ${p.highlight ? 'border-violet-500 bg-violet-950/40' : 'border-white/10 bg-white/5'}`}
          >
            <h2 className="font-bold text-lg">{p.name_he}</h2>
            <p className="text-3xl font-extrabold mt-2">
              {p.price_ils === 0 ? 'חינם' : `₪${p.price_ils}`}
              {p.price_ils > 0 && <span className="text-sm font-normal text-white/50"> / {p.period_he}</span>}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70 flex-1">
              {p.features_he.map((f) => (
                <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-bold text-lg mb-1">Waitlist — Team / Compliance</h2>
        <p className="text-xs text-white/50 mb-4">נשמר מקומית + ledger בדפדפן. ייצוא ידני ל-CRM עד חיבור Supabase.</p>
        {done ? (
          <div className="text-center py-6 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
            <p className="font-bold">נרשמת. ניצור קשר ב-{email}</p>
            <p className="text-xs text-white/50 mt-2">סה״כ waitlist (מכשיר זה): {count}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            />
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
            >
              <option value="team">Team — ₪149/חודש</option>
              <option value="compliance">Compliance — ₪490/חודש</option>
            </select>
            <textarea
              placeholder="מה אתם מריצים? (Cursor + Lovable + …)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm min-h-[72px]"
            />
            <button type="submit" className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold text-sm">
              הצטרף ל-waitlist
            </button>
          </form>
        )}
        <a
          href="mailto:?subject=AgentReceipt%20Team%20waitlist"
          className="mt-4 flex items-center justify-center gap-2 text-xs text-violet-300 hover:text-violet-200"
        >
          <Mail className="w-3 h-3" /> או מייל ישיר
        </a>
      </div>
    </AgentReceiptLayout>
  );
}
