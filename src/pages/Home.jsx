import React from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Heart, Route, ArrowLeft, ArrowRight } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import OnboardingOverlay from "@/components/clinic/OnboardingOverlay";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import ValuePillars from "@/components/journey/ValuePillars";
import ClinicianToolShelves from "@/components/journey/ClinicianToolShelves";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import { useI18n } from "@/lib/i18n";
import { loadAccount, visibleHomeDoors } from "@/lib/clinic/account";

export default function Home() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const role = loadAccount().role;
  const showFamilyDoor = visibleHomeDoors(role).includes("/parent");

  return (
    <div className="clinic-page">
      <AppTopBar />

      <PageHero
        icon={Stethoscope}
        tone="sky"
        badgeKey="journey.badge"
        titleKey="home.brand"
        subtitleKey="journey.clinician_hub_subtitle"
        noteKey="home.not_diagnosis"
      />

      <main className="clinic-wrap pb-10 space-y-8">
        <section className="space-y-3">
          <div className="text-center">
            <p className="clinic-eyebrow">{t("journey.what_is_label")}</p>
            <h2 className="clinic-h2 mt-1">{t("journey.platform_title")}</h2>
          </div>
          <ValuePillars />
        </section>

        <section className="clinic-panel">
          <div className="flex items-start gap-3 mb-4">
            <div className="clinic-icon w-10 h-10 tone-rose">
              <Route className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="clinic-h2">{t("journey.family_journey_label")}</h2>
              <p className="clinic-sub mt-0.5">{t("journey.platform_desc")}</p>
            </div>
          </div>
          <JourneyTimeline compact />
          {showFamilyDoor ? (
            <Link
              to="/parent"
              className="mt-5 inline-flex items-center gap-2 clinic-chip-on text-xs font-bold rounded-full px-4 py-2.5"
            >
              <Heart className="w-4 h-4" />
              {t("journey.open_family_hub")}
              <Arrow className="w-3.5 h-3.5" />
            </Link>
          ) : null}
        </section>

        <section className="space-y-4">
          <div>
            <p className="clinic-eyebrow">{t("journey.toolbox_label")}</p>
            <h2 className="clinic-h2 mt-1">{t("journey.toolbox_title")}</h2>
            <p className="clinic-sub mt-1">{t("journey.toolbox_desc")}</p>
          </div>
          <ClinicianToolShelves />
        </section>

        <DisclaimerBanner />

        <footer className="flex flex-wrap justify-center gap-3 pt-2 pb-4 text-xs">
          <Link to="/launch" className="text-sky-800/80 hover:text-sky-950 font-semibold">{t("launch.nav")}</Link>
          <span className="text-slate-300">·</span>
          <Link to="/pricing" className="text-sky-800/80 hover:text-sky-950 font-semibold">{t("pricing.nav")}</Link>
          <span className="text-slate-300">·</span>
          <Link to="/privacy" className="text-sky-800/80 hover:text-sky-950 font-semibold">{t("privacy.nav")}</Link>
        </footer>
      </main>

      <OnboardingOverlay />
    </div>
  );
}
