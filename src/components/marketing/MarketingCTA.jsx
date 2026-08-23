import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, UserPlus, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isBitConfigured, getVisionPriceIls } from "@/lib/clinic/paymentConfig";
import ShareKit from "./ShareKit";

export default function MarketingCTA() {
  const { t } = useI18n();
  const bitReady = isBitConfigured();
  const price = getVisionPriceIls();

  return (
    <section className="clinic-panel border-sky-200/80 bg-gradient-to-b from-white/90 to-sky-50/40">
      <div className="text-center mb-4">
        <p className="inline-flex items-center gap-1.5 clinic-chip-on text-[10px] font-black uppercase tracking-[0.14em] px-3 py-1 rounded-full mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          {t("marketing.live_badge")}
        </p>
        <h2 className="clinic-h2">{t("marketing.hero_title")}</h2>
        <p className="clinic-sub mt-2 max-w-lg mx-auto">{t("marketing.hero_subtitle")}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Link to="/register" className="clinic-cta inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
          <UserPlus className="w-4 h-4" />
          {t("marketing.cta_register")}
        </Link>
        <Link to="/parent" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
          {t("marketing.cta_parents")}
        </Link>
        {bitReady ? (
          <Link to="/checkout" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-amber-200 bg-amber-50/80">
            <Wallet className="w-4 h-4" />
            {t("marketing.cta_bit")} — ₪{price}
          </Link>
        ) : (
          <Link to="/pricing" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
            <Wallet className="w-4 h-4" />
            {t("pricing.nav")}
          </Link>
        )}
        <ShareKit compact />
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-4 leading-relaxed">{t("marketing.disclaimer")}</p>
    </section>
  );
}
