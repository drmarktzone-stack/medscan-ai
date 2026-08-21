import React from "react";
import { Monitor } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isLocalClinicSession } from "@/lib/clinic/localMode";
import { appParams } from "@/lib/app-params";

export default function LocalClinicBanner() {
  const { t } = useI18n();
  const local = isLocalClinicSession({ appId: appParams.appId, token: appParams.token });
  if (!local) return null;
  return (
    <div className="no-print px-4 pt-2">
      <div className="clinic-wrap">
        <div className="clinic-card py-1.5 px-3 flex items-center gap-2 text-[11px] font-medium text-sky-900">
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span>{t("clinic.local_banner")}</span>
        </div>
      </div>
    </div>
  );
}
