import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, ShieldCheck, Activity, Settings, Heart, LogIn, UserPlus, Sparkles, Route } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AccountSettings from "@/components/AccountSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import OnboardingOverlay from "@/components/clinic/OnboardingOverlay";
import ClinicianToolShelves from "@/components/journey/ClinicianToolShelves";
import JourneyTimeline from "@/components/journey/JourneyTimeline";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { loadAccount, visibleHomeDoors } from "@/lib/clinic/account";

export default function Home() {
  const { t } = useI18n();
  const { user, isLocalClinic } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showAuthLinks = isLocalClinic || !user?.email;
  const role = loadAccount().role;
  const showFamilyPreview = visibleHomeDoors(role).includes("/parent");

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

      <header className="clinic-wrap pt-8 pb-6 text-center">
        <div className="clinic-icon w-16 h-16 mx-auto mb-4">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <p className="inline-flex items-center gap-1.5 clinic-chip-on text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t("journey.badge")}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("home.brand")}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
          {t("journey.clinician_hub_subtitle")}
        </p>
        <p className="text-[11px] text-sky-800/70 mt-2 font-medium">{t("home.not_diagnosis")}</p>
      </header>

      <main className="clinic-wrap pb-10 space-y-8">
        <section className="clinic-card p-5 sm:p-6 border-2 border-sky-200/60">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-sky-700" />
            <h2 className="text-base font-extrabold text-slate-900">{t("journey.platform_title")}</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{t("journey.platform_desc")}</p>
          <JourneyTimeline compact />
          {showFamilyPreview ? (
            <Link
              to="/parent"
              className="mt-5 inline-flex items-center gap-2 clinic-chip-on text-xs font-bold rounded-full px-4 py-2"
            >
              <Heart className="w-4 h-4" />
              {t("journey.open_family_hub")}
            </Link>
          ) : null}
        </section>

        <ClinicianToolShelves />

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, labelKey: "home.feat_privacy" },
            { icon: Activity, labelKey: "home.feat_instant" },
            { icon: Heart, labelKey: "home.feat_ai" },
          ].map((feat) => (
            <div key={feat.labelKey} className="text-center p-3 rounded-xl clinic-card">
              <feat.icon className="w-5 h-5 mx-auto text-primary/80 mb-1.5" />
              <p className="text-[11px] font-medium text-muted-foreground">{t(feat.labelKey)}</p>
            </div>
          ))}
        </div>
        <DisclaimerBanner />
      </main>

      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
      <OnboardingOverlay />
    </div>
  );
}
