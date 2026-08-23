import React from "react";
import { Share2, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { whatsAppShareUrl, nativeShare } from "../lib/marketing.js";
import { valueProposition } from "../lib/subscription.js";

export default function ShareBanner({ locale = "he", compact = false }) {
  const vp = valueProposition(locale);

  if (compact) {
    return (
      <Link
        to="/freeai/pricing"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all"
      >
        <Crown className="w-3 h-3" />
        Pro ₪20/{locale === "he" ? "חודש" : "mo"}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-bold text-white">{vp.headline}</p>
        <p className="text-xs text-white/50">{vp.cta}</p>
      </div>
      <div className="flex gap-2">
        <Link to="/freeai/pricing" className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">
          ₪20/{locale === "he" ? "חודש" : "mo"}
        </Link>
        <a
          href={whatsAppShareUrl(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-green-600/30 text-green-300 text-xs font-bold flex items-center gap-1"
        >
          <Share2 className="w-3 h-3" /> {locale === "he" ? "שתף" : "Share"}
        </a>
      </div>
    </div>
  );
}
