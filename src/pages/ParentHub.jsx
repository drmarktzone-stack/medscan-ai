import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Settings, Stethoscope, LogIn, UserPlus, Sparkles } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AccountSettings from "@/components/AccountSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import JourneyPhaseCard from "@/components/journey/JourneyPhaseCard";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import { FAMILY_JOURNEY_PHASES } from "@/lib/clinic/journey";
import { followUpStats, loadFollowUps } from "@/lib/medscan/journey/followUpStore";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { CLINICIAN_SWITCH_PATH } from "@/lib/clinic/account";
import { useState } from "react";

export default function ParentHub() {
  const { t } = useI18n();
  const { user, isLocalClinic } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showAuthLinks = isLocalClinic || !user?.email;

  const stats = useMemo(() => followUpStats(loadFollowUps()), []);

  return (
    <div className="clinic-page">
      <div className="flex items-center justify-between clinic-wrap pt-[calc(env(safe-area-inset-top)+1rem)] gap-2">
        <div className="clinic-card px-3 py-1.5">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-2">
          {showAuthLinks ? (
            <>
              <Link to="/login" className="clinic-card text-xs text-slate-600 hover:text-foreground flex items-center gap-1.5 px-3 py-2">
                <LogIn className="w-4 h-4" />
                {t("login.title")}
              </Link>
              <Link to="/register" className="clinic-card text-xs font-bold text-primary hover:text-sky-800 flex items-center gap-1.5 px-3 py-2">
                <UserPlus className="w-4 h-4" />
                {t("register.title")}
              </Link>
            </>
          ) : (
            <span className="clinic-card text-xs text-slate-600 px-3 py-2 truncate max-w-[180px]">{user.email}</span>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="clinic-card text-xs text-slate-600 hover:text-foreground flex items-center gap-1.5 px-3 py-2"
          >
            <Settings className="w-4 h-4" />
            {t("home.settings")}
          </button>
        </div>
      </div>

      <header className="clinic-wrap pt-6 pb-6 text-center">
        <div className="clinic-icon w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-orange-300">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <p className="inline-flex items-center gap-1.5 clinic-chip-on text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t("journey.badge")}
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{t("journey.parent_hub_title")}</h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-sm leading-relaxed">
          {t("journey.parent_hub_subtitle")}
        </p>
        <p className="text-[11px] text-rose-800/70 mt-2 font-medium">{t("home.not_diagnosis")}</p>
      </header>

      <main className="clinic-wrap pb-10 space-y-8">
        <section className="clinic-card p-4 sm:p-5">
          <JourneyTimeline />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {FAMILY_JOURNEY_PHASES.map((phase) => (
            <JourneyPhaseCard key={phase.id} phase={phase} featured={phase.id === "before"} />
          ))}
        </section>

        {stats.pending > 0 ? (
          <section className="clinic-card p-4 border-amber-200 bg-amber-50/80">
            <p className="text-sm font-bold text-amber-900">{t("journey.follow_pending_banner", { count: stats.pending })}</p>
            <Link to="/parent/follow-up" className="text-xs font-bold text-amber-800 underline mt-2 inline-block">
              {t("journey.open_follow_up")}
            </Link>
          </section>
        ) : null}

        <section className="clinic-card p-5 text-center">
          <p className="text-sm text-slate-600 mb-3">{t("journey.clinician_switch_hint")}</p>
          <Link
            to={CLINICIAN_SWITCH_PATH}
            className="inline-flex items-center gap-2 clinic-chip-on text-xs font-bold rounded-full px-4 py-2"
          >
            <Stethoscope className="w-4 h-4" />
            {t("parent.open_clinician")}
          </Link>
        </section>

        <DisclaimerBanner />
      </main>

      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
