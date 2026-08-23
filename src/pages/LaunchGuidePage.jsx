import React from "react";
import { Link } from "react-router-dom";
import {
  Smartphone, CheckCircle2, Globe, Shield, Megaphone, ExternalLink,
} from "lucide-react";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import { useI18n } from "@/lib/i18n";

function StepCard({ n, title, body, done = false }) {
  return (
    <div className={`clinic-panel flex gap-4 ${done ? "border-emerald-200/70" : ""}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${done ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}>
        {done ? <CheckCircle2 className="w-5 h-5" /> : n}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function LaunchGuidePage() {
  const { t } = useI18n();

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={Smartphone}
        tone="sky"
        badgeKey="launch.badge"
        titleKey="launch.title"
        subtitleKey="launch.subtitle"
      />
      <main className="clinic-wrap pb-12 max-w-2xl mx-auto space-y-8">
        <section className="space-y-3">
          <h2 className="clinic-h2">{t("launch.play_title")}</h2>
          <div className="space-y-3">
            {t("launch.play_steps").map((s, i) => (
              <StepCard key={s.title} n={i + 1} title={s.title} body={s.body} done={s.done} />
            ))}
          </div>
        </section>

        <section className="clinic-panel">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="clinic-h2">{t("launch.free_host_title")}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {t("launch.free_host_items").map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="clinic-panel">
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="clinic-h2">{t("launch.marketing_title")}</h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {t("launch.marketing_items").map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/privacy" className="clinic-chip inline-flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t("privacy.nav")}
          </Link>
          <Link to="/pricing" className="clinic-chip inline-flex items-center gap-2">
            {t("pricing.nav")}
          </Link>
          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="clinic-cta inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            Google Play Console
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}
