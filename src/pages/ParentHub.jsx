import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Stethoscope, ClipboardCheck, CalendarPlus, ArrowLeft, ArrowRight } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import JourneyPhaseCard from "@/components/journey/JourneyPhaseCard";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import { FAMILY_JOURNEY_PHASES } from "@/lib/clinic/journey";
import { followUpStats, loadFollowUps } from "@/lib/medscan/journey/followUpStore";
import { useI18n } from "@/lib/i18n";
import { CLINICIAN_SWITCH_PATH } from "@/lib/clinic/account";

export default function ParentHub() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const stats = useMemo(() => followUpStats(loadFollowUps()), []);

  return (
    <div className="clinic-page">
      <AppTopBar />

      <PageHero
        icon={Heart}
        tone="rose"
        badgeKey="journey.badge"
        titleKey="journey.parent_hub_title"
        subtitleKey="journey.parent_hub_subtitle"
        noteKey="home.not_diagnosis"
      />

      <main className="clinic-wrap pb-10 space-y-7 max-w-3xl">
        <section className="clinic-panel">
          <JourneyTimeline />
        </section>

        <Link
          to="/appointments"
          className="clinic-panel flex items-center gap-3 !border-sky-200 !bg-sky-50/90 hover:!bg-sky-50"
        >
          <div className="clinic-icon w-10 h-10 tone-sky">
            <CalendarPlus className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-sky-900">{t("appt.page_title")}</p>
            <p className="text-[11px] text-sky-800/80 mt-0.5">{t("journey.open_appointments")}</p>
          </div>
          <Arrow className="w-4 h-4 text-sky-700 shrink-0" />
        </Link>

        {stats.pending > 0 ? (
          <Link
            to="/parent/follow-up"
            className="clinic-panel flex items-center gap-3 !border-amber-200 !bg-amber-50/90 hover:!bg-amber-50"
          >
            <div className="clinic-icon w-10 h-10 tone-amber">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-amber-900">
                {t("journey.follow_pending_banner", { count: stats.pending })}
              </p>
              <p className="text-[11px] text-amber-800/80 mt-0.5">{t("journey.open_follow_up")}</p>
            </div>
            <Arrow className="w-4 h-4 text-amber-700 shrink-0" />
          </Link>
        ) : null}

        <section className="space-y-3">
          <div>
            <p className="clinic-eyebrow">{t("journey.steps_label")}</p>
            <h2 className="clinic-h2 mt-1">{t("journey.steps_title")}</h2>
          </div>
          <div className="grid gap-3">
            {FAMILY_JOURNEY_PHASES.map((phase, index) => (
              <JourneyPhaseCard
                key={phase.id}
                phase={phase}
                number={index + 1}
                primary={index === 0}
              />
            ))}
          </div>
        </section>

        <section className="clinic-panel text-center">
          <p className="clinic-sub mb-3">{t("journey.clinician_switch_hint")}</p>
          <Link
            to={CLINICIAN_SWITCH_PATH}
            className="inline-flex items-center gap-2 clinic-chip text-xs font-bold rounded-full px-4 py-2.5 text-slate-700 hover:bg-white/70"
          >
            <Stethoscope className="w-4 h-4" />
            {t("parent.open_clinician")}
          </Link>
        </section>

        <DisclaimerBanner />
      </main>
    </div>
  );
}
