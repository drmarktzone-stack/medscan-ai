import React, { useState } from 'react';
import BizBoostLayout from '@/bizboost/components/BizBoostLayout';
import { ResultBlock, ScoreRing, ToolFormField, inputClass } from '@/bizboost/components/ToolUI';
import { auditWebsite, fetchPageHtml } from '@/bizboost/lib/convertScanEngine';
import { TARGET_BUSINESSES } from '@/bizboost/data/researchAnalysis';

export default function ConvertScanTool() {
  const [url, setUrl] = useState('');
  const [html, setHtml] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchNote, setFetchNote] = useState('');

  const runAudit = async (htmlOverride) => {
    setLoading(true);
    setFetchNote('');
    let pageHtml = htmlOverride || html;
    if (!pageHtml && url) {
      const fetched = await fetchPageHtml(url);
      if (fetched) {
        pageHtml = fetched;
        setHtml(fetched);
      } else {
        setFetchNote('לא הצלחנו לטעון את האתר (CORS). הדביקו HTML ידנית או השתמשו בדוגמה.');
      }
    }
    const audit = auditWebsite({ url, html: pageHtml, businessName });
    setResult(audit.error ? null : audit);
    if (audit.error) setFetchNote(audit.error);
    setLoading(false);
  };

  const loadSample = async (sample) => {
    setUrl(sample.url);
    setBusinessName(sample.name);
    setLoading(true);
    const fetched = await fetchPageHtml(sample.url);
    if (fetched) {
      setHtml(fetched);
      setResult(auditWebsite({ url: sample.url, html: fetched, businessName: sample.name }));
      setFetchNote('');
    } else {
      setFetchNote(`לא ניתן לטעון ${sample.url} מהדפדפן. הדביקו View Source ידנית.`);
    }
    setLoading(false);
  };

  return (
    <BizBoostLayout title="ConvertScan" subtitle="ביקורת AI לאתר — ציון המרה, Quick Wins והמלצות מיידיות">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <ToolFormField label="כתובת אתר">
            <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://nwmedia.co.il" dir="ltr" />
          </ToolFormField>
          <ToolFormField label="שם העסק (אופציונלי)">
            <input className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </ToolFormField>
          <ToolFormField label="HTML של דף הבית (אם הטעינה נכשלת)">
            <textarea className={`${inputClass} min-h-[100px] font-mono text-xs`} value={html} onChange={(e) => setHtml(e.target.value)} placeholder="<html>..." dir="ltr" />
          </ToolFormField>
          {fetchNote && <p className="text-amber-400 text-sm">{fetchNote}</p>}
          <button type="button" onClick={() => runAudit()} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 font-semibold hover:opacity-90 disabled:opacity-50">
            {loading ? 'סורק...' : 'הרץ ביקורת AI'}
          </button>
          <div>
            <p className="text-sm text-white/60 mb-2">דוגמאות מהמחקר:</p>
            <div className="flex flex-wrap gap-2">
              {TARGET_BUSINESSES.slice(0, 3).map((b) => (
                <button key={b.name} type="button" onClick={() => loadSample(b)} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-around">
                <ScoreRing score={result.score} grade={result.gradeLabel} />
                <div className="text-right">
                  <div className="font-bold text-lg">{result.businessName}</div>
                  <div className="text-white/60 text-sm">{result.url}</div>
                  <div className="text-emerald-400 text-sm mt-2">פוטנציאל שיפור: {result.estimatedLift}</div>
                </div>
              </div>
              {result.quickWins.length > 0 && (
                <ResultBlock title="⚡ Quick Wins — 3 דברים לתקן היום">
                  {result.quickWins.map((r) => (
                    <div key={r.checkId} className="mb-3 pb-3 border-b border-white/10 last:border-0">
                      <div className="font-medium">{r.textHe}</div>
                      <div className="text-emerald-400 text-xs">{r.impact}</div>
                    </div>
                  ))}
                </ResultBlock>
              )}
              <ResultBlock title="כל הבדיקות">
                {result.checks.map((c) => (
                  <div key={c.id} className="flex justify-between py-1">
                    <span>{c.labelHe}</span>
                    <span>{c.passed === null ? '—' : c.passed ? '✅' : '❌'}</span>
                  </div>
                ))}
              </ResultBlock>
              <ResultBlock title="המלצות מלאות">
                {result.recommendations.map((r) => (
                  <div key={r.checkId} className="mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.priority === 'critical' ? 'bg-red-500/30' : 'bg-amber-500/20'}`}>{r.priority}</span>
                    <div className="mt-1">{r.textHe}</div>
                  </div>
                ))}
              </ResultBlock>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center text-white/50">
              הזינו URL או הדביקו HTML — ConvertScan יבדוק WhatsApp, CTA, עברית, מובייל, Schema ועוד
            </div>
          )}
        </div>
      </div>
    </BizBoostLayout>
  );
}
