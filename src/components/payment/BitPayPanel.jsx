import React, { useMemo, useState } from "react";
import { Smartphone, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  bitPaymentSummary,
  copyToClipboard,
  markBitPaymentPending,
  openBitApp,
  readBitPaymentPending,
  clearBitPaymentPending,
} from "@/lib/clinic/bitPayment";
import { getStripePaymentLink, isBitConfigured } from "@/lib/clinic/paymentConfig";

export default function BitPayPanel({ amountIls, noteKey = "checkout.vision_note" }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(Boolean(readBitPaymentPending()));
  const note = t(noteKey);
  const summary = useMemo(() => bitPaymentSummary({ amountIls, note }), [amountIls, note]);

  if (!isBitConfigured() || !summary.ok) {
    return (
      <div className="clinic-panel border-amber-200 bg-amber-50/50 text-sm text-amber-900 leading-relaxed">
        {t("checkout.bit_not_configured")}
      </div>
    );
  }

  const stripeLink = getStripePaymentLink();

  const handleCopy = async () => {
    const text = `${summary.phoneDisplay}\n₪${summary.amountIls}\n${note}`;
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handlePaid = () => {
    markBitPaymentPending({ amountIls: summary.amountIls, phone: summary.phone });
    setConfirmed(true);
  };

  return (
    <div className="clinic-panel space-y-4 border-sky-200/80">
      <div className="flex items-start gap-3">
        <div className="clinic-icon w-11 h-11 tone-sky shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="clinic-h2">{t("checkout.bit_title")}</h2>
          <p className="clinic-sub mt-1">{t("checkout.bit_subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/70 border border-sky-100 p-4 space-y-2 text-center">
        <p className="text-xs text-slate-500">{t("checkout.bit_phone_label")}</p>
        <p className="text-2xl font-black tracking-wide text-slate-900 dir-ltr">{summary.phoneDisplay}</p>
        <p className="text-lg font-bold text-sky-800">₪{summary.amountIls}</p>
        <p className="text-xs text-slate-600">{note}</p>
      </div>

      <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
        {t("checkout.bit_steps", {
          phone: summary.phoneDisplay,
          amount: summary.amountIls,
          note: summary.note,
        }).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={handleCopy}>
          <Copy className="w-4 h-4 ms-1" />
          {copied ? t("checkout.copied") : t("checkout.copy_details")}
        </Button>
        <Button type="button" className="h-11 rounded-xl clinic-cta" onClick={() => openBitApp()}>
          <Smartphone className="w-4 h-4 ms-1" />
          {t("checkout.open_bit")}
        </Button>
      </div>

      <Button type="button" variant="secondary" className="w-full h-11 rounded-xl font-bold" onClick={handlePaid}>
        {t("checkout.mark_paid")}
      </Button>

      {confirmed ? (
        <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{t("checkout.pending_verify")}</p>
        </div>
      ) : null}

      {stripeLink ? (
        <a
          href={stripeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-sky-700 hover:underline"
        >
          {t("checkout.stripe_alt")}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : null}

      <button
        type="button"
        className="text-[11px] text-slate-500 underline mx-auto block"
        onClick={() => { clearBitPaymentPending(); setConfirmed(false); }}
      >
        {t("checkout.clear_pending")}
      </button>
    </div>
  );
}
