import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { SELLER } from '@/bizboost/data/sellerIdentity';
import { STANDALONE_SERVICES, PRICING_PLANS } from '@/bizboost/data/researchAnalysis';
import {
  socialPosts,
  whatsAppBroadcastUrl,
  twitterShareUrl,
  linkedInShareUrl,
  facebookShareUrl,
  telegramShareUrl,
  emailShareUrl,
  DIRECTORY_SUBMISSIONS,
  VALUE_STATS,
  BIZBOOST_HOME,
  pitchHe,
} from '@/bizboost/lib/marketing';
import {
  Megaphone, Copy, CheckCircle2, MessageCircle, Mail, Share2,
  ExternalLink, Zap, Crown, ArrowLeft, Sparkles,
} from 'lucide-react';

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/5">
        <span className="text-xs font-bold text-white/70">{label}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'הועתק!' : 'העתק'}
        </button>
      </div>
      <pre className="p-4 text-sm text-white/75 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">{text}</pre>
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function BizBoostMarketingPage() {
  const posts = socialPosts();
  const home = BIZBOOST_HOME();

  return (
    <BizBoostLayout>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 mb-14">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(16,185,129,0.35), transparent), radial-gradient(ellipse 60% 50% at 100% 50%, rgba(59,130,246,0.2), transparent), linear-gradient(165deg, #0c1222 0%, #111827 45%, #0f172a 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative px-6 py-16 md:py-24 text-center max-w-3xl mx-auto">
          <motion.div {...fade} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold mb-6 border border-emerald-500/30">
            <Megaphone className="w-3.5 h-3.5" /> ערכת שיווק · מוכן להעתקה ושליחה
          </motion.div>
          <motion.h1
            {...fade}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
            style={{ fontFamily: 'Heebo, sans-serif' }}
          >
            BizBoost AI
          </motion.h1>
          <motion.p
            {...fade}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="text-xl md:text-2xl text-white/90 font-medium mb-3"
          >
            הליד לא מחכה עד הבוקר.
          </motion.p>
          <motion.p
            {...fade}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="text-white/60 text-base md:text-lg mb-8 max-w-xl mx-auto"
          >
            3 כלי AI שסוגרים את הפער: מענה WhatsApp, תוכן דו-לשוני, ואתר שממיר.
          </motion.p>
          <motion.div
            {...fade}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link
              to="/bizboost/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
            >
              14 יום חינם
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <a
              href={whatsAppBroadcastUrl('he')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 font-semibold hover:bg-white/15"
            >
              <Share2 className="w-4 h-4" /> שתפו ב-WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
        {VALUE_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
          >
            <div className="text-2xl md:text-3xl font-black text-emerald-400">{s.value}</div>
            <div className="text-xs text-white/55 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* One-liner pitch */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> פיץ׳ חד — העתק ושלח
        </h2>
        <CopyBlock label="WhatsApp / סטטוס / הודעה קצרה" text={pitchHe()} />
      </section>

      {/* Product story */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6">סיפור המוצר בשלושה משפטים</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {STANDALONE_SERVICES.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i }}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-6"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">{s.nameHe}</h3>
              <p className="text-white/60 text-sm mt-1 mb-3">{s.taglineHe}</p>
              <p className="text-2xl font-black">
                {s.currency}{s.price}
                <span className="text-sm font-normal text-white/50">/{s.period}</span>
              </p>
              <Link to={s.path} className="inline-block mt-4 text-sm text-emerald-400 hover:underline">
                נסו דמו →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social posts kit — אחרי מיילים לחברות גדולות */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-sky-400" /> ערכת פוסטים — אחרי מיילים
        </h2>
        <p className="text-white/55 text-sm mb-4">
          <strong className="text-amber-300">קודם:</strong>{' '}
          <Link to="/bizboost/outreach" className="text-emerald-400 hover:underline">
            שלחו מייל לחברות גדולות
          </Link>
          . Facebook / LinkedIn — רק אחרי.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <CopyBlock label="LinkedIn (עדיפות)" text={posts.linkedin_he} />
          <CopyBlock label="אימייל B2B ארוך" text={`${posts.email_subject_he}\n\n${posts.email_body_he}`} />
          <CopyBlock label="WhatsApp Status" text={posts.whatsapp_status_he} />
          <CopyBlock label="Instagram caption" text={posts.instagram_he} />
          <CopyBlock label="X / Twitter (EN)" text={posts.twitter_en} />
          <CopyBlock label="Facebook — אחרון" text={posts.facebook_he} />
        </div>
      </section>

      {/* Share buttons */}
      <section className="mb-14 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5" /> שיתוף בלחיצה
        </h2>
        <div className="flex flex-wrap gap-2">
          <ShareBtn href={emailShareUrl()} icon={Mail} label="אימייל (קודם)" className="bg-violet-700 ring-2 ring-violet-400/50" />
          <ShareBtn href={linkedInShareUrl()} label="LinkedIn" className="bg-blue-600" />
          <ShareBtn href={whatsAppBroadcastUrl('he')} icon={MessageCircle} label="WhatsApp" className="bg-green-600" />
          <ShareBtn href={telegramShareUrl()} label="Telegram" className="bg-sky-600" />
          <ShareBtn href={twitterShareUrl()} label="X" className="bg-slate-700" />
          <ShareBtn href={facebookShareUrl()} label="Facebook (אחרון)" className="bg-blue-700 opacity-70" />
        </div>
        <p className="text-xs text-white/40 mt-4 break-all" dir="ltr">{home}</p>
      </section>

      {/* Pricing snapshot */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" /> מחירון לשיתוף
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PRICING_PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 ${p.popular ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
            >
              {p.popular && <div className="text-xs text-emerald-300 font-bold mb-1">הכי משתלם</div>}
              <div className="font-bold text-lg">{p.nameHe}</div>
              <div className="text-3xl font-black my-2">₪{p.price}<span className="text-sm font-normal text-white/50">/חודש</span></div>
              <div className="text-xs text-white/55">{p.tools.join(' + ')}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/50 mt-4">
          תשלום: Bit {SELLER.phoneDisplay} · העברה הפועלים 666 / {SELLER.bank.account} · {SELLER.email}
        </p>
        <Link to="/bizboost/pricing" className="inline-block mt-3 text-emerald-400 text-sm font-semibold hover:underline">
          דף מחירים מלא →
        </Link>
      </section>

      {/* Directories */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">הגשה לדירקטוריות AI</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DIRECTORY_SUBMISSIONS.map((d) => (
            <a
              key={d.name}
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
            >
              {d.name}
              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            </a>
          ))}
        </div>
      </section>

      <div className="text-center pb-8 space-y-4">
        <Link
          to="/bizboost/outreach"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90"
        >
          <Mail className="w-4 h-4" />
          מייל לחברות גדולות — 30 מוכנים
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <p className="text-white/40 text-sm">Facebook ורשתות — רק אחרי המיילים</p>
      </div>
    </BizBoostLayout>
  );
}

function ShareBtn({ href, label, icon: Icon, className }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${className}`}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {label}
    </a>
  );
}
