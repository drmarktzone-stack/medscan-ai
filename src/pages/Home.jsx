import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Stethoscope, ShieldCheck, Activity, Settings, ScanLine, FlaskConical,
  UserCog, GitBranch, ListChecks, Database, Biohazard, Flame, Baby, Brain, Bone,
  Dna, Droplets, Waves, Mic, Pill, LogIn, UserPlus,
} from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AccountSettings from "@/components/AccountSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import OnboardingOverlay from "@/components/clinic/OnboardingOverlay";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { loadAccount } from "@/lib/clinic/account";

const portals = [
  {
    titleKey: "home.doctorped_title",
    descKey: "home.doctorped_desc",
    ctaKey: "home.open_clinician",
    icon: Stethoscope,
    path: "/doctorped",
    blob: "from-sky-400 to-cyan-300",
  },
  {
    titleKey: "home.parent_title",
    descKey: "home.parent_desc",
    ctaKey: "home.open_parent",
    icon: Heart,
    path: "/parent",
    blob: "from-rose-400 to-orange-300",
  },
];

const medscan = [
  { titleKey: "home.ecg_title", descKey: "home.ecg_desc", icon: Activity, path: "/ecg", color: "#3b82f6" },
  { titleKey: "home.skin_title", descKey: "home.skin_desc", icon: Stethoscope, path: "/skin", color: "#14b8a6" },
  { titleKey: "home.radiology_title", descKey: "home.radiology_desc", icon: ScanLine, path: "/radiology", color: "#6366f1" },
  { titleKey: "home.labs_title", descKey: "home.labs_desc", icon: FlaskConical, path: "/labs", color: "#10b981" },
  { titleKey: "home.context_title", descKey: "home.context_desc", icon: UserCog, path: "/patient-context", color: "#8b5cf6" },
  { titleKey: "home.protocols_title", descKey: "home.protocols_desc", icon: GitBranch, path: "/protocols", color: "#0ea5e9" },
  { titleKey: "home.differential_title", descKey: "home.differential_desc", icon: ListChecks, path: "/differential", color: "#f43f5e" },
  { titleKey: "home.kbadmin_title", descKey: "home.kbadmin_desc", icon: Database, path: "/knowledge-admin", color: "#64748b" },
];

const extras = [
  { titleKey: "home.tox_title", descKey: "home.tox_desc", icon: Biohazard, path: "/tox", color: "#ea580c" },
  { titleKey: "home.trauma_title", descKey: "home.trauma_desc", icon: Flame, path: "/trauma", color: "#dc2626" },
  { titleKey: "home.growth_title", descKey: "home.growth_desc", icon: Activity, path: "/growth", color: "#65a30d" },
  { titleKey: "home.nutrition_title", descKey: "home.nutrition_desc", icon: Baby, path: "/nutrition", color: "#d97706" },
  { titleKey: "home.neurodev_title", descKey: "home.neurodev_desc", icon: Brain, path: "/neurodev", color: "#c026d3" },
  { titleKey: "home.chronic_title", descKey: "home.chronic_desc", icon: Pill, path: "/chronic", color: "#db2777" },
  { titleKey: "home.syndromes_title", descKey: "home.syndromes_desc", icon: GitBranch, path: "/syndromes", color: "#7c3aed" },
  { titleKey: "home.metabolic_title", descKey: "home.metabolic_desc", icon: Droplets, path: "/metabolic", color: "#0d9488" },
  { titleKey: "home.genetics_title", descKey: "home.genetics_desc", icon: Dna, path: "/genetics", color: "#4f46e5" },
  { titleKey: "home.csf_title", descKey: "home.csf_desc", icon: Droplets, path: "/csf", color: "#0284c7" },
  { titleKey: "home.us_title", descKey: "home.us_desc", icon: Waves, path: "/us", color: "#0891b2" },
  { titleKey: "home.eeg_title", descKey: "home.eeg_desc", icon: Brain, path: "/eeg", color: "#2563eb" },
  { titleKey: "home.audio_title", descKey: "home.audio_desc", icon: Mic, path: "/audio", color: "#475569" },
  { titleKey: "home.referrals_title", descKey: "home.referrals_desc", icon: Bone, path: "/referrals", color: "#ca8a04" },
];

function ToolGrid({ items, t }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((tool) => (
        <Link key={tool.path} to={tool.path} className="clinic-card p-4 hover:bg-white/70 transition-all group">
          <div className="flex items-start gap-3">
            <div className="clinic-icon">
              <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold group-hover:text-primary">{t(tool.titleKey)}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(tool.descKey)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const { user, isLocalClinic } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showAuthLinks = isLocalClinic || !user?.email;
  const role = loadAccount().role;
  const visiblePortals = role === "clinician" ? portals.filter((p) => p.path === "/doctorped") : portals;

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

      <header className="clinic-wrap pt-8 pb-8 text-center">
        <div className="clinic-icon w-16 h-16 mx-auto mb-4">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("home.brand")}</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm leading-relaxed">
          {t("home.subtitle")}
        </p>
        <p className="text-[11px] text-sky-800/70 mt-2 font-medium">{t("home.not_diagnosis")}</p>
      </header>

      <main className="clinic-wrap pb-10 space-y-8">
        <section>
          <h2 className="text-sm font-extrabold text-slate-700 mb-3">{t("home.group_medscan")}</h2>
          <ToolGrid items={medscan} t={t} />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          {visiblePortals.map((p) => (
            <Link key={p.path} to={p.path} className="clinic-card p-6 hover:bg-white/70 transition group">
              <div className="clinic-icon w-12 h-12 mb-4">
                <p.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{t(p.titleKey)}</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{t(p.descKey)}</p>
              <span className="inline-block mt-5 text-xs font-bold bg-primary text-white rounded-full px-3 py-1.5 shadow-[0_8px_18px_-10px_hsl(var(--primary))]">
                {t(p.ctaKey)}
              </span>
            </Link>
          ))}
        </section>

        <section>
          <h2 className="text-sm font-extrabold text-slate-700 mb-3">{t("home.group_community")}</h2>
          <ToolGrid items={extras} t={t} />
        </section>

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
