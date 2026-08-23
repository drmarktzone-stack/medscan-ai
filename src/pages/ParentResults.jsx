import React, { useRef, useState } from "react";
import { FlaskConical, Loader2, Upload, AlertTriangle, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import AgeFields from "@/components/clinic/AgeFields";
import PrintDraftButton from "@/components/clinic/PrintDraftButton";
import JourneyTimeline, { JourneyBackLink } from "@/components/journey/JourneyTimeline";
import SectionCard from "@/components/journey/SectionCard";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import { parseAgeParts, hasAgeParts } from "@/lib/clinic/ageParts.js";
import { runLabInterpreter } from "@/lib/medscan/engines/labInterpreter";
import { buildParentLabHelp } from "@/lib/medscan/journey/parentLabHelp";
import { createVisionInvokeLLM, tryBase44Core } from "@/lib/medscan/llmAdapter";
import { runLabScan, finalizeScan, LAB_SCAN_SCHEMA } from "@/lib/labScanEngine";
import { downscaleImageFile } from "@/lib/imageOptimize";
import { pdfExtractText, isPdf } from "@/lib/pdfToImages";
import { RESULT_TYPES } from "@/lib/medscan/deterministic/analyteCatalog";

const scanInvoke = createVisionInvokeLLM({ purpose: "lab_scan_parent" });

const emptyRow = () => ({
  analyte: "", value: "", unit: "", ref_low: "", ref_high: "",
  result_type: RESULT_TYPES.NUMERIC,
});

export default function ParentResults() {
  const { t, lang } = useI18n();
  const { session, patch } = usePatientSession();
  const fileRef = useRef(null);

  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [scanInfo, setScanInfo] = useState(null);
  const [help, setHelp] = useState(null);

  const filledRows = rows.filter((r) => r.analyte.trim() && String(r.value).trim() !== "");
  const ageReady = hasAgeParts({ ageYears: session.ageYears, ageMonths: session.ageMonths });
  const canRun = filledRows.length > 0 && ageReady;

  function setRow(index, field, value) {
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  async function scanFile(file) {
    setScanning(true);
    setScanInfo(null);
    setError("");
    try {
      let file_url = null;
      const upload = tryBase44Core("UploadFile");
      if (upload) {
        const toUpload = isPdf(file) ? file : await downscaleImageFile(file);
        const up = await upload({ file: toUpload });
        file_url = up?.file_url || null;
      }
      let scan = null;
      if (file_url) {
        const extract = tryBase44Core("ExtractDataFromUploadedFile");
        if (extract) {
          const res = await extract({ file_url, json_schema: LAB_SCAN_SCHEMA });
          const raw = res?.output ?? res?.details ?? null;
          if (raw) scan = finalizeScan(raw);
        }
        if (!scan?.ok) {
          scan = await runLabScan({ fileUrls: [file_url], invokeLLM: scanInvoke });
        }
      }
      if (!scan?.ok && isPdf(file)) {
        const text = await pdfExtractText(file);
        if (text?.length > 40) scan = await runLabScan({ text, invokeLLM: scanInvoke });
      }
      if (!scan?.ok) {
        setScanInfo({ error: t("journey.results_scan_fail") });
        return;
      }
      const uiRows = (scan.rows || []).map((sr) => ({
        analyte: sr.matched_he || sr.analyte_raw || "",
        value: sr.value != null ? String(sr.value) : (sr.value_text || ""),
        unit: sr.unit || sr.expected_unit || "",
        ref_low: sr.ref_low != null ? String(sr.ref_low) : "",
        ref_high: sr.ref_high != null ? String(sr.ref_high) : "",
        result_type: RESULT_TYPES.NUMERIC,
      }));
      setRows(uiRows.length ? uiRows : [emptyRow()]);
      setScanInfo({ note: t("journey.results_scan_ok", { count: uiRows.length }) });
    } catch (e) {
      setScanInfo({ error: e?.message || t("journey.results_scan_fail") });
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function interpret() {
    if (!canRun) {
      setError(t("journey.results_need_input"));
      return;
    }
    setLoading(true);
    setError("");
    setHelp(null);
    try {
      const patient = {
        ...parseAgeParts({ ageYears: session.ageYears, ageMonths: session.ageMonths }),
        sex: session.sex || undefined,
        weight_kg: session.weight === "" ? undefined : Number(session.weight),
      };
      const labs = filledRows.map((r) => ({
        analyte: r.analyte,
        value: r.value,
        unit: r.unit,
        ref_low: r.ref_low === "" ? undefined : Number(r.ref_low),
        ref_high: r.ref_high === "" ? undefined : Number(r.ref_high),
        result_type: r.result_type,
      }));
      const result = await runLabInterpreter({ patient, labs, locale: lang });
      setHelp(buildParentLabHelp({ result, t }));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="clinic-page">
      <ClinicHeader
        title={t("journey.phase_during_title")}
        subtitle={t("journey.step_during")}
        icon={FlaskConical}
        tone="sky"
        backTo="/parent"
      />
      <div className="max-w-lg mx-auto px-4 sm:px-5 py-5 space-y-4">
        <JourneyBackLink />
        <div className="clinic-panel !p-3">
          <JourneyTimeline activePhaseId="during" compact />
        </div>

        <p className="clinic-sub clinic-panel">{t("journey.results_intro")}</p>

        <SectionCard step={1} titleKey="journey.results_step_child" descKey="journey.results_step_child_desc">
          <AgeFields
            ageYears={session.ageYears}
            ageMonths={session.ageMonths}
            showDays={false}
            onChange={patch}
          />
        </SectionCard>

        <SectionCard step={2} titleKey="journey.results_step_upload" descKey="journey.results_step_upload_desc">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && scanFile(e.target.files[0])}
          />
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-bold"
            disabled={scanning}
            onClick={() => fileRef.current?.click()}
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {scanning ? t("parent.working") : t("journey.results_upload_btn")}
          </Button>
          {scanInfo?.error ? (
            <p className="text-xs text-red-700 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {scanInfo.error}
            </p>
          ) : null}
          {scanInfo?.note ? (
            <p className="text-xs text-emerald-800 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {scanInfo.note}
            </p>
          ) : null}

          <div className="pt-2 space-y-2 border-t border-white/60">
            <p className="clinic-label !mb-0">{t("journey.results_manual")}</p>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  className="flex-[2] min-w-0 rounded-lg border px-2 py-2 text-xs"
                  placeholder={t("journey.results_analyte")}
                  value={row.analyte}
                  onChange={(e) => setRow(i, "analyte", e.target.value)}
                  aria-label={t("journey.results_analyte")}
                />
                <input
                  className="flex-1 min-w-0 rounded-lg border px-2 py-2 text-xs"
                  placeholder={t("journey.results_value")}
                  value={row.value}
                  onChange={(e) => setRow(i, "value", e.target.value)}
                  aria-label={t("journey.results_value")}
                />
                <input
                  className="flex-1 min-w-0 rounded-lg border px-2 py-2 text-xs"
                  placeholder={t("journey.results_unit")}
                  value={row.unit}
                  onChange={(e) => setRow(i, "unit", e.target.value)}
                  aria-label={t("journey.results_unit")}
                />
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600 shrink-0"
                    onClick={() => setRows((cur) => cur.filter((_, idx) => idx !== i))}
                    aria-label={t("chart.remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-800"
              onClick={() => setRows((r) => [...r, emptyRow()])}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("journey.results_add_row")}
            </button>
          </div>
        </SectionCard>

        <SectionCard step={3} titleKey="journey.results_step_explain" descKey="journey.results_step_explain_desc">
          {error ? <div className="rounded-xl bg-red-50 text-red-800 p-3 text-sm">{error}</div> : null}
          {!canRun ? (
            <p className="text-[11px] text-slate-500">
              {!ageReady ? t("parent.need_age") : t("journey.results_need_input")}
            </p>
          ) : null}
          <button type="button" className="clinic-cta" disabled={loading || !canRun} onClick={interpret}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              t("journey.results_run")
            )}
          </button>
        </SectionCard>

        {help ? (
          <div
            id="clinic-draft-print"
            className={`clinic-panel space-y-3 !border-2 ${
              help.urgency === "urgent" ? "!border-red-300 !bg-red-50/90" : "!border-amber-200 !bg-amber-50/90"
            }`}
          >
            {help.urgency === "urgent" ? (
              <p className="text-sm font-extrabold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t("journey.results_urgent_banner")}
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                {t("dp.draft_badge")}
              </p>
            )}
            <p className="font-extrabold text-lg leading-snug text-slate-900">{help.picture}</p>
            {[
              ["parent.ask_title", help.ask_doctor],
              ["parent.do_title", help.recommend_do],
              ["journey.results_next", help.next_steps],
            ].map(([labelKey, list]) =>
              list?.length ? (
                <div key={labelKey}>
                  <p className="clinic-label">{t(labelKey)}</p>
                  <ul className="list-disc pe-0 ps-5 text-sm space-y-1 text-slate-700">
                    {list.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
              ) : null,
            )}
            <p className="text-[11px] text-slate-600">{t("parent.not_doctor")}</p>
            <PrintDraftButton />
          </div>
        ) : null}

        <DisclaimerBanner />
      </div>
    </div>
  );
}
