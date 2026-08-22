import React from "react";
import { Monitor } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isLocalClinicSession } from "@/lib/clinic/localMode";
import { isStandaloneBuild } from "@/lib/clinic/standalone";
import { appParams } from "@/lib/app-params";

export default function LocalClinicBanner() {
  const { t } = useI18n();
  const local = isLocalClinicSession({ appId: appParams.appId, token: appParams.token });
  if (!local) return null;
  return (
    <div className="no-print border-b border-sky-200 bg-sky-50">
      <div className="max-w-5xl mx-auto px-3 py-1 flex items-center gap-2 text-[11px] font-medium text-sky-900">
        <Monitor className="w-3.5 h-3.5 shrink-0" />
        <span>{t(isStandaloneBuild() ? "clinic.standalone_banner" : "clinic.local_banner")}</span>
      </div>
    </div>
  );
}
