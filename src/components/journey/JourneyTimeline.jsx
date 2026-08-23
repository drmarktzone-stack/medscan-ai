import React from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { FAMILY_JOURNEY_PHASES, journeyPhaseToneClass } from "@/lib/clinic/journey";
import { useI18n } from "@/lib/i18n";

/**
 * Horizontal step rail. Steps before the active one read as done so the
 * user can see how far along the journey they are.
 */
export default function JourneyTimeline({ activePhaseId, compact = false }) {
  const { t } = useI18n();
  const activeIndex = FAMILY_JOURNEY_PHASES.findIndex((p) => p.id === activePhaseId);

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {!compact ? (
        <p className="clinic-eyebrow text-center">{t("journey.timeline_label")}</p>
      ) : null}

      <ol className="flex items-stretch gap-1.5 sm:gap-2">
        {FAMILY_JOURNEY_PHASES.map((phase, index) => {
          const active = index === activeIndex;
          const done = activeIndex > -1 && index < activeIndex;
          const Icon = phase.icon;

          return (
            <li key={phase.id} className="flex-1 min-w-0">
              <Link
                to={phase.path}
                aria-current={active ? "step" : undefined}
                className={`h-full flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 sm:px-2 sm:py-3 text-center transition-all ${
                  active
                    ? "border-sky-400/80 bg-white shadow-md"
                    : done
                      ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
                      : "border-white/70 bg-white/45 hover:bg-white/75"
                }`}
              >
                <span
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-emerald-500" : journeyPhaseToneClass(phase.tone)
                  } ${active ? "ring-2 ring-sky-300 ring-offset-1" : ""}`}
                >
                  {done ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </span>
                <span className="clinic-micro text-slate-800 !font-black">{index + 1}</span>
                <span className="clinic-micro text-slate-700 line-clamp-2">
                  {t(phase.stepKey)}
                </span>
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
