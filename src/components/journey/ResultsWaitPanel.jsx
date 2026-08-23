import React, { useState } from "react";
import { Clock, Plus, Trash2, AlertTriangle, CheckCircle2, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import {
  RESULT_TEST_TYPES,
  loadResultsWait,
  addResultsWait,
  updateResultsWait,
  removeResultsWait,
  resultsWaitStats,
  waitWindow,
  effectiveStatus,
  inferTestType,
  testTypeMeta,
} from "@/lib/medscan/journey/resultsWaitStore";

const STATUS_STYLE = Object.freeze({
  waiting: "border-sky-200 bg-sky-50/80",
  overdue: "border-red-300 bg-red-50/90",
  received: "border-emerald-200 bg-emerald-50/80",
});

export default function ResultsWaitPanel({ compact = false }) {
  const { t } = useI18n();
  const [items, setItems] = useState(() => loadResultsWait());
  const [title, setTitle] = useState("");
  const [testType, setTestType] = useState("blood_routine");
  const [orderedAt, setOrderedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [labName, setLabName] = useState("");

  const stats = resultsWaitStats(items);

  function refresh() {
    setItems(loadResultsWait());
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const inferred = testType === "blood_routine" ? inferTestType(title) : testType;
    addResultsWait({
      title: title.trim(),
      testType: inferred,
      orderedAt,
      labName: labName.trim(),
    });
    refresh();
    setTitle("");
    setLabName("");
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["waiting", stats.waiting, "text-sky-800", "bg-sky-50 border-sky-200"],
              ["overdue", stats.overdue, "text-red-800", "bg-red-50 border-red-200"],
              ["received", stats.received, "text-emerald-800", "bg-emerald-50 border-emerald-200"],
            ].map(([key, count, color, surface]) => (
              <div key={key} className={`rounded-2xl border px-2 py-3 ${surface}`}>
                <p className={`text-2xl font-black leading-none ${color}`}>{count}</p>
                <p className="clinic-micro text-slate-600 mt-1">{t(`wait.stat_${key}`)}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAdd} className="clinic-panel space-y-2.5">
            <p className="text-sm font-extrabold text-slate-900">{t("wait.add_title")}</p>
            <p className="text-[11px] text-slate-600">{t("wait.add_desc")}</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("wait.title_ph")} />
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="clinic-label">{t("wait.type_label")}</span>
                <select
                  className="h-10 w-full rounded-xl border px-2 text-sm"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  {RESULT_TEST_TYPES.map((opt) => (
                    <option key={opt.id} value={opt.id}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="clinic-label">{t("wait.ordered_label")}</span>
                <Input type="date" value={orderedAt} onChange={(e) => setOrderedAt(e.target.value)} />
              </label>
            </div>
            <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder={t("wait.lab_ph")} />
            <button type="submit" className="clinic-cta !h-11 w-full !text-sm" disabled={!title.trim()}>
              <Plus className="w-4 h-4 inline me-1" />
              {t("wait.add_btn")}
            </button>
          </form>
        </>
      ) : null}

      {items.length === 0 ? (
        <div className="clinic-panel text-center py-6">
          <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">{t("wait.empty")}</p>
        </div>
      ) : (
        items.map((item) => {
          const status = effectiveStatus(item);
          const w = waitWindow(item);
          const meta = testTypeMeta(item.testType);
          return (
            <div key={item.id} className={`rounded-2xl border p-3.5 space-y-2 ${STATUS_STYLE[status]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {t(meta.labelKey)}
                  </p>
                  <p className="font-bold text-slate-900 break-words">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t("wait.ordered_on", { date: item.orderedAt })}
                    {item.labName ? ` · ${item.labName}` : ""}
                  </p>
                  <p className="text-xs mt-1 font-medium text-slate-700">
                    {t("wait.window", { min: meta.daysMin, max: meta.daysMax, elapsed: w.elapsed })}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-600 shrink-0"
                  onClick={() => { removeResultsWait(item.id); refresh(); }}
                  aria-label={t("chart.remove")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {status === "overdue" ? (
                <div className="flex items-start gap-2 rounded-xl bg-red-100/80 border border-red-200 px-3 py-2 text-xs text-red-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("wait.overdue_title")}</p>
                    <p className="mt-0.5">{t("wait.overdue_body")}</p>
                  </div>
                </div>
              ) : status === "waiting" && w.inWindow ? (
                <p className="text-[11px] text-sky-800">{t("wait.in_window")}</p>
              ) : null}
              <div className="flex gap-1.5 flex-wrap">
                {status !== "received" ? (
                  <button
                    type="button"
                    onClick={() => { updateResultsWait(item.id, { status: "received" }); refresh(); }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold clinic-chip-on"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("wait.mark_received")}
                  </button>
                ) : null}
                <a
                  href="tel:*2700"
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold bg-white/80 border border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  {t("wait.call_hmo")}
                </a>
              </div>
            </div>
          );
        })
      )}
      <p className="text-[10px] text-slate-500 leading-relaxed">{t("wait.disclaimer")}</p>
    </div>
  );
}
