import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Wallet, Sparkles, Clock } from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import UnlockCodePanel from "@/components/payment/UnlockCodePanel";
import { useI18n } from "@/lib/i18n";
import { getVisionPriceIls, isBitConfigured } from "@/lib/clinic/paymentConfig";
import { isVisionPendingVerification } from "@/lib/clinic/visionSubscription";

export default function VisionUpsellPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const price = getVisionPriceIls();
  const pending = isVisionPendingVerification();
  const bitReady = isBitConfigured();

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={Lock}
        tone="amber"
        badgeKey="sell.badge"
        titleKey="sell.title"
        subtitleKey="sell.subtitle"
        noteKey="sell.disclaimer"
      />
      <main className="clinic-wrap pb-12 max-w-lg mx-auto space-y-5">
        {pending ? (
          <div className="clinic-panel border-amber-200 bg-amber-50/60 flex gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed">{t("sell.pending_body")}</p>
          </div>
        ) : null}

        <section className="clinic-panel border-sky-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-sky-600" />
            <h2 className="clinic-h2">{t("sell.includes_title")}</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            {t("sell.includes_items").map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-2xl font-black text-sky-900 mt-4">₪{price}<span className="text-sm font-semibold text-slate-500"> / {t("sell.period")}</span></p>
        </section>

        {bitReady ? (
          <Link to="/checkout" className="clinic-cta w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold">
            <Wallet className="w-4 h-4" />
            {t("sell.cta_checkout")} — ₪{price}
          </Link>
        ) : (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">{t("checkout.bit_not_configured")}</p>
        )}

        <UnlockCodePanel onUnlocked={() => navigate("/ecg", { replace: true })} />

        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <Link to="/pricing" className="text-sky-700 font-semibold hover:underline">{t("pricing.nav")}</Link>
          <Link to="/" className="text-sky-700 font-semibold hover:underline">{t("privacy.back_home")}</Link>
        </div>
      </main>
    </div>
  );
}
