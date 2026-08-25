import React, { useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import ShareBanner from "@/freeai/components/ShareBanner";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import GenerationPanel from "@/freeai/components/GenerationPanel";
import { getCreditsDashboard } from "@/freeai/lib/planner.js";
import { googleLabsProviders, CAPABILITY_META } from "@/freeai/data/providers.js";
import { useI18n } from "../lib/i18n.jsx";
import { R } from "@/freeai/lib/routes.js";
import MotifIcon from "@/freeai/components/MotifIcon.jsx";
import AISetupPanel from "@/freeai/components/AISetupPanel.jsx";
import { Gift, Sparkles, Zap, ExternalLink } from "lucide-react";

export default function FreeAIHub() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const dashboard = useMemo(() => getCreditsDashboard(), []);

  const googleLabs = googleLabsProviders();
  const topProviders = dashboard.providers.slice(0, 6);

  return (
    <FreeAILayout>
      <section className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-sm mb-6">
          <Gift className="w-4 h-4" />
          {locale === "he"
            ? `${dashboard.grandTotal.toLocaleString()}+ קרדיטים חינמיים זמינים`
            : `${dashboard.grandTotal.toLocaleString()}+ free credits available`}
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
          {locale === "he" ? (
            <>
              צור תמונות, וידאו ועיצובים
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                בלי לשלם שקל
              </span>
            </>
          ) : (
            <>
              Create images, video & designs
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                without paying a cent
              </span>
            </>
          )}
        </h1>

        <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
          {locale === "he"
            ? "הכלי החכם שאוסף קרדיטים חינמיים מ-Google Labs, Leonardo, Ideogram, Runway ועוד — ומתכנן את הפרויקט שלך שלב-שלב."
            : "The smart tool that collects free credits from Google Labs, Leonardo, Ideogram, Runway and more — and plans your project step by step."}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link to={R.create}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold text-lg hover:opacity-90 flex items-center gap-2 shadow-lg shadow-violet-500/25"
          >
            <Sparkles className="w-5 h-5" />
            {locale === "he" ? "✨ התחל ליצור" : "✨ Start creating"}
          </Link>
          <Link to={R.planner}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold hover:opacity-90 flex items-center gap-2"
          >
            {locale === "he" ? "📋 תכנן פרויקט" : "📋 Plan project"}
          </Link>
          <Link to={R.providers}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold hover:opacity-90 flex items-center gap-2"
          >
            {locale === "he" ? "💰 חלוקת קרדיטים" : "💰 Credit split"}
          </Link>
          <Link to={R.passport}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-semibold hover:opacity-90 flex items-center gap-2"
          >
            {locale === "he" ? "🧠 Credit Passport" : "🧠 Credit Passport"}
          </Link>
          <Link to={R.kids}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-semibold hover:opacity-90 flex items-center gap-2"
          >
            🌟 Kids
          </Link>
        </div>
      </section>

      <section className="mb-10 max-w-2xl mx-auto">
        <ShareBanner locale={locale} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { cap: "image", motif: "art", color: "from-blue-500 to-cyan-500" },
          { cap: "video", motif: "game", color: "from-purple-500 to-pink-500" },
          { cap: "design", motif: "logo", color: "from-orange-500 to-red-500" },
        ].map(({ cap, motif, color }) => (
          <div key={cap} className="fa-surface p-4 flex items-center gap-4 sm:flex-col sm:text-center">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <MotifIcon motif={motif} size="md" accent="#ffffff" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">
                {(dashboard.byCapability[cap] || 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/50 mt-1">
                {locale === "he" ? CAPABILITY_META[cap]?.labelHe : CAPABILITY_META[cap]?.labelEn}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          {locale === "he" ? "Google Labs — כלול!" : "Google Labs — included!"}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {googleLabs.map((p) => (
            <a
              key={p.id}
              href={p.generateUrl || p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">{locale === "he" ? p.nameHe : p.name}</h3>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-violet-400" />
              </div>
              <p className="text-xs text-white/50 mb-3">
                {locale === "he" ? p.notesHe : p.notesEn}
              </p>
              <div className="text-sm font-semibold text-violet-300">
                {p.defaultCredits} {locale === "he" ? "קרדיטים/יום" : "credits/day"}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <AISetupPanel lang={lang} />
      </section>

      <section className="mb-10">
        <GenerationPanel locale={locale} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            {locale === "he" ? "ספקים מובילים" : "Top providers"}
          </h2>
          <Link to={R.providers} className="text-sm text-violet-400 hover:text-violet-300">
            {locale === "he" ? "הכל →" : "All →"}
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topProviders.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{locale === "he" ? p.nameHe : p.name}</div>
                <div className="text-xs text-white/50">{p.remaining} credits</div>
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </FreeAILayout>
  );
}
