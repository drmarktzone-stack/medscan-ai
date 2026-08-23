import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { journeyPhaseToneClass } from "@/lib/clinic/journey";
import { useI18n } from "@/lib/i18n";

export default function JourneyPhaseCard({ phase, featured = false }) {
  const { t } = useI18n();
  const Icon = phase.icon;

  return (
    <Link
      to={phase.path}
      className={`clinic-card block p-5 sm:p-6 hover:bg-white/80 transition-all group ${
        featured ? "md:col-span-2 border-2 border-sky-200/80" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`clinic-icon w-14 h-14 shrink-0 bg-gradient-to-br ${journeyPhaseToneClass(phase.tone)}`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-sky-700 mb-1">
            {t(phase.stepKey)}
          </p>
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-primary">
            {t(phase.titleKey)}
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {t(phase.descKey)}
          </p>
          <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-sky-800">
            {t("journey.open_phase")}
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}
