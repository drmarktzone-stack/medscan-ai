import React, { useState } from 'react';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { ResultBlock, CopyButton, ToolFormField, inputClass, selectClass } from '@/bizboost/components/ToolUI';
import { generateLeadResponse } from '@/bizboost/lib/leadBotEngine';

export default function LeadBotTool() {
  const [form, setForm] = useState({
    businessName: '',
    industry: 'marketing',
    leadName: 'לקוח',
    leadMessage: '',
    budget: 'medium',
    urgency: 'this_week',
    responseTime: 'immediate',
    hasPhone: true,
    businessPhone: '972528885800',
    socialProof: '150+ לקוחות מרוצים',
    cta: 'לחצו לתיאום ייעוץ חינם',
  });
  const [result, setResult] = useState(null);

  const run = () => setResult(generateLeadResponse(form));

  return (
    <BizBoostLayout title="LeadBot" subtitle="מענה AI מיידי ללידים — WhatsApp, סינון, ורצף מעקב אוטומטי">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <ToolFormField label="שם העסק">
            <input className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="New Way Media" />
          </ToolFormField>
          <ToolFormField label="תעשייה">
            <select className={selectClass} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
              <option value="marketing">שיווק דיגיטלי</option>
              <option value="clinic">בריאות / מרפאה</option>
              <option value="ecommerce">מסחר אלקטרוני</option>
              <option value="services">שירותים מקצועיים</option>
            </select>
          </ToolFormField>
          <ToolFormField label="שם הליד">
            <input className={inputClass} value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} />
          </ToolFormField>
          <ToolFormField label="הודעת הליד">
            <textarea className={`${inputClass} min-h-[80px]`} value={form.leadMessage} onChange={(e) => setForm({ ...form, leadMessage: e.target.value })} placeholder="שלום, מעוניין בייעוץ שיווק..." />
          </ToolFormField>
          <ToolFormField label="טלפון WhatsApp של העסק">
            <input className={inputClass} value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} dir="ltr" />
          </ToolFormField>
          <div className="grid grid-cols-2 gap-3">
            <ToolFormField label="תקציב משוער">
              <select className={selectClass} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                <option value="low">נמוך</option>
                <option value="medium">בינוני</option>
                <option value="high">גבוה</option>
              </select>
            </ToolFormField>
            <ToolFormField label="דחיפות">
              <select className={selectClass} value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                <option value="low">לא דחוף</option>
                <option value="this_week">השבוע</option>
                <option value="urgent">דחוף</option>
              </select>
            </ToolFormField>
          </div>
          <button type="button" onClick={run} className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 font-semibold hover:opacity-90">
            צור מענה AI + רצף מעקב
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">ציון ליד</div>
                  <div className="text-3xl font-black">{result.score}/100</div>
                </div>
                <div className={`text-lg font-bold ${result.tier.color}`}>{result.tier.label}</div>
              </div>
              <ResultBlock title="מענה מיידי (WhatsApp)">
                <div className="flex justify-end mb-2"><CopyButton text={result.instantReply} /></div>
                {result.instantReply}
              </ResultBlock>
              <ResultBlock title="שאלות סינון">
                {result.qualificationQuestions.map((q, i) => <div key={q}>{i + 1}. {q}</div>)}
              </ResultBlock>
              {result.followUps.slice(1).map((fu) => (
                <ResultBlock key={fu.day} title={`מעקב: ${fu.label}`}>
                  <div className="flex justify-end mb-2"><CopyButton text={fu.message} /></div>
                  {fu.message}
                </ResultBlock>
              ))}
              <a href={result.whatsappUrl} target="_blank" rel="noreferrer" className="block text-center py-3 rounded-xl bg-green-600 font-semibold hover:bg-green-500">
                פתח ב-WhatsApp
              </a>
              {result.insights.length > 0 && (
                <ResultBlock title="תובנות AI">
                  {result.insights.map((i) => <div key={i}>💡 {i}</div>)}
                </ResultBlock>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/50">
              מלאו את הפרטים ולחצו "צור מענה" — LeadBot ייצור מענה מיידי + 4 הודעות מעקב
            </div>
          )}
        </div>
      </div>
    </BizBoostLayout>
  );
}
