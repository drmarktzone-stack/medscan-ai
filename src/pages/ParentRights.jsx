import React, { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import JourneyTimeline, { JourneyBackLink } from "@/components/journey/JourneyTimeline";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import { evaluateFamilyRights } from "@/lib/medscan/journey/familyRights";

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 border-b border-white/40 last:border-0 cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 rounded" />
    </label>
  );
}

export default function ParentRights() {
  const { t } = useI18n();
  const { session } = usePatientSession();
  const [city, setCity] = useState("");
  const [isOleh, setIsOleh] = useState(false);
  const [isReservist, setIsReservist] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [inDaycare, setInDaycare] = useState(false);
  const [siblingsInDaycare, setSiblingsInDaycare] = useState(false);
  const [ran, setRan] = useState(false);

  const profile = useMemo(() => ({
    childAgeYears: session.ageYears,
    city,
    isOleh,
    isReservist,
    specialNeeds,
    inDaycare,
    siblingsInDaycare,
  }), [session.ageYears, city, isOleh, isReservist, specialNeeds, inDaycare, siblingsInDaycare]);

  const cards = useMemo(() => (ran ? evaluateFamilyRights(profile) : []), [ran, profile]);

  return (
    <div className="clinic-page">
      <ClinicHeader title={t("journey.phase_rights_title")} icon={Scale} tone="parent" backTo="/parent" />
      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <JourneyBackLink />
        <section className="clinic-card p-3">
          <JourneyTimeline activePhaseId="rights" compact />
        </section>

        <p className="text-sm text-slate-700 leading-relaxed clinic-card p-4">{t("journey.rights_intro")}</p>
        <p className="text-xs text-violet-800/80 font-medium px-1">{t("journey.rights_disclaimer")}</p>

        <section className="clinic-card p-4 space-y-1">
          <p className="text-sm font-bold mb-2">{t("journey.rights_profile")}</p>
          <label className="block mb-2">
            <span className="clinic-label">{t("journey.rights_city")}</span>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("journey.rights_city_ph")} />
          </label>
          <ToggleRow label={t("journey.rights_oleh")} checked={isOleh} onChange={setIsOleh} />
          <ToggleRow label={t("journey.rights_reservist")} checked={isReservist} onChange={setIsReservist} />
          <ToggleRow label={t("journey.rights_special")} checked={specialNeeds} onChange={setSpecialNeeds} />
          <ToggleRow label={t("journey.rights_daycare")} checked={inDaycare} onChange={setInDaycare} />
          <ToggleRow label={t("journey.rights_siblings")} checked={siblingsInDaycare} onChange={setSiblingsInDaycare} />
        </section>

        <Button className="w-full h-12 rounded-full bg-violet-500 hover:bg-violet-600 font-bold" onClick={() => setRan(true)}>
          {t("journey.rights_run")}
        </Button>

        {cards.length ? (
          <section className="space-y-3">
            <p className="text-sm font-bold text-slate-800">{t("journey.rights_results", { count: cards.length })}</p>
            {cards.map((card) => (
              <div key={card.id} className="clinic-card p-4 space-y-2 border border-violet-200/60">
                <p className="text-xs font-bold text-violet-800 uppercase tracking-wide">{t("dp.draft_badge")}</p>
                <h3 className="font-extrabold text-slate-900">{t(card.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(card.summaryKey, card.params)}</p>
                <p className="text-sm font-medium text-slate-800">{t(card.actionKey)}</p>
                {card.deadlineKey ? <p className="text-xs text-amber-800">{t(card.deadlineKey)}</p> : null}
              </div>
            ))}
          </section>
        ) : null}

        <DisclaimerBanner />
      </div>
    </div>
  );
}
