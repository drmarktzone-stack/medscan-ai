import React, { useMemo, useState, useEffect } from 'react';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { prospectsWithContact } from '@/bizboost/data/researchAnalysis';
import { enterpriseWithEmail, enterpriseStats } from '@/bizboost/data/enterpriseProspects';
import {
  buildOutreachBatch,
  buildEnterpriseOutreachBatch,
  loadOutreachStatus,
  markOutreach,
} from '@/bizboost/lib/outreachEngine';
import { SELLER } from '@/bizboost/data/sellerIdentity';
import { MessageCircle, Mail, Phone, Copy, CheckCircle2, Send, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_UI = {
  pending: { label: 'ממתין', className: 'bg-slate-500/30' },
  contacted: { label: 'נשלח ✓', className: 'bg-blue-500/30 text-blue-200' },
  approved: { label: 'מאשר 🎉', className: 'bg-emerald-500/30 text-emerald-200' },
  declined: { label: 'סירב', className: 'bg-red-500/30' },
};

const MODES = [
  { id: 'enterprise', label: 'חברות גדולות — מייל', icon: Building2 },
  { id: 'smb', label: 'עסקים קטנים — WhatsApp', icon: MessageCircle },
];

export default function OutreachCenter() {
  const [statusMap, setStatusMap] = useState({});
  const [mode, setMode] = useState('enterprise');
  const [filter, setFilter] = useState('pending');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    setStatusMap(loadOutreachStatus());
  }, []);

  const entStats = enterpriseStats();
  const smbBatch = useMemo(() => buildOutreachBatch(prospectsWithContact()), []);
  const enterpriseBatch = useMemo(() => buildEnterpriseOutreachBatch(enterpriseWithEmail()), []);

  const batch = mode === 'enterprise' ? enterpriseBatch : smbBatch;

  const enriched = useMemo(
    () =>
      batch.map((m) => ({
        ...m,
        status: statusMap[m.prospectId]?.status || 'pending',
      })),
    [batch, statusMap],
  );

  const filtered = enriched.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return m.status === 'pending';
    if (filter === 'contacted') return m.status === 'contacted' || m.status === 'approved';
    if (filter === 'email') return m.hasEmail;
    if (filter === 'whatsapp') return m.hasWhatsApp;
    return true;
  });

  const stats = {
    total: enriched.length,
    pending: enriched.filter((m) => m.status === 'pending').length,
    contacted: enriched.filter((m) => m.status === 'contacted').length,
    approved: enriched.filter((m) => m.status === 'approved').length,
  };

  const setStatus = (id, status) => {
    setStatusMap(markOutreach(id, status));
  };

  const copyText = async (id, text) => {
    await navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isEnterprise = mode === 'enterprise';

  return (
    <BizBoostLayout
      title="מרכז מכירות"
      subtitle={
        isEnterprise
          ? `${entStats.withEmail} חברות גדולות · מייל מ-${SELLER.email} · לא Facebook`
          : `${SELLER.phoneDisplay} WhatsApp · ${stats.total} עסקים קטנים`
      }
    >
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 mb-6 text-sm">
        <strong>עדיפות: מייל לחברות גדולות.</strong> פייסבוק ורשתות חברתיות — רק אחרי שליחת המיילים.
        לחץ <strong>אימייל</strong> בכל כרטיס — נפתח Gmail/Outlook אצלך. אין שליחה אוטומטית מהענן.
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setFilter(id === 'enterprise' ? 'pending' : 'whatsapp');
            }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
              mode === id ? 'bg-violet-600' : 'bg-white/10 hover:bg-white/15',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="סה״כ" value={stats.total} />
        <Stat label="ממתין לשליחה" value={stats.pending} />
        <Stat label="נשלח" value={stats.contacted} />
        <Stat label="מאשרים" value={stats.approved} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'pending', label: 'ממתין לשליחה' },
          { id: 'all', label: 'הכל' },
          ...(isEnterprise
            ? [{ id: 'email', label: 'עם מייל' }]
            : [{ id: 'whatsapp', label: 'עם WhatsApp' }]),
          { id: 'contacted', label: 'נשלח' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              filter === f.id ? 'bg-violet-600' : 'bg-white/10 hover:bg-white/15',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((m, idx) => {
          const st = STATUS_UI[m.status] || STATUS_UI.pending;
          const previewText = isEnterprise ? m.emailBody : m.whatsappBody;
          const copyLabel = isEnterprise ? 'העתק מייל' : 'העתק הודעה';

          return (
            <div key={m.prospectId} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white/40 text-sm">#{idx + 1}</span>
                    <h3 className="font-bold text-lg">{m.name}</h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', st.className)}>{st.label}</span>
                    {m.employees && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
                        {m.employees} עובדים
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-violet-300 mt-1">
                    {m.tool} · {m.priceLabel} · עדיפות {m.priority}
                    {m.email && (
                      <span className="text-white/50 mr-2" dir="ltr">
                        · {m.email}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.mailtoUrl && (
                    <a
                      href={m.mailtoUrl}
                      onClick={() => setStatus(m.prospectId, 'contacted')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold"
                    >
                      <Mail className="w-4 h-4" /> שלח מייל
                    </a>
                  )}
                  {!isEnterprise && m.whatsappUrl && (
                    <a
                      href={m.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setStatus(m.prospectId, 'contacted')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {!isEnterprise && m.telUrl && !m.whatsappUrl && (
                    <a
                      href={m.telUrl}
                      onClick={() => setStatus(m.prospectId, 'contacted')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-sm"
                    >
                      <Phone className="w-4 h-4" /> חיוג
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copyText(m.prospectId, previewText)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedId === m.prospectId ? 'הועתק' : copyLabel}
                  </button>
                </div>
              </div>

              {isEnterprise && m.emailSubject && (
                <p className="text-xs text-white/50 mb-2" dir="ltr">
                  Subject: {m.emailSubject}
                </p>
              )}

              <pre className="text-xs text-white/70 whitespace-pre-wrap bg-black/20 rounded-xl p-3 mb-3 max-h-48 overflow-auto">
                {previewText}
              </pre>

              <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => setStatus(m.prospectId, 'contacted')} className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30">
                  <Send className="w-3 h-3 inline ml-1" /> סמן נשלח
                </button>
                <button type="button" onClick={() => setStatus(m.prospectId, 'approved')} className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 inline ml-1" /> מאשר / שילם
                </button>
                <button type="button" onClick={() => setStatus(m.prospectId, 'declined')} className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30">
                  סירב
                </button>
                <button type="button" onClick={() => setStatus(m.prospectId, 'pending')} className="px-2 py-1 rounded-lg bg-white/10">
                  אפס
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isEnterprise && (
        <p className="text-center text-white/40 text-sm mt-8">
          לחברות גדולות — עבור ללשונית &quot;חברות גדולות — מייל&quot; למעלה
        </p>
      )}
    </BizBoostLayout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
