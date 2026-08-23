import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { PRICING_PLANS } from '@/bizboost/data/researchAnalysis';
import { CheckCircle2, Mail } from 'lucide-react';

export default function BizBoostPricing() {
  const [form, setForm] = useState({ name: '', email: '', business: '', plan: 'growth' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const leads = JSON.parse(localStorage.getItem('bizboost_leads') || '[]');
    leads.push({ ...form, at: new Date().toISOString() });
    localStorage.setItem('bizboost_leads', JSON.stringify(leads));
    setSubmitted(true);
  };

  return (
    <BizBoostLayout title="מחירים ומנויים" subtitle="14 יום ניסיון חינם · ביטול בכל עת · תשלום חודשי">
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-6 flex flex-col ${plan.popular ? 'border-violet-500 bg-violet-500/10 scale-105' : 'border-white/10 bg-white/5'}`}
          >
            {plan.popular && <div className="text-xs text-violet-300 mb-2 font-bold">⭐ הכי משתלם</div>}
            <h3 className="text-2xl font-bold">{plan.nameHe}</h3>
            <div className="text-4xl font-black my-3">
              {plan.currency}{plan.price}
              <span className="text-base font-normal text-white/60">/{plan.period}</span>
            </div>
            <p className="text-white/60 text-sm mb-4">{plan.limits}</p>
            <ul className="space-y-2 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to={`/bizboost/pricing?plan=${plan.id}`}
              onClick={() => setForm({ ...form, plan: plan.id })}
              className={`block text-center py-3 rounded-xl font-semibold ${plan.popular ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'border border-white/30 hover:bg-white/10'}`}
            >
              התחילו חינם
            </Link>
          </div>
        ))}
      </div>

      <section className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5" /> השאירו פרטים — נחזור תוך 24 שעות
        </h2>
        <p className="text-white/60 text-sm mb-6">טופס הדגמה — הלידים נשמרים locally. בפרודקשן: חיבור ל-CRM / Stripe.</p>
        {submitted ? (
          <div className="text-center py-8 text-emerald-400">
            ✓ תודה {form.name}! קיבלנו את הבקשה. LeadBot היה עונה לכם תוך 30 שניות 😉
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="שם מלא" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="אימייל" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" placeholder="שם העסק" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
            <select className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              {PRICING_PLANS.map((p) => <option key={p.id} value={p.id}>{p.nameHe} — {p.currency}{p.price}</option>)}
            </select>
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold">
              שלחו — 14 יום חינם
            </button>
          </form>
        )}
      </section>
    </BizBoostLayout>
  );
}
