import React, { useState, useMemo } from "react";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import CreditHarvesterWizard, { CreditScoreBadge } from "@/freeai/components/CreditHarvesterWizard";
import { loadPassport, getAllEmails, generateEmailAliases, addAltEmail } from "@/freeai/lib/creditPassport";
import { buildHarvestPlan, getHarvestProgress, OAUTH_CLUSTERS } from "@/freeai/lib/creditHarvester";
import { calculateCreditScore, canCompleteProject } from "@/freeai/lib/creditScore";
import { getProvider, ALL_PROVIDERS } from "@/freeai/data/providers";
import { useI18n } from "@/lib/i18n";
import {
  Mail, Shield, Zap, Calendar, RefreshCw, ChevronDown, ChevronUp,
  Globe, Code2, Palette, Rocket, Star, Lightbulb,
} from "lucide-react";

const GENIUS_FEATURES = [
  { icon: "🧠", titleHe: "Credit Score", titleEn: "Credit Score", descHe: "ציון AI שמחשב כמה פרויקטים תוכל לבנות בחינם", descEn: "AI score calculating how many free projects you can build", done: true },
  { icon: "📧", titleHe: "Credit Passport", titleEn: "Credit Passport", descHe: "מייל אחד — מלקט קרדיטים מ-30+ platforms", descEn: "One email — harvest credits from 30+ platforms", done: true },
  { icon: "🔄", titleHe: "OAuth Clusters", titleEn: "OAuth Clusters", descHe: "הרשמה אחת ל-Google = 4 כלים, GitHub = 2 כלים", descEn: "One Google signup = 4 tools, GitHub = 2 tools", done: true },
  { icon: "🤖", titleHe: "Autopilot Harvest", titleEn: "Autopilot Harvest", descHe: "Wizard שפותח הרשמות ברצף — אתה רק מאשר", descEn: "Wizard opens signups in sequence — you just confirm", done: true },
  { icon: "📅", titleHe: "Credit Calendar", titleEn: "Credit Calendar", descHe: "מתי כל platform מתאפס — daily/monthly", descEn: "When each platform resets — daily/monthly", done: true },
  { icon: "🔀", titleHe: "Multi-Email Strategy", titleEn: "Multi-Email Strategy", descHe: "user+freeai1@gmail.com — כפול קרדיטים (Gmail)", descEn: "user+freeai1@gmail.com — double credits (Gmail)", done: true },
  { icon: "⚡", titleHe: "Zero-Signup Auto", titleEn: "Zero-Signup Auto", descHe: "Pollinations + GitHub Pages — פעילים מיד", descEn: "Pollinations + GitHub Pages — active instantly", done: true },
  { icon: "🛡️", titleHe: "Failover Chain", titleEn: "Failover Chain", descHe: "נגמרו קרדיטים? עובר אוטומטית לספק הבא", descEn: "Credits exhausted? Auto-switch to next provider", done: true },
  { icon: "📱", titleHe: "WhatsApp Bot", titleEn: "WhatsApp Bot", descHe: "שלח הודעה — קבל תמונות + קוד + deploy", descEn: "Send message — get images + code + deploy", done: false },
  { icon: "🧩", titleHe: "Browser Extension", titleEn: "Browser Extension", descHe: "\"יש קרדיטים חינם\" כשנכנסים ל-Midjourney", descEn: "\"Free credits available\" when visiting Midjourney", done: false },
  { icon: "🔗", titleHe: "Referral Harvester", titleEn: "Referral Harvester", descHe: "בונוס קרדיטים מקישורי referral", descEn: "Bonus credits from referral links", done: false },
  { icon: "🌐", titleHe: "API Auto-Import", titleEn: "API Auto-Import", descHe: "זיהוי API keys מה-clipboard אוטומטית", descEn: "Auto-detect API keys from clipboard", done: false },
];

export default function CreditPassportPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAliases, setShowAliases] = useState(false);
  const [altEmail, setAltEmail] = useState("");
  const [expandedFeature, setExpandedFeature] = useState(null);

  const passport = useMemo(() => { void refreshKey; return loadPassport(); }, [refreshKey]);
  const plan = useMemo(() => passport?.email ? buildHarvestPlan(passport.email) : null, [passport, refreshKey]);
  const progress = useMemo(() => getHarvestProgress(), [refreshKey]);
  const score = useMemo(() => calculateCreditScore(), [refreshKey]);
  const canFull = useMemo(() => canCompleteProject("full"), [refreshKey]);

  const aliases = passport?.email ? generateEmailAliases(passport.email, 3) : [];

  const resetCalendar = ALL_PROVIDERS.reduce((acc, p) => {
    const period = p.resetPeriod;
    if (!acc[period]) acc[period] = [];
    acc[period].push(p);
    return acc;
  }, {});

  return (
    <FreeAILayout>
      <section className="py-4">
        <h1 className="text-2xl font-black text-white mb-1">
          {locale === "he" ? "Credit Passport" : "Credit Passport"}
        </h1>
        <p className="text-white/50 text-sm mb-6">
          {locale === "he"
            ? "מייל אחד → כל הקרדיטים החינמיים → פרויקט מושלם ב-₪0"
            : "One email → all free credits → complete project for $0"}
        </p>

        <CreditScoreBadge locale={locale} />

        <div className="mt-6">
          <CreditHarvesterWizard
            locale={locale}
            onComplete={() => setRefreshKey((k) => k + 1)}
          />
        </div>

        {passport?.email && plan && (
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-violet-400">{progress.percent}%</div>
              <div className="text-xs text-white/50">{locale === "he" ? "נאסף" : "Harvested"}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{score.runway.totalCredits.toLocaleString()}</div>
              <div className="text-xs text-white/50">{locale === "he" ? "קרדיטים פעילים" : "Active credits"}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
              <div className="text-2xl font-black text-fuchsia-400">{score.runway.fullProjectsEstimate}</div>
              <div className="text-xs text-white/50">{locale === "he" ? "פרויקטים אפשריים" : "Possible projects"}</div>
            </div>
          </div>
        )}

        {/* OAuth Clusters */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            {locale === "he" ? "הרשמה אחת = כמה כלים" : "One signup = multiple tools"}
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {Object.entries(OAUTH_CLUSTERS).map(([id, cluster]) => (
              <div key={id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl mb-2">{cluster.icon}</div>
                <h3 className="font-bold text-white text-sm">{locale === "he" ? cluster.labelHe : cluster.labelEn}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {cluster.providers.map((pid) => {
                    const p = getProvider(pid);
                    return (
                      <span key={pid} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200">
                        {p?.nameHe?.split(" ")[0] || pid}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Multi-email strategy */}
        {passport?.email && (
          <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
            <button
              type="button"
              onClick={() => setShowAliases(!showAliases)}
              className="w-full flex items-center justify-between text-white font-bold"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" />
                {locale === "he" ? "אסטרטגיית Multi-Email" : "Multi-Email Strategy"}
              </span>
              {showAliases ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAliases && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/50">
                  {locale === "he"
                    ? "Gmail מתעלם מ-+suffix — כל alias = חשבון נפרד (בדוק ToS)"
                    : "Gmail ignores +suffix — each alias = separate account (check ToS)"}
                </p>
                {aliases.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-xs bg-black/20 rounded-lg px-3 py-2">
                    <span dir="ltr" className="text-white/70 flex-1">{a}</span>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(a)} className="text-violet-400">Copy</button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    value={altEmail}
                    onChange={(e) => setAltEmail(e.target.value)}
                    placeholder={locale === "he" ? "מייל נוסף..." : "Additional email..."}
                    className="flex-1 rounded-lg bg-black/30 border border-white/10 text-white px-3 py-1.5 text-xs"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => { addAltEmail(altEmail); setAltEmail(""); setRefreshKey((k) => k + 1); }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Credit Calendar */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            {locale === "he" ? "לוח איפוס קרדיטים" : "Credit Reset Calendar"}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(resetCalendar).map(([period, providers]) => (
              <div key={period} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-sm capitalize">{period}</span>
                  <span className="text-xs text-white/40">({providers.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {providers.slice(0, 6).map((p) => (
                    <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-200">
                      {p.nameHe.split(" ")[0]}
                    </span>
                  ))}
                  {providers.length > 6 && <span className="text-[10px] text-white/30">+{providers.length - 6}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project readiness */}
        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-green-400" />
            {locale === "he" ? "מוכנות לפרויקט" : "Project readiness"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "full", icon: Rocket, labelHe: "פרויקט מלא", labelEn: "Full project" },
              { key: "landing", icon: Globe, labelHe: "Landing", labelEn: "Landing" },
              { key: "images", icon: Palette, labelHe: "תמונות", labelEn: "Images" },
              { key: "video", icon: Star, labelHe: "וידאו", labelEn: "Video" },
            ].map(({ key, icon: Icon, labelHe, labelEn }) => {
              const check = canCompleteProject(key);
              return (
                <div key={key} className={`rounded-lg p-3 text-center ${check.ok ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${check.ok ? "text-emerald-400" : "text-red-400"}`} />
                  <div className="text-xs font-bold text-white">{locale === "he" ? labelHe : labelEn}</div>
                  <div className={`text-[10px] ${check.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {check.ok ? "✓" : `✗ ${check.gaps.join(", ")}`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Genius features roadmap */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            {locale === "he" ? "יכולות גאוניות" : "Genius capabilities"}
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {GENIUS_FEATURES.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                className={`text-right rounded-xl border p-3 transition-all ${
                  f.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{f.icon}</span>
                  <span className="font-bold text-white text-sm flex-1">{locale === "he" ? f.titleHe : f.titleEn}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${f.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/40"}`}>
                    {f.done ? "✓" : "🔜"}
                  </span>
                </div>
                {expandedFeature === i && (
                  <p className="text-xs text-white/50 mt-2">{locale === "he" ? f.descHe : f.descEn}</p>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <section className="mt-8">
            <h2 className="font-bold text-white mb-3">{locale === "he" ? "המלצות AI" : "AI Recommendations"}</h2>
            <div className="space-y-2">
              {score.recommendations.map((r, i) => (
                <div key={i} className={`text-sm rounded-lg px-4 py-3 ${
                  r.priority === "critical" ? "bg-red-500/10 text-red-300" :
                  r.priority === "high" ? "bg-amber-500/10 text-amber-300" :
                  "bg-white/5 text-white/60"
                }`}>
                  {locale === "he" ? r.messageHe : r.messageEn}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </FreeAILayout>
  );
}
