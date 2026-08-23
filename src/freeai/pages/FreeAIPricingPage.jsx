import React, { useState } from "react";
import { Link } from "react-router-dom";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import { PRICING, getPaymentUrl, joinWaitlist, activatePro, valueProposition } from "@/freeai/lib/subscription.js";
import {
  whatsAppShareUrl, twitterShareUrl, linkedInShareUrl, emailShareUrl,
  nativeShare, OUTREACH_TARGETS, CREATE_URL,
} from "@/freeai/lib/marketing.js";
import { useI18n } from "@/lib/i18n";
import {
  Check, Sparkles, Zap, Crown, Share2, Mail, MessageCircle,
  ExternalLink, Copy, CheckCircle2,
} from "lucide-react";

export default function FreeAIPricingPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const vp = valueProposition(locale);
  const [email, setEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const paymentUrl = getPaymentUrl();

  const handleSubscribe = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank", "noopener,noreferrer");
      if (email) activatePro({ email, paymentRef: "external" });
    } else if (email) {
      joinWaitlist(email);
      setWaitlistDone(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(CREATE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FreeAILayout>
      <section className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-sm mb-4">
          <Crown className="w-4 h-4" />
          {vp.savings}
        </div>
        <h1 className="text-4xl font-black mb-3">{vp.headline}</h1>
        <p className="text-white/60 max-w-lg mx-auto">{vp.sub}</p>
      </section>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
        {/* Free */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold text-white mb-1">{locale === "he" ? PRICING.free.labelHe : PRICING.free.labelEn}</h2>
          <div className="text-3xl font-black text-white mb-4">₪0</div>
          <ul className="space-y-2 mb-6">
            {(locale === "he" ? PRICING.free.featuresHe : PRICING.free.featuresEn).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Link
            to="/freeai/create"
            className="block w-full py-3 rounded-xl border border-white/20 text-white text-center font-bold hover:bg-white/5"
          >
            {locale === "he" ? "התחל חינם" : "Start free"}
          </Link>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border-2 border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
            {locale === "he" ? "הכי משתלם" : "Best value"}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-black text-white">₪20</span>
            <span className="text-white/50 text-sm">/{locale === "he" ? "חודש" : "month"}</span>
          </div>
          <p className="text-xs text-emerald-400 mb-4">
            {locale === "he" ? "במקום ₪160+ ל-ChatGPT+Midjourney+Canva" : "vs ₪160+ for ChatGPT+Midjourney+Canva"}
          </p>
          <ul className="space-y-2 mb-6">
            {(locale === "he" ? PRICING.pro.featuresHe : PRICING.pro.featuresEn).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                <Check className="w-4 h-4 text-violet-400 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={locale === "he" ? "your@email.com" : "your@email.com"}
            className="w-full rounded-xl bg-black/30 border border-white/10 text-white px-4 py-2 text-sm mb-3"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleSubscribe}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90"
          >
            {paymentUrl
              ? (locale === "he" ? "הירשם ל-Pro — ₪20/חודש" : "Subscribe Pro — ₪20/month")
              : (locale === "he" ? "הצטרף לרשימה — ₪20/חודש" : "Join waitlist — ₪20/month")}
          </button>
          {waitlistDone && (
            <p className="text-xs text-emerald-400 text-center mt-2 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {locale === "he" ? "נרשמת! ניצור קשר" : "Registered!"}
            </p>
          )}
        </div>
      </div>

      {/* Comparison table */}
      <section className="max-w-3xl mx-auto mb-12 rounded-2xl border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-4 py-3 font-bold text-white text-sm">
          {locale === "he" ? "השוואת מחירים" : "Price comparison"}
        </div>
        <div className="divide-y divide-white/5 text-sm">
          {[
            { name: "ChatGPT Plus", price: "₪70" },
            { name: "Midjourney", price: "₪40" },
            { name: "Canva Pro", price: "₪50" },
            { name: "Bolt.new Pro", price: "₪80" },
            { name: "———", price: "———" },
            { name: "FreeAI Hub Pro", price: "₪20", highlight: true },
          ].map((row) => (
            <div key={row.name} className={`flex justify-between px-4 py-2.5 ${row.highlight ? "bg-violet-500/10 font-bold text-violet-300" : "text-white/60"}`}>
              <span>{row.name}</span>
              <span>{row.price}{row.highlight ? `/${locale === "he" ? "חודש" : "mo"}` : ""}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Share & market */}
      <section className="max-w-3xl mx-auto mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-sky-400" />
          {locale === "he" ? "שתף עם חברים — עזור לנו לגrow" : "Share with friends"}
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <a href={whatsAppShareUrl(locale)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/30 text-green-300 text-sm font-medium hover:bg-green-600/40">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a href={twitterShareUrl(locale)} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-sky-600/30 text-sky-300 text-sm font-medium hover:bg-sky-600/40">
            Twitter/X
          </a>
          <a href={linkedInShareUrl()} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600/30 text-blue-300 text-sm font-medium hover:bg-blue-600/40">
            LinkedIn
          </a>
          <a href={emailShareUrl(locale)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15">
            <Mail className="w-4 h-4" /> Email
          </a>
          <button type="button" onClick={() => nativeShare(locale)}
            className="px-4 py-2 rounded-xl bg-violet-600/30 text-violet-300 text-sm hover:bg-violet-600/40">
            <Share2 className="w-4 h-4 inline" /> Share
          </button>
          <button type="button" onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 text-sm">
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? (locale === "he" ? "הועתק!" : "Copied!") : (locale === "he" ? "העתק לינק" : "Copy link")}
          </button>
        </div>
      </section>

      {/* Outreach guide for Dr */}
      <section className="max-w-3xl mx-auto rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h2 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          {locale === "he" ? "מדריך שיווק — לאן לפנות" : "Marketing guide — where to reach out"}
        </h2>
        <div className="space-y-3">
          {OUTREACH_TARGETS.map((t) => (
            <div key={t.segment} className="text-sm">
              <p className="font-bold text-white">{locale === "he" ? t.segment : t.segmentEn}</p>
              <p className="text-white/50 text-xs mt-0.5">{t.examples.join(" · ")}</p>
            </div>
          ))}
        </div>
        <Link
          to="/freeai/create"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm"
        >
          <Sparkles className="w-4 h-4" />
          {locale === "he" ? "נסו את המוצר עכשיו" : "Try the product now"}
        </Link>
      </section>
    </FreeAILayout>
  );
}
