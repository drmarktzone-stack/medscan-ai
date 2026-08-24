import React from "react";
import { Link } from "react-router-dom";
import { Receipt, ArrowLeft } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/agentreceipt/product.js";

export default function AgentReceiptLayout({ children, backTo = "/agentreceipt" }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" dir="rtl">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={backTo} className="flex items-center gap-2 font-bold text-white hover:text-violet-300 transition-colors">
            <Receipt className="w-5 h-5 text-violet-400" />
            {PRODUCT_NAME}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/agentreceipt/docs" className="text-white/70 hover:text-white">תיעוד</Link>
            <Link to="/agentreceipt/console" className="text-white/70 hover:text-white">Console</Link>
            <Link to="/agentreceipt/pricing" className="text-violet-300 font-semibold hover:text-violet-200">מחירים</Link>
            <Link to="/agentreceipt/marketing" className="text-white/70 hover:text-white">שיווק</Link>
            <Link to="/agentreceipt/checkout" className="text-emerald-400 font-semibold hover:text-emerald-300">קנה</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-white/40 border-t border-white/5">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-white/60">
          <ArrowLeft className="w-3 h-3" /> חזרה ל-MedScan
        </Link>
      </footer>
    </div>
  );
}
