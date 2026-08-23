import React from 'react';
import { Link } from 'react-router-dom';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { COMMON_PROBLEMS, PRICING_PLANS, prospectStats } from '@/bizboost/data/researchAnalysis';
import { PROSPECTS_CATALOG } from '@/bizboost/data/prospectsCatalog';
import { MessageCircle, PenLine, ScanSearch, CheckCircle2, ArrowLeft } from 'lucide-react';

const TOOL_ICONS = { leadbot: MessageCircle, contentflow: PenLine, convertscan: ScanSearch };
const TOOL_COLORS = {
  leadbot: 'from-green-500 to-emerald-600',
  contentflow: 'from-blue-500 to-cyan-600',
  convertscan: 'from-orange-500 to-red-600',
};

export default function BizBoostLanding() {
  const stats = prospectStats();
  const topProspects = PROSPECTS_CATALOG.filter((p) => p.priority === 'high').slice(0, 8);

  return (
    <BizBoostLayout>
      <section className="text-center py-12">
        <div className="inline-block px-4 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm mb-6">
          {stats.total} עסקים · {stats.withContact} עם פרטי קשר · 3 כלי AI
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
          כלי AI שפותרים
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            את 3 הבעיות הגדולות
          </span>
          <br />
          של עסקים קטנים
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
          בדקנו אתרים ועסקים בישראל. זיהינו 3 כאבים חוזרים — ובנינו כלי AI שפותרים אותם. נסו עכשיו, הירשמו למנוי.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/bizboost/leadbot" className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold hover:opacity-90">
            נסו LeadBot חינם
          </Link>
          <Link to="/bizboost/pricing" className="px-6 py-3 rounded-xl border border-white/30 hover:bg-white/10 font-semibold">
            ראו מחירים
          </Link>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">3 הבעיות שמצאנו בכל מקום</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {COMMON_PROBLEMS.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-violet-400 font-bold text-sm mb-2">בעיה #{p.rank}</div>
              <h3 className="text-xl font-bold mb-2">{p.titleHe}</h3>
              <p className="text-white/60 text-sm mb-4">{p.stat}</p>
              <ul className="space-y-2 mb-4">
                {p.painPoints.slice(0, 3).map((pt) => (
                  <li key={pt} className="text-sm text-white/70 flex gap-2">
                    <span className="text-red-400">✗</span> {pt}
                  </li>
                ))}
              </ul>
              <div className="text-sm text-emerald-400 font-medium">{p.aiSolution}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-6 text-center">3 כלי AI — מוכנים לשימוש</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { id: 'leadbot', name: 'LeadBot', desc: 'מענה AI מיידי ללידים ב-WhatsApp + מעקב אוטומטי', path: '/bizboost/leadbot' },
            { id: 'contentflow', name: 'ContentFlow', desc: 'תוכן שיווקי דו-לשוני לרשתות, מודעות ובלוג', path: '/bizboost/contentflow' },
            { id: 'convertscan', name: 'ConvertScan', desc: 'ביקורת AI לאתר — ציון המרה + המלצות מיידיות', path: '/bizboost/convertscan' },
          ].map((tool) => {
            const Icon = TOOL_ICONS[tool.id];
            return (
              <Link key={tool.id} to={tool.path} className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TOOL_COLORS[tool.id]} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
                <p className="text-white/60 text-sm mb-4">{tool.desc}</p>
                <span className="text-violet-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  נסו עכשיו <ArrowLeft className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">יעדים עם פוטנציאל גבוה</h2>
          <Link to="/bizboost/prospects" className="text-violet-400 text-sm hover:underline">
            כל {stats.total} היעדים →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topProspects.map((b) => (
            <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm">{b.name}</h3>
                  <a href={b.url} target="_blank" rel="noreferrer" className="text-violet-400 text-xs hover:underline">{b.url.replace('https://', '')}</a>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">{b.recommendedTool.split(' ')[0]}</span>
              </div>
              <p className="text-xs text-white/60 mt-2">{b.outreachAngle}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 text-center">
        <h2 className="text-2xl font-bold mb-6">חבילות מנוי</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-2xl border p-6 ${plan.popular ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
              {plan.popular && <div className="text-xs text-violet-300 mb-2">הכי פופולרי</div>}
              <h3 className="text-xl font-bold">{plan.nameHe}</h3>
              <div className="text-3xl font-black my-2">{plan.currency}{plan.price}<span className="text-sm font-normal text-white/60">/{plan.period}</span></div>
              <ul className="text-sm text-white/70 space-y-1 text-right">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 justify-end"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link to="/bizboost/pricing" className="inline-block mt-8 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-white/90">
          התחילו 14 יום חינם
        </Link>
      </section>
    </BizBoostLayout>
  );
}
