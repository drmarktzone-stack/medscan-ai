import React from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function DisclaimerBanner() {
  const { t } = useI18n();
  return (
    <div className="clinic-card p-4 flex items-start gap-3 border-amber-200/70">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-900/80 leading-relaxed">
        <span className="font-bold">{t("disclaimer.title")}</span> {t("disclaimer.text")}
      </p>
    </div>
  );
}
