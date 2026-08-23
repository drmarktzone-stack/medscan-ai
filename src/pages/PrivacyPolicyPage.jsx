import React from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Smartphone } from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import { useI18n } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const { t } = useI18n();
  const updated = "2026-08-23";

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero icon={Shield} tone="slate" titleKey="privacy.title" subtitleKey="privacy.subtitle" />
      <main className="clinic-wrap pb-12 max-w-2xl mx-auto space-y-6">
        <article className="clinic-panel prose prose-sm prose-slate max-w-none text-start space-y-4 text-sm leading-relaxed text-slate-700">
          <p className="text-xs text-slate-500">{t("privacy.updated", { date: updated })}</p>
          {t("privacy.sections").map((section, i) => (
            <section key={i}>
              <h2 className="text-base font-bold text-slate-900 mt-4">{section.title}</h2>
              {section.body.map((p, j) => (
                <p key={j} className="mt-2">{p}</p>
              ))}
            </section>
          ))}
        </article>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/launch" className="clinic-chip inline-flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            {t("launch.nav")}
          </Link>
          <Link to="/" className="clinic-chip inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t("privacy.back_home")}
          </Link>
        </div>
      </main>
    </div>
  );
}
