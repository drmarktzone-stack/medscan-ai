import React, { useState } from "react";
import { MessageCircle, Copy, Link2, Stethoscope, Heart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  buildShareMessages,
  copyMarketingLink,
  getSupportWhatsApp,
  whatsAppShareUrl,
} from "@/lib/clinic/marketingConfig";

const PRESETS = [
  { id: "clinician", icon: Stethoscope, tone: "tone-sky" },
  { id: "parent", icon: Heart, tone: "tone-rose" },
  { id: "upgrade", icon: Wallet, tone: "tone-amber" },
];

export default function ShareKit({ compact = false }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(null);
  const messages = buildShareMessages(lang);
  const support = getSupportWhatsApp();

  const share = (presetId) => {
    const text = messages[presetId];
    window.open(whatsAppShareUrl(text, support), "_blank", "noopener,noreferrer");
  };

  const copyLink = async (path) => {
    try {
      await copyMarketingLink(path);
      setCopied(path);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (compact) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-xl border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        onClick={() => share("clinician")}
      >
        <MessageCircle className="w-4 h-4 ms-1" />
        {t("marketing.share_whatsapp")}
      </Button>
    );
  }

  return (
    <div className="clinic-panel border-emerald-200/70 space-y-4">
      <div>
        <h2 className="clinic-h2">{t("marketing.share_title")}</h2>
        <p className="clinic-sub mt-1">{t("marketing.share_subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => share(p.id)}
            className="clinic-panel text-start hover:border-emerald-300 transition-colors p-4"
          >
            <div className={`clinic-icon w-10 h-10 mb-2 ${p.tone}`}>
              <p.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-900">{t(`marketing.share_${p.id}_title`)}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t(`marketing.share_${p.id}_hint`)}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="rounded-xl h-10" onClick={() => copyLink("/start")}>
          <Link2 className="w-4 h-4 ms-1" />
          {copied === "/start" ? t("marketing.copied") : t("marketing.copy_start_link")}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl h-10" onClick={() => copyLink("/checkout")}>
          <Copy className="w-4 h-4 ms-1" />
          {copied === "/checkout" ? t("marketing.copied") : t("marketing.copy_checkout_link")}
        </Button>
      </div>
    </div>
  );
}
