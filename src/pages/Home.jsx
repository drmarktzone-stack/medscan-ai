import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Stethoscope, ShieldCheck, Activity, Settings, ScanLine, FlaskConical, UserCog, GitBranch, ListChecks } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AccountSettings from "@/components/AccountSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

const tools = [
  {
    titleKey: "home.ecg_title",
    descKey: "home.ecg_desc",
    icon: Activity,
    path: "/ecg",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    color: "#3b82f6",
  },
  {
    titleKey: "home.skin_title",
    descKey: "home.skin_desc",
    icon: Stethoscope,
    path: "/skin",
    gradient: "from-teal-500 to-emerald-400",
    bg: "bg-teal-50",
    color: "#14b8a6",
  },
  {
    titleKey: "home.radiology_title",
    descKey: "home.radiology_desc",
    icon: ScanLine,
    path: "/radiology",
    gradient: "from-indigo-500 to-violet-400",
    bg: "bg-indigo-50",
    color: "#6366f1",
  },
  {
    titleKey: "home.labs_title",
    descKey: "home.labs_desc",
    icon: FlaskConical,
    path: "/labs",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
    color: "#10b981",
  },
  {
    titleKey: "home.context_title",
    descKey: "home.context_desc",
    icon: UserCog,
    path: "/patient-context",
    gradient: "from-violet-500 to-purple-400",
    bg: "bg-violet-50",
    color: "#8b5cf6",
  },
  {
    titleKey: "home.protocols_title",
    descKey: "home.protocols_desc",
    icon: GitBranch,
    path: "/protocols",
    gradient: "from-sky-500 to-blue-400",
    bg: "bg-sky-50",
    color: "#0ea5e9",
  },
  {
    titleKey: "home.differential_title",
    descKey: "home.differential_desc",
    icon: ListChecks,
    path: "/differential",
    gradient: "from-rose-500 to-pink-400",
    bg: "bg-rose-50",
    color: "#f43f5e",
  },
];

export default function Home() {
  const { t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Top actions */}
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <LanguageSwitcher />
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t("home.settings")}
        </button>
      </div>

      {/* Header */}
      <header className="pt-6 pb-8 px-6 text-center">
        <img
          src="https://media.base44.com/images/public/6a44d05c8195d3fd459fae15/73f2e9a38_generated_image.png"
          alt={t("home.hero_alt")}
          className="w-full max-w-md mx-auto rounded-2xl mb-6 shadow-lg shadow-blue-500/10"
        />
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          MedScan AI
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm leading-relaxed">
          {t("home.subtitle")}
        </p>
      </header>

      {/* Tools */}
      <main className="max-w-lg mx-auto px-5 pb-10 space-y-4">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="block group">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 select-none">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center shrink-0`}>
                  <tool.icon className="w-6 h-6" style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {t(tool.titleKey)}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t(tool.descKey)}
                  </p>
                </div>
                <div className="text-muted-foreground/40 group-hover:text-primary transition-colors mt-1">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: ShieldCheck, labelKey: "home.feat_privacy" },
            { icon: Activity, labelKey: "home.feat_instant" },
            { icon: Heart, labelKey: "home.feat_ai" },
          ].map((feat) => (
            <div key={feat.labelKey} className="text-center p-3 rounded-xl bg-white/60 border border-slate-100 select-none">
              <feat.icon className="w-5 h-5 mx-auto text-primary/60 mb-1.5" />
              <p className="text-[11px] font-medium text-muted-foreground">{t(feat.labelKey)}</p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <DisclaimerBanner />
        </div>
      </main>

      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}