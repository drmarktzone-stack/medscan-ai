import React, { useMemo, useState } from "react";
import { CalendarClock, ChevronRight, MapPin, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  HMO_IDS,
  ISRAEL_REGIONS,
  loadCareProfile,
  saveCareProfile,
  careProfileComplete,
} from "@/lib/medscan/journey/careProfile";
import {
  SERVICE_IDS,
  SERVICE_META,
  PREFERRED_SLOTS,
} from "@/lib/medscan/journey/appointmentCatalog";
import {
  buildAppointmentPlan,
  suggestDateOptions,
  formatPreferredSummary,
} from "@/lib/medscan/journey/appointmentPlanner";
import AppointmentDestinationCard from "@/components/journey/AppointmentDestinationCard";
import { addFollowUp } from "@/lib/medscan/journey/followUpStore";

const URGENCY_OPTIONS = Object.freeze([
  { id: "routine", labelKey: "appt.urgency_routine", descKey: "appt.urgency_routine_desc" },
  { id: "urgent", labelKey: "appt.urgency_urgent", descKey: "appt.urgency_urgent_desc" },
  { id: "emergency", labelKey: "appt.urgency_emergency", descKey: "appt.urgency_emergency_desc" },
]);

export default function AppointmentGuide({ initialService = "", initialUrgency = "", initialNotes = "" }) {
  const { t } = useI18n();
  const [step, setStep] = useState(() => (careProfileComplete(loadCareProfile()) ? 1 : 0));
  const [profile, setProfile] = useState(() => loadCareProfile());
  const [serviceId, setServiceId] = useState(() =>
    SERVICE_IDS.includes(initialService) ? initialService : "pediatrician",
  );
  const [urgency, setUrgency] = useState(() =>
    ["routine", "urgent", "emergency"].includes(initialUrgency) ? initialUrgency : "routine",
  );
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [notes, setNotes] = useState(initialNotes);
  const [confirmed, setConfirmed] = useState(false);

  const dateOptions = useMemo(() => suggestDateOptions(), []);

  const plan = useMemo(
    () => buildAppointmentPlan({
      profile,
      serviceId,
      urgency,
      preferredDates: selectedDates,
      preferredSlots: selectedSlots,
      notes,
    }),
    [profile, serviceId, urgency, selectedDates, selectedSlots, notes],
  );

  function saveProfileAndNext(e) {
    e.preventDefault();
    setProfile(saveCareProfile(profile));
    setStep(1);
  }

  function toggleDate(d) {
    setSelectedDates((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].slice(0, 7),
    );
  }

  function toggleSlot(id) {
    setSelectedSlots((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleConfirm() {
    addFollowUp({
      type: serviceId === "imaging" ? "imaging" : serviceId === "specialist" ? "specialist" : "other",
      title: notes || t(SERVICE_META[serviceId]?.labelKey || "appt.service_other"),
      dueDate: selectedDates[0] || "",
      notes: [
        t("appt.confirm_note_service", { service: t(SERVICE_META[serviceId]?.labelKey) }),
        formatPreferredSummary(plan, t),
        notes,
      ].filter(Boolean).join(" · "),
      status: "pending",
    });
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div className="clinic-panel text-center py-10 space-y-3">
        <div className="clinic-icon w-14 h-14 mx-auto tone-sky">
          <Check className="w-7 h-7 text-white" />
        </div>
        <p className="text-lg font-extrabold text-slate-900">{t("appt.confirm_done_title")}</p>
        <p className="clinic-sub max-w-sm mx-auto">{t("appt.confirm_done_body")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-sky-500" : "bg-slate-200"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <form onSubmit={saveProfileAndNext} className="clinic-panel space-y-4">
          <div className="flex items-center gap-3">
            <div className="clinic-icon w-10 h-10 tone-sky">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="clinic-h2 text-base">{t("appt.profile_title")}</h2>
              <p className="clinic-sub text-xs">{t("appt.profile_desc")}</p>
            </div>
          </div>
          <label className="block">
            <span className="clinic-label">{t("appt.profile_hmo")}</span>
            <select
              className="h-11 w-full rounded-xl border px-3 text-sm"
              value={profile.hmo}
              onChange={(e) => setProfile({ ...profile, hmo: e.target.value })}
              required
            >
              <option value="">{t("appt.profile_hmo_pick")}</option>
              {HMO_IDS.filter((id) => id !== "unknown").map((id) => (
                <option key={id} value={id}>{t(`appt.hmo_${id}`)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="clinic-label">{t("appt.profile_city")}</span>
            <Input
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder={t("appt.profile_city_ph")}
            />
          </label>
          <label className="block">
            <span className="clinic-label">{t("appt.profile_region")}</span>
            <select
              className="h-11 w-full rounded-xl border px-3 text-sm"
              value={profile.region}
              onChange={(e) => setProfile({ ...profile, region: e.target.value })}
            >
              <option value="">{t("appt.profile_region_pick")}</option>
              {ISRAEL_REGIONS.map((id) => (
                <option key={id} value={id}>{t(`appt.region_${id}`)}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="clinic-cta w-full !h-12" disabled={!profile.hmo}>
            {t("appt.continue")}
            <ChevronRight className="w-4 h-4 inline ms-1" />
          </button>
        </form>
      ) : null}

      {step === 1 ? (
        <section className="space-y-3">
          <h2 className="clinic-h2">{t("appt.step_service")}</h2>
          <p className="clinic-sub text-sm">{t("appt.step_service_desc")}</p>
          <div className="grid gap-2">
            {SERVICE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setServiceId(id)}
                className={`text-start rounded-2xl border p-3.5 transition-all ${
                  serviceId === id ? "clinic-chip-on border-sky-300" : "bg-white/70 border-slate-200 hover:bg-white"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{t(SERVICE_META[id].labelKey)}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t(SERVICE_META[id].descKey)}</p>
              </button>
            ))}
          </div>
          <button type="button" className="clinic-cta w-full !h-12" onClick={() => setStep(2)}>
            {t("appt.continue")}
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-3">
          <h2 className="clinic-h2">{t("appt.step_urgency")}</h2>
          <div className="grid gap-2">
            {URGENCY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setUrgency(opt.id)}
                className={`text-start rounded-2xl border p-3.5 ${
                  urgency === opt.id
                    ? opt.id === "emergency"
                      ? "border-red-300 bg-red-50"
                      : opt.id === "urgent"
                        ? "border-amber-300 bg-amber-50"
                        : "clinic-chip-on"
                    : "bg-white/70 border-slate-200"
                }`}
              >
                <p className="text-sm font-bold">{t(opt.labelKey)}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t(opt.descKey)}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-xl border py-3 text-sm font-bold" onClick={() => setStep(1)}>
              {t("appt.back")}
            </button>
            <button type="button" className="clinic-cta flex-[2] !h-12" onClick={() => setStep(3)}>
              {t("appt.continue")}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="clinic-icon w-10 h-10 tone-amber">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="clinic-h2 text-base">{t("appt.step_dates")}</h2>
              <p className="clinic-sub text-xs">{t("appt.step_dates_desc")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {dateOptions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDate(d)}
                className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold border ${
                  selectedDates.includes(d) ? "clinic-chip-on" : "bg-white/70 border-slate-200"
                }`}
              >
                {d.slice(5).replace("-", "/")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {PREFERRED_SLOTS.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => toggleSlot(slot.id)}
                className={`rounded-full px-3 py-2 text-xs font-bold border ${
                  selectedSlots.includes(slot.id) ? "clinic-chip-on" : "bg-white/70 border-slate-200"
                }`}
              >
                {t(slot.labelKey)}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="clinic-label">{t("appt.notes_label")}</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("appt.notes_ph")} />
          </label>
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-xl border py-3 text-sm font-bold" onClick={() => setStep(2)}>
              {t("appt.back")}
            </button>
            <button type="button" className="clinic-cta flex-[2] !h-12" onClick={() => setStep(4)}>
              {t("appt.show_options")}
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <div>
            <h2 className="clinic-h2">{t("appt.step_results")}</h2>
            <p className="clinic-sub text-sm mt-1">{t("appt.step_results_desc")}</p>
            {plan.preferredDates.length || plan.preferredSlots.length ? (
              <p className="text-xs font-semibold text-sky-800 mt-2">{formatPreferredSummary(plan, t)}</p>
            ) : null}
          </div>

          {urgency === "emergency" ? (
            <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900 font-semibold">
              {t("appt.emergency_banner")}
            </div>
          ) : null}

          {plan.destinations.map((dest, i) => (
            <AppointmentDestinationCard key={dest.id} destination={dest} rank={i + 1} />
          ))}

          {plan.prepKeys.length > 0 ? (
            <div className="clinic-panel space-y-2">
              <p className="text-sm font-bold text-slate-900">{t("appt.prep_title")}</p>
              <ul className="list-disc pr-5 text-xs text-slate-700 space-y-1">
                {plan.prepKeys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-[10px] text-slate-500 leading-relaxed">{t("appt.plan_disclaimer")}</p>

          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-xl border py-3 text-sm font-bold" onClick={() => setStep(3)}>
              {t("appt.back")}
            </button>
            <button type="button" className="clinic-cta flex-[2] !h-12" onClick={handleConfirm}>
              {t("appt.confirm_plan")}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
