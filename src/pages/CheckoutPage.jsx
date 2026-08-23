import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import BitPayPanel from "@/components/payment/BitPayPanel";
import UnlockCodePanel from "@/components/payment/UnlockCodePanel";
import { useI18n } from "@/lib/i18n";
import { getVisionPriceIls } from "@/lib/clinic/paymentConfig";

export default function CheckoutPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const amount = getVisionPriceIls();

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero icon={Wallet} tone="amber" titleKey="checkout.title" subtitleKey="checkout.subtitle" />
      <main className="clinic-wrap pb-12 max-w-lg mx-auto space-y-5">
        <BitPayPanel amountIls={amount} />
        <UnlockCodePanel compact onUnlocked={() => navigate("/ecg", { replace: true })} />
        <p className="text-[11px] text-slate-500 text-center leading-relaxed px-2">
          {t("checkout.disclaimer")}
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Link to="/pricing" className="text-sky-700 font-semibold hover:underline">{t("pricing.nav")}</Link>
          <Link to="/" className="text-sky-700 font-semibold hover:underline">{t("privacy.back_home")}</Link>
        </div>
      </main>
    </div>
  );
}
