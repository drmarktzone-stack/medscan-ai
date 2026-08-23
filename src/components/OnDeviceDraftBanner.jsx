import React from "react";
import { Smartphone, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { INCOMPLETE_GUIDELINE_HE } from "@/lib/clinic/incompleteVision";

const GUIDELINE_BY_TYPE = {
  skin: INCOMPLETE_GUIDELINE_HE.skin,
  radiology: INCOMPLETE_GUIDELINE_HE.radiology,
  ecg: INCOMPLETE_GUIDELINE_HE.ecg,
};

export default function OnDeviceDraftBanner({ analysisType = "skin" }) {
  const { t } = useI18n();
  const guideline = GUIDELINE_BY_TYPE[analysisType] || GUIDELINE_BY_TYPE.skin;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-2">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-amber-700" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-amber-900">{t("analysis.on_device_title")}</p>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">{t("analysis.on_device_body")}</p>
        </div>
      </div>
      <p className="text-[11px] text-amber-900/80 flex items-start gap-1.5 pt-1 border-t border-amber-200/60">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{guideline}</span>
      </p>
    </div>
  );
}
