import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchIcd, toChartDiagnosis, manualIcdEntry } from "@/lib/clinic/icdCatalog.js";

export default function ChartIcdPicker({ diagnoses, onChange, t }) {
  const [q, setQ] = useState("");
  const [manual10, setManual10] = useState("");
  const [manual9, setManual9] = useState("");
  const [manualHe, setManualHe] = useState("");
  const hits = useMemo(() => searchIcd(q, { limit: 12 }), [q]);

  const add = (row) => {
    const next = toChartDiagnosis(row);
    if (!next) return;
    const key = `${next.icd10 || ""}|${next.icd9 || ""}`;
    if (diagnoses.some((d) => `${d.icd10 || ""}|${d.icd9 || ""}` === key)) return;
    onChange([...diagnoses, next]);
  };

  const addManual = () => {
    const made = manualIcdEntry({ icd10: manual10, icd9: manual9, label_he: manualHe });
    if (!made.ok) return;
    add(made.row);
    setManual10("");
    setManual9("");
    setManualHe("");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600 leading-relaxed">{t("chart.icd_note")}</p>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("chart.icd_search")} />
      <div className="max-h-48 overflow-auto space-y-1">
        {hits.map((row) => (
          <button
            key={`${row.icd10}-${row.icd9}`}
            type="button"
            onClick={() => add(row)}
            className="w-full text-right clinic-card px-3 py-2 hover:bg-white/70"
          >
            <p className="text-xs font-bold">{row.he}</p>
            <p className="text-[11px] text-slate-500">ICD-10 {row.icd10} · ICD-9 {row.icd9}</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input value={manual10} onChange={(e) => setManual10(e.target.value)} placeholder="ICD-10" />
        <Input value={manual9} onChange={(e) => setManual9(e.target.value)} placeholder="ICD-9" />
        <Input value={manualHe} onChange={(e) => setManualHe(e.target.value)} placeholder={t("chart.icd_label")} />
      </div>
      <Button type="button" variant="outline" className="w-full h-10" onClick={addManual}>{t("chart.icd_add_manual")}</Button>
      <div className="space-y-2">
        {diagnoses.map((d, i) => (
          <div key={`${d.icd10}-${d.icd9}-${i}`} className="clinic-card p-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold">{d.label_he}</p>
              <p className="text-[11px] text-slate-500">
                {d.icd10 ? `ICD-10 ${d.icd10}` : ""}{d.icd10 && d.icd9 ? " · " : ""}{d.icd9 ? `ICD-9 ${d.icd9}` : ""}
              </p>
            </div>
            <button type="button" className="text-xs text-red-700" onClick={() => onChange(diagnoses.filter((_, idx) => idx !== i))}>
              {t("chart.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
