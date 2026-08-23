import React from "react";
import { Link } from "react-router-dom";
import { CreditCard, Sparkles, Smartphone, ExternalLink, Wallet } from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import { VISION_BILLING_GROUP } from "@/lib/clinic/billingGroups";
import { isBitConfigured, getVisionPriceIls } from "@/lib/clinic/paymentConfig";
import { useI18n } from "@/lib/i18n";

export default function PricingPage() {
  const { t } = useI18n();
  const visionOpen = !VISION_BILLING_GROUP.paywall_enabled;
  const bitReady = isBitConfigured();
  const price = getVisionPriceIls();

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero icon={CreditCard} tone="amber" titleKey="pricing.title" subtitleKey="pricing.subtitle" />
      <main className="clinic-wrap pb-12 space-y-6 max-w-2xl mx-auto">
        <div className="grid gap-4">
          <div className="clinic-panel border-emerald-200/80">
            <div className="flex items-start gap-3">
              <div className="clinic-icon w-11 h-11 tone-sky shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="clinic-h2">{t("pricing.free_title")}</h2>
                <p className="clinic-sub mt-1">{t("pricing.free_body")}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                  {t("pricing.free_items").map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-emerald-600">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="clinic-panel border-amber-200/80">
            <div className="flex items-start gap-3">
              <div className="clinic-icon w-11 h-11 tone-amber shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="clinic-h2">{t("pricing.vision_title")}</h2>
                <p className="clinic-sub mt-1">
                  {visionOpen ? t("pricing.vision_open") : t("pricing.vision_paid")}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                  {t("pricing.vision_items").map((item) => (
                    <li key={item} className="flex gap-2"><span className="text-amber-600">◆</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="clinic-panel">
            <h2 className="clinic-h2">{t("pricing.channels_title")}</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {t("pricing.channels").map((c) => (
                <li key={c.title}>
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {bitReady ? (
            <Link to="/checkout" className="clinic-cta inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
              <Wallet className="w-4 h-4" />
              {t("pricing.checkout_cta")} — ₪{price}
            </Link>
          ) : null}
          <Link to="/launch" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
            <Smartphone className="w-4 h-4" />
            {t("launch.nav")}
          </Link>
          <a
            href="https://www.pwabuilder.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="clinic-chip inline-flex items-center gap-2"
          >
            PWABuilder
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}
