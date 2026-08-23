import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageCircle, Copy, ExternalLink } from "lucide-react";
import AgentReceiptLayout from "@/agentreceipt/components/AgentReceiptLayout";
import {
  TEAM_PLAN,
  COMPLIANCE_PLAN,
  buildTeamSalesWhatsApp,
  getPaymentConfig,
  getBitOpenUrl,
  formatBitPhone,
} from "@/agentreceipt/lib/sales.js";
import { AGENT_RECEIPT_DOCS } from "@/agentreceipt/lib/marketing.js";

export default function AgentReceiptCheckoutPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [note, setNote] = useState("");
  const [planId, setPlanId] = useState(searchParams.get("plan") === "compliance" ? "compliance" : "team");
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const plan = planId === "compliance" ? COMPLIANCE_PLAN : TEAM_PLAN;
  const cfg = getPaymentConfig();
  const bitPhone = formatBitPhone(cfg.bitPhone);

  const openWhatsApp = () => {
    const url = buildTeamSalesWhatsApp({ email, note, planId });
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  const copyPhone = () => {
    navigator.clipboard?.writeText(cfg.bitPhone || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AgentReceiptLayout backTo="/agentreceipt/pricing">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-center mb-2">רכישת AgentReceipt</h1>
        <p className="text-center text-white/60 text-sm mb-8">
          תשלום ב-Bit + אישור ב-WhatsApp. הפעלה ידנית תוך 24 שעות.
        </p>

        {sent ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-bold text-emerald-200">נפתח WhatsApp — שלח את ההודעה</p>
            <p className="text-sm text-white/70">
              העבר ₪{plan.price_ils} ב-Bit ל-{bitPhone}, צרף צילום מסך באותה שיחה.
            </p>
            <Link to="/agentreceipt/docs" className="text-violet-300 text-sm underline">
              בינתיים — התחל עם הגרסה החינמית
            </Link>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlanId("team")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border ${planId === "team" ? "border-violet-500 bg-violet-600/30" : "border-white/15"}`}
              >
                Team ₪{TEAM_PLAN.price_ils}
              </button>
              <button
                type="button"
                onClick={() => setPlanId("compliance")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border ${planId === "compliance" ? "border-violet-500 bg-violet-600/30" : "border-white/15"}`}
              >
                Compliance ₪{COMPLIANCE_PLAN.price_ils}
              </button>
            </div>

            <input
              type="email"
              required
              placeholder="מייל לחשבון"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2.5 text-sm"
            />
            <textarea
              placeholder="מה אתם מריצים? (Cursor, Lovable, MedScan…)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2.5 text-sm min-h-[80px]"
            />

            <div className="rounded-xl bg-black/30 p-4 text-sm space-y-2">
              <p className="font-bold">שלבים:</p>
              <ol className="list-decimal list-inside text-white/70 space-y-1">
                <li>לחץ WhatsApp — נשלחת הודעה מוכנה</li>
                <li>העבר ₪{plan.price_ils} ב-Bit ל-{bitPhone}</li>
                <li>צרף צילום אישור Bit באותה שיחה</li>
              </ol>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={copyPhone} className="text-xs flex items-center gap-1 text-violet-300">
                  <Copy className="w-3 h-3" /> {copied ? "הועתק" : "העתק Bit"}
                </button>
                {getBitOpenUrl(cfg.bitPhone) ? (
                  <a href={getBitOpenUrl(cfg.bitPhone)} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-violet-300">
                    <ExternalLink className="w-3 h-3" /> פתח Bit
                  </a>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              disabled={!email.includes("@")}
              onClick={openWhatsApp}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              שלח ב-WhatsApp וקבל Team
            </button>

            <p className="text-center text-xs text-white/45">
              חינם לניסוי? <a href={AGENT_RECEIPT_DOCS()} className="text-violet-300 underline">תיעוד OSS</a>
            </p>
          </div>
        )}
      </div>
    </AgentReceiptLayout>
  );
}
