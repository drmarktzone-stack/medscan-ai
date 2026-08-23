import React, { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import { useI18n } from "@/lib/i18n";
import { translateVisitNotes, saveVisitNote, loadVisitNotes } from "@/lib/medscan/journey/visitTranslator";

export default function VisitTranslatorPage() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadVisitNotes());

  function run() {
    const tr = translateVisitNotes(text, { t });
    setResult(tr);
    if (tr.ok) {
      saveVisitNote({ text, translation: tr });
      setHistory(loadVisitNotes());
    }
  }

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={MessageSquareText}
        tone="amber"
        badgeKey="life.badge"
        titleKey="life.visit_title"
        subtitleKey="life.visit_subtitle"
        noteKey="life.visit_note"
      />
      <main className="clinic-wrap pb-10 max-w-lg mx-auto space-y-4">
        <div className="clinic-panel space-y-3">
          <p className="text-sm font-extrabold">{t("life.visit_paste")}</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={t("life.visit_ph")} />
          <button type="button" className="clinic-cta w-full !h-11" onClick={run} disabled={!text.trim()}>
            {t("life.visit_run")}
          </button>
        </div>

        {result?.ok ? (
          <div className="clinic-panel space-y-4 !border-amber-200 !bg-amber-50/80">
            <p className="text-lg font-extrabold text-slate-900">{result.plain.headline}</p>
            {result.plain.actions.length ? (
              <div>
                <p className="clinic-label">{t("life.visit_do_tonight")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1 text-slate-800">
                  {result.plain.actions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            ) : null}
            {result.plain.warnings.length ? (
              <div>
                <p className="clinic-label text-red-800">{t("life.visit_worry")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1 text-red-900">
                  {result.plain.warnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </div>
            ) : null}
            <p className="text-[11px] text-slate-600">{result.disclaimer}</p>
          </div>
        ) : null}

        {history.length > 0 ? (
          <section className="space-y-2">
            <p className="clinic-h2 text-sm">{t("life.visit_history")}</p>
            {history.slice(0, 5).map((h) => (
              <button
                key={h.id}
                type="button"
                className="w-full text-start clinic-panel !p-3 text-xs text-slate-700"
                onClick={() => { setText(h.text); setResult(h.translation); }}
              >
                {h.text.slice(0, 120)}{h.text.length > 120 ? "…" : ""}
              </button>
            ))}
          </section>
        ) : null}
        <DisclaimerBanner />
      </main>
    </div>
  );
}
