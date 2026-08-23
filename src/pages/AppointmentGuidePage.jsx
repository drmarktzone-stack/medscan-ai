import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import AppointmentGuide from "@/pages/AppointmentGuide";
import { parseAppointmentSearchParams } from "@/lib/medscan/journey/appointmentPlanner";
import { serviceFromFollowUpType } from "@/lib/medscan/journey/appointmentCatalog";
import { useI18n } from "@/lib/i18n";

export default function AppointmentGuidePage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const parsed = parseAppointmentSearchParams(params);
  const initialService = parsed.service
    || (parsed.followUpType ? serviceFromFollowUpType(parsed.followUpType) : "")
    || (parsed.context === "ecg" ? "urgent_care" : "");
  const initialUrgency = parsed.urgency || (parsed.context === "ecg" ? "urgent" : "");

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={CalendarPlus}
        tone="sky"
        badgeKey="journey.badge"
        titleKey="appt.page_title"
        subtitleKey="appt.page_subtitle"
        noteKey="appt.page_note"
      />
      <main className="clinic-wrap pb-10 max-w-lg mx-auto space-y-4">
        <Link to="/parent/follow-up" className="text-xs font-bold text-sky-700 hover:underline">
          ← {t("journey.open_follow_up")}
        </Link>
        <AppointmentGuide
          initialService={initialService}
          initialUrgency={initialUrgency}
          initialNotes={parsed.context ? t("appt.context_from", { ctx: parsed.context }) : ""}
        />
        <DisclaimerBanner />
      </main>
    </div>
  );
}
