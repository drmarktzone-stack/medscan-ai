import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import {
  CREATE_URL, PRICING_URL, CHECKOUT_URL, getPublicOrigin,
  shareMessage, whatsAppShareUrl, twitterShareUrl, linkedInShareUrl,
  emailShareUrl, telegramShareUrl, OUTREACH_TARGETS, OUTREACH_EMAILS,
} from "@/freeai/lib/marketing.js";
import { trackedUrl, loadStats, trackEvent, getProgress, KPI_TARGETS } from "@/freeai/lib/marketingTracker.js";
import { buildPaymentConfirmWhatsApp } from "@/freeai/lib/paymentConfig.js";
import { useI18n } from "@/lib/i18n";
import {
  Megaphone, Copy, CheckCircle2, MessageCircle, Mail, Share2,
  ExternalLink, Target, TrendingUp, Zap, Crown, Send,
} from "lucide-react";

const DIRECTORY_LINKS = [
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new", en: true },
  { name: "AlternativeTo", url: "https://alternativeto.net/manage/new/", en: true },
  { name: "There's An AI For That", url: "https://theresanaiforthat.com/submit/", en: true },
  { name: "Futurepedia", url: "https://www.futurepedia.io/submit-tool", en: true },
  { name: "Toolify.ai", url: "https://www.toolify.ai/submit", en: true },
  { name: "TopAI.tools", url: "https://topai.tools/submit", en: true },
];

const SOCIAL_POSTS = {
  facebook_he: `🚀 גיליתי כלי AI שחוסך לי ₪500+ בחודש

FreeAI Hub — כל כלי ה-AI בממשק אחד:
✅ תמונות (Google ImageFX, Leonardo, Ideogram)
✅ קוד (Bolt.new, v0, Lovable)
✅ עיצוב + וידאו + deploy

Pro: ₪20/חודש בלבד (חינם לנסות!)

🔗 ${CREATE_URL}

#AI #עסקיםקטנים #יזמות #שיווקדיגיטלי`,

  whatsapp_group_he: `היי 👋

ממליץ על FreeAI Hub — כלי שמאגד את כל AI החינמיים + Pro ב-₪20/חודש:

🖼️ תמונות · 💻 קוד · 🎨 עיצוב · 🎬 וידאו · 🚀 פרויקט שלם

נסו חינם: ${CREATE_URL}
Pro: ${PRICING_URL}`,

  reddit_sideproject_en: `I built FreeAI Hub — aggregates 30+ free AI tools (Google Labs, Bolt, Leonardo, Runway) into one ChatGPT-style workspace. Pro is only ₪20/month (~$5). Try free: ${CREATE_URL}`,
};

function CopyBlock({ label, text, onCopy }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
        <span className="text-xs font-bold text-white/70">{label}</span>
        <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
          {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "הועתק!" : "העתק"}
        </button>
      </div>
      <pre className="p-3 text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">{text}</pre>
    </div>
  );
}

function KpiBar({ label, current, target, pct }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-violet-300 font-bold">{current}/{target}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FreeAIMarketingPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const [stats, setStats] = useState(loadStats);
  const origin = getPublicOrigin();

  const trackedCreate = useMemo(() => trackedUrl(`${origin}/freeai/create`, "marketing_page"), [origin]);

  useEffect(() => {
    trackEvent("visit", { page: "marketing" });
    setStats(loadStats());
  }, []);

  const refresh = () => setStats(loadStats());
  const onShare = (channel) => {
    trackEvent("share", { channel });
    refresh();
  };

  const waBroadcast = whatsAppShareUrl(locale).replace(
    encodeURIComponent(CREATE_URL),
    encodeURIComponent(trackedCreate)
  );

  return (
    <FreeAILayout>
      <section className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-sm mb-4">
          <Megaphone className="w-4 h-4" />
          {locale === "he" ? "מרכז שיווק ומכירות" : "Marketing & Sales Hub"}
        </div>
        <h1 className="text-3xl font-black text-white mb-2">
          {locale === "he" ? "תשלח. תשתף. תמכור ₪20." : "Share. Sell. ₪20."}
        </h1>
        <p className="text-white/50 text-sm" dir="ltr">{origin}/freeai</p>
      </section>

      {/* KPIs */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          {locale === "he" ? "יעדים — שבוע 1" : "Week 1 targets"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <KpiBar label={locale === "he" ? "ביקורים" : "Visits"} {...getProgress(stats, "visits")} />
          <KpiBar label={locale === "he" ? "שיתופים" : "Shares"} {...getProgress(stats, "shares")} />
          <KpiBar label={locale === "he" ? "הרשמות" : "Signups"} {...getProgress(stats, "signups")} />
          <KpiBar label={locale === "he" ? "עניין ב-Pro" : "Pro interest"} {...getProgress(stats, "proInterest")} />
        </div>
      </section>

      {/* One-click actions */}
      <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 mb-6">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          {locale === "he" ? "פעולות מיידיות" : "Quick actions"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <a href={waBroadcast} target="_blank" rel="noopener noreferrer" onClick={() => onShare("whatsapp")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500">
            <MessageCircle className="w-4 h-4" /> WhatsApp — {locale === "he" ? "שתף לקבוצות" : "Share to groups"}
          </a>
          <a href={twitterShareUrl(locale)} target="_blank" rel="noopener noreferrer" onClick={() => onShare("twitter")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-500">
            <Share2 className="w-4 h-4" /> Twitter/X
          </a>
          <a href={linkedInShareUrl()} target="_blank" rel="noopener noreferrer" onClick={() => onShare("linkedin")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-600">
            <Share2 className="w-4 h-4" /> LinkedIn
          </a>
          <a href={telegramShareUrl(locale)} target="_blank" rel="noopener noreferrer" onClick={() => onShare("telegram")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-500">
            <Send className="w-4 h-4" /> Telegram
          </a>
          <a href={emailShareUrl(locale)} onClick={() => onShare("email")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/15">
            <Mail className="w-4 h-4" /> Email
          </a>
          <Link to="/freeai/pricing" onClick={() => trackEvent("pro_interest")}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm">
            <Crown className="w-4 h-4" /> Pro ₪20 — {locale === "he" ? "דף מחירון" : "Pricing"}
          </Link>
        </div>
      </section>

      {/* Copy-paste posts */}
      <section className="mb-6 space-y-4">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Copy className="w-5 h-5 text-amber-400" />
          {locale === "he" ? "פוסטים מוכנים — העתק והדבק" : "Ready posts — copy & paste"}
        </h2>
        <CopyBlock label="Facebook / LinkedIn (עברית)" text={SOCIAL_POSTS.facebook_he.replace(CREATE_URL, trackedCreate)} onCopy={() => onShare("copy_facebook")} />
        <CopyBlock label="WhatsApp קבוצות (עברית)" text={SOCIAL_POSTS.whatsapp_group_he.replace(CREATE_URL, trackedCreate)} onCopy={() => onShare("copy_whatsapp")} />
        <CopyBlock label="Reddit r/sideproject (English)" text={SOCIAL_POSTS.reddit_sideproject_en.replace(CREATE_URL, trackedCreate)} onCopy={() => onShare("copy_reddit")} />
        <CopyBlock label={locale === "he" ? "הודעת שיתוף כללית" : "General share message"} text={shareMessage(locale).replace(CREATE_URL, trackedCreate)} onCopy={() => onShare("copy_general")} />
      </section>

      {/* Email templates */}
      <section className="mb-6 space-y-4">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-sky-400" />
          {locale === "he" ? "אימיילים לעסקים" : "Business emails"}
        </h2>
        {Object.entries(OUTREACH_EMAILS).slice(0, 3).map(([key, tpl]) => (
          <CopyBlock
            key={key}
            label={tpl.subject}
            text={`נושא: ${tpl.subject}\n\n${tpl.body.replaceAll(CREATE_URL, trackedCreate)}`}
            onCopy={() => onShare(`copy_email_${key}`)}
          />
        ))}
      </section>

      {/* Directories */}
      <section className="mb-6">
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-fuchsia-400" />
          {locale === "he" ? "הגשה ל-directories (חינם)" : "Submit to directories (free)"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {DIRECTORY_LINKS.map((d) => (
            <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
              onClick={() => onShare(`directory_${d.name}`)}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 hover:border-violet-500/40">
              {d.name}
              <ExternalLink className="w-3 h-3 text-white/30" />
            </a>
          ))}
        </div>
        <CopyBlock
          label="Product Hunt — Description (English)"
          text={OUTREACH_EMAILS.product_hunt_en.body.replace(CREATE_URL, trackedCreate)}
          onCopy={() => onShare("copy_product_hunt")}
        />
      </section>

      {/* Targets checklist */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-rose-400" />
          {locale === "he" ? "לאן לשלוח — רשימה" : "Where to reach out"}
        </h2>
        <div className="space-y-4">
          {OUTREACH_TARGETS.map((t) => (
            <div key={t.segment} className="text-sm">
              <p className="font-bold text-white">{locale === "he" ? t.segment : t.segmentEn}</p>
              <p className="text-white/40 text-xs mt-1">{t.examples.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>
    </FreeAILayout>
  );
}
