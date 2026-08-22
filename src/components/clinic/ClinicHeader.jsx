import React from "react";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useClinicProfile } from "@/lib/clinic/profileContext";

const ICON_TONE = {
  clinic: "text-sky-600",
  parent: "text-rose-500",
  tool: "text-slate-600",
};

export default function ClinicHeader({ title, icon: Icon, tone = "clinic", backTo = "/", extra = null }) {
  const { profile } = useClinicProfile();
  const subtitle = [profile.clinicName, profile.physicianName].filter(Boolean).join(" · ");

  return (
    <header className="sticky top-0 z-20 safe-top no-print px-3 pt-3">
      <div className="clinic-wrap">
        <div className="clinic-card px-3 py-2.5 flex items-center gap-3">
          <BackButton to={backTo} className="text-slate-500" />
          {Icon && (
            <div className={`clinic-icon ${ICON_TONE[tone] || ICON_TONE.clinic}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate text-slate-900">{title}</h1>
            {subtitle ? <p className="text-[11px] text-slate-500 truncate">{subtitle}</p> : null}
          </div>
          {extra}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
