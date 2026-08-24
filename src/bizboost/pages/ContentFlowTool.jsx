import React, { useState } from 'react';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { ResultBlock, CopyButton, ToolFormField, inputClass, selectClass } from '@/bizboost/components/ToolUI';
import { generateContent } from '@/bizboost/lib/contentFlowEngine';

export default function ContentFlowTool() {
  const [form, setForm] = useState({
    businessName: '',
    industry: 'marketing',
    channel: 'instagram',
    language: 'both',
    topic: '',
    cta: 'לחצו לתיאום ייעוץ חינם',
    socialProofNumber: 150,
    tipText: 'ענו ללידים תוך 5 דקות',
  });
  const [result, setResult] = useState(null);

  const run = () => setResult(generateContent(form));

  return (
    <BizBoostLayout title="ContentFlow" subtitle="יצירת תוכן שיווקי בעברית ואנגלית — פוסטים, מודעות, בלוג ולוח שנה">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <ToolFormField label="שם העסק">
            <input className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="PinkLime" />
          </ToolFormField>
          <ToolFormField label="תעשייה">
            <select className={selectClass} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
              <option value="marketing">שיווק</option>
              <option value="clinic">בריאות</option>
              <option value="ecommerce">מסחר</option>
              <option value="services">שירותים</option>
            </select>
          </ToolFormField>
          <ToolFormField label="ערוץ">
            <select className={selectClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="google_ads">Google Ads</option>
              <option value="whatsapp_status">WhatsApp Status</option>
              <option value="blog">בלוג</option>
            </select>
          </ToolFormField>
          <ToolFormField label="שפה">
            <select className={selectClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="both">עברית + אנגלית</option>
              <option value="he">עברית בלבד</option>
              <option value="en">English only</option>
            </select>
          </ToolFormField>
          <ToolFormField label="נושא / כאב">
            <input className={inputClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="לידים שלא חוזרים" />
          </ToolFormField>
          <ToolFormField label="קריאה לפעולה (CTA)">
            <input className={inputClass} value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
          </ToolFormField>
          <button type="button" onClick={run} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 font-semibold hover:opacity-90">
            צור תוכן AI
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="text-sm text-white/60">זווית: {result.angle} · ערוץ: {result.channel}</div>
              {result.hebrew && (
                <ResultBlock title="פוסט בעברית">
                  <div className="flex justify-end mb-2"><CopyButton text={result.hebrew.post} /></div>
                  {result.hebrew.post}
                </ResultBlock>
              )}
              {result.english && (
                <ResultBlock title="Post in English">
                  <div className="flex justify-end mb-2"><CopyButton text={result.english.post} /></div>
                  {result.english.post}
                </ResultBlock>
              )}
              <ResultBlock title="כותרות למודעות">
                {result.adHeadlines.map((h) => (
                  <div key={h.he} className="mb-2 pb-2 border-b border-white/10">
                    <div>🇮🇱 {h.he}</div>
                    <div className="text-white/60">🇺🇸 {h.en}</div>
                  </div>
                ))}
              </ResultBlock>
              <ResultBlock title="מתווה בלוג">
                <div className="font-bold">{result.blogOutline.titleHe}</div>
                {result.blogOutline.sections.map((s) => <div key={s.he}>• {s.he}</div>)}
              </ResultBlock>
              <ResultBlock title="לוח שנה — 5 ימים">
                {result.calendar.map((d) => (
                  <div key={d.day} className="mb-1">{d.day}: {d.theme} ({d.channel})</div>
                ))}
              </ResultBlock>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/50">
              ContentFlow ייצור פוסטים, כותרות מודעות, מתווה בלוג ולוח שנה — בעברית ואנגלית
            </div>
          )}
        </div>
      </div>
    </BizBoostLayout>
  );
}
