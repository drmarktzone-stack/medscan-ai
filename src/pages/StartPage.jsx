import React from "react";
import { Link } from "react-router-dom";
import {
  Megaphone, Stethoscope, Heart, Building2, UserPlus, Wallet, ArrowLeft, ArrowRight,
} from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import ShareKit from "@/components/marketing/ShareKit";
import { useI18n } from "@/lib/i18n";
import { isBitConfigured, getVisionPriceIls } from "@/lib/clinic/paymentConfig";

const AUDIENCES = [
  { id: "clinician", icon: Stethoscope, tone: "tone-sky", path: "/register" },
  { id: "parent", icon: Heart, tone: "tone-rose", path: "/parent" },
  { id: "gan", icon: Building2, tone: "tone-amber", path: "/parent/gan" },
];

export default function StartPage() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const bitReady = isBitConfigured();
  const price = getVisionPriceIls();

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={Megaphone}
        tone="rose"
        badgeKey="marketing.live_badge"
        titleKey="marketing.start_title"
        subtitleKey="marketing.start_subtitle"
        noteKey="marketing.disclaimer"
      />

      <main className="clinic-wrap pb-12 max-w-2xl mx-auto space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {AUDIENCES.map((a) => (
            <Link key={a.id} to={a.path} className="clinic-panel hover:border-sky-300 transition-colors">
              <div className={`clinic-icon w-11 h-11 mb-3 ${a.tone}`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-900">{t(`marketing.audience_${a.id}_title`)}</h2>
              <p className="clinic-sub mt-1">{t(`marketing.audience_${a.id}_body`)}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 mt-3">
                {t("marketing.audience_cta")}
                <Arrow className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <section className="clinic-panel">
          <h2 className="clinic-h2">{t("marketing.offer_title")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {t("marketing.offer_items").map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-600 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/register" className="clinic-cta inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
            <UserPlus className="w-4 h-4" />
            {t("marketing.cta_register")}
          </Link>
          {bitReady ? (
            <Link to="/checkout" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold border-amber-200 bg-amber-50/80">
              <Wallet className="w-4 h-4" />
              {t("marketing.cta_bit")} — ₪{price}
            </Link>
          ) : (
            <Link to="/pricing" className="clinic-chip inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold">
              {t("pricing.nav")}
            </Link>
          )}
        </div>

        <ShareKit />

        <section className="clinic-panel border-slate-200/80">
          <h2 className="clinic-h2">{t("marketing.channels_title")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
            {t("marketing.channels_items").map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap justify-center gap-3 text-xs">
          <Link to="/" className="text-sky-700 font-semibold hover:underline">{t("privacy.back_home")}</Link>
          <Link to="/launch" className="text-sky-700 font-semibold hover:underline">{t("launch.nav")}</Link>
          <Link to="/privacy" className="text-sky-700 font-semibold hover:underline">{t("privacy.nav")}</Link>
        </div>
      </main>
    </div>
  );
}
