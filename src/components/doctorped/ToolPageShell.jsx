import React from "react";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { useI18n } from "@/lib/i18n";

export default function ToolPageShell({ icon: Icon, titleKey, introKey, accent = "cyan", children }) {
  const { t } = useI18n();
  const ring = accent === "rose" ? "text-rose-600" : accent === "amber" ? "text-amber-600" : "text-cyan-700";
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/30">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
          <BackButton />
          {Icon && <Icon className={`w-5 h-5 ${ring}`} />}
          <h1 className="font-bold text-base flex-1">{t(titleKey)}</h1>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {introKey && (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
            {t(introKey)}
          </p>
        )}
        {children}
        <DisclaimerBanner />
      </div>
    </div>
  );
}
