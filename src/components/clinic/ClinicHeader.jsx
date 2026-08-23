import React from "react";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useClinicProfile } from "@/lib/clinic/profileContext";
import { journeyPhaseToneClass } from "@/lib/clinic/journey";

export default function ClinicHeader({ title, subtitle, icon: Icon, backTo = "/", tone, extra = null }) {
  const { profile } = useClinicProfile();
  const profileLine = [profile.clinicName, profile.physicianName].filter(Boolean).join(" · ");
  const secondary = subtitle || profileLine;

  return (
    <header className="sticky top-0 z-20 safe-top no-print px-3 pt-3">
      <div className="clinic-wrap">
        <div className="clinic-card px-3 py-2 flex items-center gap-3">
          <BackButton to={backTo} className="text-slate-500" />
          {Icon && (
            <div className={`clinic-icon ${tone ? journeyPhaseToneClass(tone) : ""}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate text-slate-900">{title}</h1>
            {secondary ? <p className="text-[11px] text-slate-500 truncate">{secondary}</p> : null}
          </div>
          {extra}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
