import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FAMILY_JOURNEY_PHASES, journeyPhaseToneClass } from "@/lib/clinic/journey";
import { useI18n } from "@/lib/i18n";

export default function JourneyTimeline({ activePhaseId, compact = false }) {
  const { t } = useI18n();

  return (
    <div className={`${compact ? "space-y-2" : "space-y-4"}`}>
      {!compact ? (
        <p className="text-center text-xs font-bold uppercase tracking-widest text-sky-800/70">
          {t("journey.timeline_label")}
        </p>
      ) : null}
      <ol className={`grid grid-cols-4 gap-1 ${compact ? "" : "gap-2"}`}>
        {FAMILY_JOURNEY_PHASES.map((phase, index) => {
          const active = phase.id === activePhaseId;
          const Icon = phase.icon;
          return (
            <li key={phase.id} className="relative">
              {index > 0 ? (
                <span
                  className="absolute top-5 -start-1 w-2 h-0.5 bg-sky-200 hidden sm:block"
                  aria-hidden
                />
              ) : null}
              <Link
                to={phase.path}
                className={`block rounded-2xl border p-2 sm:p-3 transition-all text-center ${
                  active
                    ? "border-sky-400 bg-white shadow-md ring-2 ring-sky-200"
                    : "border-white/60 bg-white/40 hover:bg-white/70"
                }`}
              >
                <div
                  className={`mx-auto mb-1.5 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${journeyPhaseToneClass(phase.tone)} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-[9px] sm:text-[10px] font-black text-sky-900 leading-tight">
                  {t(phase.stepKey)}
                </p>
                {!compact ? (
                  <p className="hidden sm:block text-[10px] text-slate-600 mt-1 leading-snug">
                    {t(phase.titleKey)}
                  </p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
      {!compact ? (
        <p className="text-center text-[11px] text-muted-foreground leading-relaxed max-w-md mx-auto">
          {t("journey.timeline_hint")}
        </p>
      ) : null}
    </div>
  );
}

export function JourneyBackLink({ to = "/parent" }) {
  const { t, dir } = useI18n();
  const Icon = dir === "rtl" ? ChevronRight : ChevronLeft;
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 hover:text-sky-950"
    >
      <Icon className="w-4 h-4" />
      {t("journey.back_hub")}
    </Link>
  );
}
