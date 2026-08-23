import React from "react";
import { Route, Stethoscope, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const PILLARS = Object.freeze([
  { id: "journey", icon: Route, tone: "tone-rose", titleKey: "journey.pillar_journey_title", descKey: "journey.pillar_journey_desc" },
  { id: "clinician", icon: Stethoscope, tone: "tone-sky", titleKey: "journey.pillar_clinician_title", descKey: "journey.pillar_clinician_desc" },
  { id: "safety", icon: ShieldCheck, tone: "tone-amber", titleKey: "journey.pillar_safety_title", descKey: "journey.pillar_safety_desc" },
]);

/** Answers "what is this app" in three lines, above any tool list. */
export default function ValuePillars() {
  const { t } = useI18n();

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {PILLARS.map((pillar) => (
        <div key={pillar.id} className="clinic-panel">
          <div className={`clinic-icon w-11 h-11 mb-3 ${pillar.tone}`}>
            <pillar.icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">{t(pillar.titleKey)}</h3>
          <p className="clinic-sub mt-1.5">{t(pillar.descKey)}</p>
        </div>
      ))}
    </div>
  );
}
