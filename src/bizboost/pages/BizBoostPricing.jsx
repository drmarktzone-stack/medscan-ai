import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import {
  PRICING_PLANS,
  STANDALONE_SERVICES,
  PRICING_ADDONS,
  allPricingOptions,
} from '@/bizboost/data/researchAnalysis';
import { CheckCircle2, Mail, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BizBoostPricing() {
  const [tab, setTab] = useState('services');
  const [form, setForm] = useState({ name: '', email: '', business: '', plan: 'growth' });
  const [submitted, setSubmitted] = useState(false);
  const options = allPricingOptions();

  const handleSubmit = (e) => {
    e.preventDefault();
    const leads = JSON.parse(localStorage.getItem('bizboost_leads') || '[]');
    leads.push({ ...form, at: new Date().toISOString() });
    localStorage.setItem('bizboost_leads', JSON.stringify(leads));
    setSubmitted(true);
  };

  return (
    <BizBoostLayout title="מחירים" subtitle="מכירה לפי שירות או חבילה · 14 יום חינם · ביטול בכל עת">
      <div className="flex justify-center gap-2 mb-10">
        {[
          { id: 'services', label: 'לפי שירות' },
          { id: 'bundles', label: 'חבילות (חיסכון)' },
          { id: 'addons', label: 'תוספות' },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-medium transition-colors',
              tab === id ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/15',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'services' && (
        <section className="mb-12">
          <p className="text-center text-white/60 text-sm mb-6">כל כלי נרכש בנפרד — בחרו רק מה שצריך</p>
          <div className="grid md:grid-cols-3 gap-6">
            {STANDALONE_SERVICES.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', s.color)}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">{s.nameHe}</h3>
                <p className="text-white/60 text-sm mb-3">{s.taglineHe}</p>
                <div className="text-4xl font-black my-2">
                  {s.currency}{s.price}
                  <span className="text-base font-normal text-white/60">/{s.period}</span>
                </div>
                <p className="text-white/50 text-xs mb-4">{s.limits}</p>
                <ul className="space-y-2 flex-1 mb-4">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-violet-300/80 mb-4">מתאים ל: {s.idealFor}</p>
                <Link
                  to={s.path}
                  className="block text-center py-2.5 rounded-xl border border-white/20 text-sm hover:bg-white/10 mb-2"
                >
                  נסו דמו
                </Link>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plan: s.id })}
                  className={cn('w-full py-3 rounded-xl font-semibold bg-gradient-to-r text-white', s.color)}
                >
                  התחילו — {s.currency}{s.price}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-white/50 text-sm mt-6">
            LeadBot + ContentFlow + ConvertScan בנפרד = ₪1,099/חודש ·{' '}
            <button type="button" onClick={() => setTab('bundles')} className="text-violet-400 hover:underline">
              חבילת Pro ב-₪999 (חיסכון ₪100)
            </button>
          </p>
        </section>
      )}

      {tab === 'bundles' && (
        <section className="mb-12">
          <p className="text-center text-white/60 text-sm mb-6">חבילות משולבות — חיסכון לעומת רכישה נפרדת</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'rounded-2xl border p-6 flex flex-col',
                  plan.popular ? 'border-violet-500 bg-violet-500/10 md:scale-105' : 'border-white/10 bg-white/5',
                )}
              >
                {plan.popular && <div className="text-xs text-violet-300 mb-2 font-bold">⭐ הכי משתלם</div>}
                {plan.savings > 0 && (
                  <div className="text-xs text-emerald-400 mb-2">חיסכון ₪{plan.savings} לעומת standalone</div>
                )}
                <h3 className="text-2xl font-bold">חבילת {plan.nameHe}</h3>
                <div className="text-xs text-white/50 line-through">₪{plan.standaloneTotal} בנפרד</div>
                <div className="text-4xl font-black my-2">
                  {plan.currency}{plan.price}
                  <span className="text-base font-normal text-white/60">/{plan.period}</span>
                </div>
                <p className="text-white/60 text-sm mb-2">{plan.tools.join(' + ')}</p>
                <p className="text-white/50 text-xs mb-4">{plan.limits}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plan: plan.id })}
                  className={cn(
                    'block w-full text-center py-3 rounded-xl font-semibold',
                    plan.popular ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'border border-white/30 hover:bg-white/10',
                  )}
                >
                  התחילו חינם
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'addons' && (
        <section className="mb-12 max-w-2xl mx-auto">
          <p className="text-center text-white/60 text-sm mb-6">חריגות מהמכסה ושירותים חד-פעמיים</p>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-right p-4 font-medium">שירות</th>
                  <th className="text-left p-4 font-medium">מחיר</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_ADDONS.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4">
                      <div>{a.labelHe}</div>
                      {a.note && <div className="text-xs text-white/50">{a.note}</div>}
                    </td>
                    <td className="p-4 text-left font-mono whitespace-nowrap">
                      {a.range ? `₪${a.range}` : `₪${a.price} ${a.unit}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <strong className="text-white">המלצה לפי סוג לקוח:</strong>
            <ul className="mt-2 space-y-1">
              <li>· בעל מקצוע / רופא / נדל&quot;ן → LeadBot ₪299</li>
              <li>· סוכנות / CPA → Growth ₪599</li>
              <li>· SEO / בניית אתרים → Pro ₪999 (ConvertScan white-label)</li>
            </ul>
          </div>
        </section>
      )}

      <section className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5" /> השאירו פרטים — 14 יום חינם
        </h2>
        <p className="text-white/60 text-sm mb-6">בחרו שירות בודד או חבילה — נחזור תוך 24 שעות</p>
        {submitted ? (
          <div className="text-center py-8 text-emerald-400">
            ✓ תודה {form.name}! קיבלנו את הבקשה ל-{options.find((o) => o.id === form.plan)?.label ?? form.plan}.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="שם מלא" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="אימייל" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="שם העסק" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
            <select className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <optgroup label="שירותים בודדים">
                {options.filter((o) => o.type === 'standalone').map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </optgroup>
              <optgroup label="חבילות">
                {options.filter((o) => o.type === 'bundle').map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </optgroup>
            </select>
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold flex items-center justify-center gap-2">
              שלחו — 14 יום חינם
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}
      </section>
    </BizBoostLayout>
  );
}
