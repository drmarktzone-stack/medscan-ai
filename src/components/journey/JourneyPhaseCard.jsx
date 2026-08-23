import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { journeyPhaseToneClass } from "@/lib/clinic/journey";
import { useI18n } from "@/lib/i18n";

export default function JourneyPhaseCard({ phase, number, primary = false }) {
  const { t, dir } = useI18n();
  const Icon = phase.icon;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <Link
      to={phase.path}
      className={`clinic-panel block transition-all hover:bg-white/90 hover:-translate-y-0.5 group ${
        primary ? "ring-2 ring-sky-300/70" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`clinic-icon w-14 h-14 shrink-0 ${journeyPhaseToneClass(phase.tone)}`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {number != null ? <span className="clinic-step-num">{number}</span> : null}
            <p className="clinic-eyebrow">{t(phase.stepKey)}</p>
            {primary ? (
              <span className="clinic-chip-on text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5">
                {t("journey.start_here")}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-primary">
            {t(phase.titleKey)}
          </h3>
          <p className="clinic-sub mt-1.5">{t(phase.descKey)}</p>
          <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-sky-800">
            {t("journey.open_phase")}
            <Arrow className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
