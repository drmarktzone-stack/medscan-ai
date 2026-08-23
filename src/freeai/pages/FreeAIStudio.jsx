import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import PipelineWorkspace, { ComparePromptsPanel } from "@/freeai/components/PipelineWorkspace";
import { PROFESSION_TEMPLATES } from "@/freeai/data/templates";
import { getTotalSavings, formatSavings } from "@/freeai/lib/savingsCalculator";
import { getNotifications } from "@/freeai/lib/creditRadar";
import { loadBrandKit, saveBrandKit } from "@/freeai/lib/brandKit";
import { addToQueue, getNextResetLabel, loadQueue } from "@/freeai/lib/nightQueue";
import { topPrompts, addCommunityPrompt } from "@/freeai/lib/communityPrompts";
import { parseCsv, csvToTasks, csvTemplate } from "@/freeai/lib/csvImport";
import { getQuotaState } from "@/freeai/lib/projectQuota";
import { useI18n } from "@/lib/i18n";
import CreditHarvesterWizard, { CreditScoreBadge } from "@/freeai/components/CreditHarvesterWizard";
import { getPrimaryEmail } from "@/freeai/lib/creditPassport";
import {
  Sparkles, Zap, Moon, Star, Upload, Palette, Bell, Gift,
  Code2, Image, MessageCircle,
} from "lucide-react";

export default function FreeAIStudio() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [urgent, setUrgent] = useState(false);
  const [brand, setBrand] = useState(() => loadBrandKit());
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("workspace");

  const savings = useMemo(() => getTotalSavings(), []);
  const notifications = useMemo(() => getNotifications(locale), [locale]);
  const quota = getQuotaState();
  const community = topPrompts(null, 5);
  const queue = loadQueue();

  const hasEmail = !!getPrimaryEmail();

  const tabs = [
    { id: "workspace", labelHe: "סטודיו", labelEn: "Studio", icon: Sparkles },
    { id: "templates", labelHe: "תבניות", labelEn: "Templates", icon: Zap },
    { id: "tools", labelHe: "כלים", labelEn: "Tools", icon: Code2 },
  ];

  return (
    <FreeAILayout>
      {/* Hero + savings */}
      <section className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-sm mb-4">
          <Gift className="w-4 h-4" />
          {locale === "he"
            ? `חסכת עד כה: ${formatSavings(savings, locale)} · ${quota.remaining} פרויקטים חינמיים`
            : `Saved so far: ${formatSavings(savings, locale)} · ${quota.remaining} free projects`}
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3">
          {locale === "he" ? (
            <>FreeAI <span className="text-violet-400">Studio</span></>
          ) : (
            <>FreeAI <span className="text-violet-400">Studio</span></>
          )}
        </h1>
        <p className="text-white/60 max-w-xl mx-auto text-sm">
          {locale === "he"
            ? "ממשק אחד — קוד → עיצוב → deploy. ברקע הכלי מסתובב בין כל כלי ה-AI החינמיים."
            : "One interface — code → design → deploy. Background auto-switching across all free AI tools."}
        </p>
      </section>

      {/* Credit Passport prompt if no email */}
      {!hasEmail && (
        <div className="mb-6">
          <CreditHarvesterWizard locale={locale} onComplete={() => window.location.reload()} />
        </div>
      )}

      {hasEmail && <CreditScoreBadge locale={locale} />}

      {/* Credit notifications */}
      {notifications.length > 0 && (
        <div className="mb-4 space-y-1">
          {notifications.slice(0, 3).map((n, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-violet-500/10 rounded-lg px-3 py-2 text-violet-200">
              <Bell className="w-3 h-3 shrink-0" />
              {locale === "he" ? n.messageHe : n.messageEn}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
        {tabs.map(({ id, labelHe, labelEn, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? "bg-violet-600 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {locale === "he" ? labelHe : labelEn}
          </button>
        ))}
      </div>

      {activeTab === "workspace" && (
        <div className="space-y-6">
          {/* Urgent mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgent(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${!urgent ? "bg-violet-600 text-white" : "bg-white/10 text-white/60"}`}
            >
              {locale === "he" ? "פרויקט מלא" : "Full project"}
            </button>
            <button
              type="button"
              onClick={() => setUrgent(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${urgent ? "bg-red-600 text-white" : "bg-white/10 text-white/60"}`}
            >
              🚨 {locale === "he" ? "דחוף — 10 דק'" : "Urgent — 10 min"}
            </button>
          </div>

          <PipelineWorkspace
            locale={locale}
            template={selectedTemplate}
            urgent={urgent}
            onComplete={() => setSelectedTemplate(null)}
          />
        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid md:grid-cols-2 gap-4">
          {PROFESSION_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setSelectedTemplate(t); setActiveTab("workspace"); }}
              className="text-right rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-violet-500/30 hover:bg-white/10 transition-all"
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <h3 className="font-bold text-white">{locale === "he" ? t.titleHe : t.titleEn}</h3>
              <p className="text-xs text-white/50 mt-1">{locale === "he" ? t.descHe : t.descEn}</p>
              <p className="text-xs text-emerald-400 mt-2">
                {locale === "he" ? "חיסכון משוער:" : "Est. savings:"} {formatSavings(t.savingsIls, locale)}
              </p>
            </button>
          ))}
        </div>
      )}

      {activeTab === "tools" && (
        <div className="space-y-6">
          {/* Brand Kit */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" />
              Brand Kit
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-white/60">
                {locale === "he" ? "צבע ראשי" : "Primary"}
                <input type="color" value={brand.primaryColor}
                  onChange={(e) => { const b = { ...brand, primaryColor: e.target.value }; setBrand(b); saveBrandKit(b); }}
                  className="block w-full h-8 rounded mt-1" />
              </label>
              <label className="text-xs text-white/60">
                {locale === "he" ? "צבע משני" : "Secondary"}
                <input type="color" value={brand.secondaryColor}
                  onChange={(e) => { const b = { ...brand, secondaryColor: e.target.value }; setBrand(b); saveBrandKit(b); }}
                  className="block w-full h-8 rounded mt-1" />
              </label>
            </div>
            <input
              value={brand.styleKeywords}
              onChange={(e) => { const b = { ...brand, styleKeywords: e.target.value }; setBrand(b); saveBrandKit(b); }}
              placeholder={locale === "he" ? "סגנון: מודרני, מקצועי..." : "Style: modern, professional..."}
              className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 text-white px-3 py-2 text-sm"
            />
          </section>

          {/* CSV Import */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400" />
              {locale === "he" ? "ייבוא CSV — קטלוג מוצרים" : "CSV Import — product catalog"}
            </h3>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={csvTemplate()}
              className="w-full h-20 rounded-lg bg-black/30 border border-white/10 text-white text-xs p-2 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseCsv(csvText);
                if (parsed.ok) setCsvResult(csvToTasks(parsed.rows));
              }}
              className="mt-2 px-4 py-1.5 rounded-lg bg-sky-600 text-white text-sm"
            >
              {locale === "he" ? "נתח CSV" : "Parse CSV"}
            </button>
            {csvResult && (
              <p className="text-xs text-emerald-400 mt-2">
                {csvResult.length} {locale === "he" ? "מוצרים מוכנים ליצירה" : "products ready"}
              </p>
            )}
          </section>

          {/* Night Queue */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              {locale === "he" ? "תור לילה" : "Night queue"}
            </h3>
            <p className="text-xs text-white/50 mb-2">
              {locale === "he"
                ? `יצירות מתוזמנות ל-${getNextResetLabel(locale)}`
                : `Scheduled for ${getNextResetLabel(locale)}`}
            </p>
            <button
              type="button"
              onClick={() => addToQueue({ type: "image", prompt: "pending generation", count: 5 })}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm"
            >
              {locale === "he" ? "הוסף לתור" : "Add to queue"}
            </button>
            {queue.length > 0 && (
              <p className="text-xs text-white/40 mt-2">{queue.length} {locale === "he" ? "בתור" : "in queue"}</p>
            )}
          </section>

          {/* Community Prompts */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              {locale === "he" ? "Prompts מומלצים" : "Top prompts"}
            </h3>
            <div className="space-y-2">
              {community.map((p) => (
                <div key={p.id} className="text-xs bg-black/20 rounded-lg p-2 flex justify-between">
                  <span className="text-white/70 truncate flex-1">{p.prompt}</span>
                  <span className="text-amber-400 shrink-0 mr-2">⭐ {p.rating}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder={locale === "he" ? "שתף prompt..." : "Share prompt..."}
                className="flex-1 rounded-lg bg-black/30 border border-white/10 text-white px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => { if (newPrompt) { addCommunityPrompt(newPrompt, "image", "pollinations"); setNewPrompt(""); } }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs"
              >
                +
              </button>
            </div>
          </section>

          {/* WhatsApp bot placeholder */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              WhatsApp Bot
            </h3>
            <p className="text-xs text-white/50">
              {locale === "he"
                ? "בקרוב: שלח הודעה ב-WhatsApp וקבל תמונות + תוכנית פרויקט"
                : "Coming soon: send a WhatsApp message, get images + project plan"}
            </p>
          </section>

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            <Link to="/freeai" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <Image className="w-3 h-3" /> Hub
            </Link>
            <Link to="/freeai/planner" className="text-xs text-violet-400 hover:text-violet-300">
              {locale === "he" ? "מתכנן" : "Planner"}
            </Link>
            <Link to="/freeai/providers" className="text-xs text-violet-400 hover:text-violet-300">
              {locale === "he" ? "ספקים" : "Providers"}
            </Link>
          </div>
        </div>
      )}
    </FreeAILayout>
  );
}
