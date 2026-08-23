import React, { useMemo, useState } from 'react';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import {
  PROSPECTS_CATALOG,
  PROSPECT_CATEGORIES,
  prospectStats,
  prospectsWithContact,
} from '@/bizboost/data/researchAnalysis';
import { cn } from '@/lib/utils';
import { ExternalLink, Mail, Phone, MessageCircle, Filter } from 'lucide-react';

const STATUS_LABEL = {
  prospect: { label: 'פוטנציאל', className: 'bg-slate-500/30 text-slate-200' },
  contacted: { label: 'נשלח', className: 'bg-blue-500/30 text-blue-200' },
  approved: { label: '✓ מאשר', className: 'bg-emerald-500/30 text-emerald-200' },
  declined: { label: 'סירב', className: 'bg-red-500/30 text-red-200' },
};

const PRIORITY_LABEL = { high: '🔥 גבוה', medium: 'בינוני', low: 'נמוך' };

export default function ProspectsPage() {
  const stats = prospectStats();
  const [tool, setTool] = useState('all');
  const [contactOnly, setContactOnly] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...PROSPECTS_CATALOG];
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (tool !== 'all') list = list.filter((p) => p.recommendedTool.includes(tool));
    if (contactOnly) list = list.filter((p) => p.email || p.phone || p.whatsapp);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.industry.includes(q) ||
          p.url.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
    });
  }, [category, tool, contactOnly, search]);

  const approved = PROSPECTS_CATALOG.filter((p) => p.status === 'approved');

  return (
    <BizBoostLayout
      title="קטלוג יעדים"
      subtitle={`${stats.total} עסקים · ${stats.withContact} עם פרטי קשר · ${stats.approved} מאשרים`}
    >
      {approved.length > 0 ? (
        <section className="mb-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
          <h2 className="text-xl font-bold mb-4">מאשרים שמוכנים לקבל את השירות</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {approved.map((p) => (
              <ProspectCard key={p.id} prospect={p} highlight />
            ))}
          </div>
        </section>
      ) : (
            <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              אין מאשרים עדיין. יש {stats.total} יעדים ({stats.withContact} עם קשר מוכן לשליחה).
              יעדים מיוצרים דורשים מחקר טלפון/WhatsApp לפני outreach — התחילו מ-/bizboost/outreach.
            </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatBox label="סה״כ יעדים" value={stats.total} />
        <StatBox label="עם קשר" value={stats.withContact} />
        <StatBox label="LeadBot" value={stats.byTool.LeadBot} />
        <StatBox label="ContentFlow / Scan" value={stats.byTool.ContentFlow + stats.byTool.ConvertScan} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Filter className="w-4 h-4 text-white/50" />
        <input
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm min-w-[200px]"
          placeholder="חיפוש שם / תעשייה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">כל הקטגוריות</option>
          {stats.byCategory.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.labelHe} ({c.count})</option>
          ))}
        </select>
        <select
          className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          value={tool}
          onChange={(e) => setTool(e.target.value)}
        >
          <option value="all">כל הכלים</option>
          <option value="LeadBot">LeadBot</option>
          <option value="ContentFlow">ContentFlow</option>
          <option value="ConvertScan">ConvertScan</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={contactOnly} onChange={(e) => setContactOnly(e.target.checked)} />
          רק עם email/טלפון
        </label>
        <span className="text-white/50 text-sm mr-auto">{filtered.length} תוצאות</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <ProspectCard key={p.id} prospect={p} />
        ))}
      </div>
    </BizBoostLayout>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

function ProspectCard({ prospect: p, highlight }) {
  const st = STATUS_LABEL[p.status] || STATUS_LABEL.prospect;
  const cat = PROSPECT_CATEGORIES.find((c) => c.id === p.category);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-2',
        highlight ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/5',
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-bold">{p.name}</h3>
          <a href={p.url} target="_blank" rel="noreferrer" className="text-violet-400 text-xs hover:underline inline-flex items-center gap-1">
            {p.url.replace('https://', '')} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0', st.className)}>{st.label}</span>
      </div>
      <div className="text-xs text-white/60">{cat?.icon} {p.industry} · {PRIORITY_LABEL[p.priority]}</div>
      <div className="text-xs px-2 py-1 rounded-lg bg-violet-500/20 text-violet-200 w-fit">{p.recommendedTool}</div>
      <p className="text-sm text-white/70 flex-1">{p.outreachAngle}</p>
      {p.gaps?.length > 0 && (
        <div className="text-xs text-red-300/80">פערים: {p.gaps.join(' · ')}</div>
      )}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-xs">
        {p.email && (
          <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-white/70 hover:text-white">
            <Mail className="w-3 h-3" /> {p.email}
          </a>
        )}
        {p.phone && (
          <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-white/70 hover:text-white">
            <Phone className="w-3 h-3" /> {p.phone}
          </a>
        )}
        {p.whatsapp && (
          <a
            href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`שלום ${p.name}, ראינו את ${p.url} — BizBoost AI יכול לעזור ב-${p.recommendedTool}. דמו: `)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-green-400 hover:text-green-300"
          >
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export { prospectsWithContact };
