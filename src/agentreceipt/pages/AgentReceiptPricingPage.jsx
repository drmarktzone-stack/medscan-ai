import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import { PRICING_PLANS } from "@/lib/agentreceipt/browser.js";

export default function AgentReceiptPricingPage() {
  return (
    <AgentReceiptLayout>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold">מחירים</h1>
        <p className="text-white/60 mt-2 text-sm">Team — Bit + WhatsApp · Compliance — לפי הצעה</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {PRICING_PLANS.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-5 flex flex-col ${p.highlight ? "border-violet-500 bg-violet-950/40" : "border-white/10 bg-white/5"}`}
          >
            <h2 className="font-bold text-lg">{p.name_he}</h2>
            <p className="text-3xl font-extrabold mt-2">
              {p.price_ils === 0 ? "חינם" : `₪${p.price_ils}`}
              {p.price_ils > 0 && <span className="text-sm font-normal text-white/50"> / {p.period_he}</span>}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70 flex-1">
              {p.features_he.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {p.id === "oss" ? (
              <Link to="/agentreceipt/docs" className="mt-4 text-center py-2.5 rounded-lg border border-white/20 text-sm font-bold">
                התחל בחינם
              </Link>
            ) : (
              <Link
                to={`/agentreceipt/checkout?plan=${p.id}`}
                className={`mt-4 text-center py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${p.highlight ? "bg-emerald-600 hover:bg-emerald-500" : "bg-violet-600 hover:bg-violet-500"}`}
              >
                <MessageCircle className="w-4 h-4" />
                {p.id === "team" ? "קנה ב-Bit + WhatsApp" : "בקש הצעה"}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-5 text-sm text-white/80">
        <p className="font-bold text-emerald-300 mb-2">איך זה עובד (ללא Stripe)</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>לוחצים checkout → נפתח WhatsApp עם הודעה מוכנה</li>
          <li>מעבירים Bit לפי הסכום</li>
          <li>שולחים צילום — מקבלים גישת Team תוך 24 שעות</li>
        </ol>
      </div>
    </AgentReceiptLayout>
  );
}
