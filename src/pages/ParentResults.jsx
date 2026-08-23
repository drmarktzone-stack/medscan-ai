import React, { useRef, useState } from "react";
import { FlaskConical, Loader2, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import AgeFields from "@/components/clinic/AgeFields";
import PrintDraftButton from "@/components/clinic/PrintDraftButton";
import JourneyTimeline, { JourneyBackLink } from "@/components/journey/JourneyTimeline";
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
  const canRun = filledRows.length > 0 && hasAgeParts({ ageYears: session.ageYears, ageMonths: session.ageMonths });

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
      <ClinicHeader title={t("journey.phase_during_title")} icon={FlaskConical} tone="parent" backTo="/parent" />
      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <JourneyBackLink />
        <section className="clinic-card p-3">
          <JourneyTimeline activePhaseId="during" compact />
        </section>

        <p className="text-sm text-slate-700 leading-relaxed clinic-card p-4">{t("journey.results_intro")}</p>

        <section className="clinic-card p-4 space-y-3">
          <p className="text-sm font-bold">{t("dp.patient_strip")}</p>
          <AgeFields
            ageYears={session.ageYears}
            ageMonths={session.ageMonths}
            showDays={false}
            onChange={patch}
          />
        </section>

        <section className="clinic-card p-4 space-y-3">
          <p className="text-sm font-bold">{t("journey.results_upload")}</p>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && scanFile(e.target.files[0])} />
          <Button variant="outline" className="w-full" disabled={scanning} onClick={() => fileRef.current?.click()}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {scanning ? t("parent.working") : t("journey.results_upload_btn")}
          </Button>
          {scanInfo?.error ? <p className="text-xs text-red-700">{scanInfo.error}</p> : null}
          {scanInfo?.note ? <p className="text-xs text-slate-600">{scanInfo.note}</p> : null}
        </section>

        <section className="clinic-card p-4 space-y-2">
          <p className="text-sm font-bold">{t("journey.results_manual")}</p>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-1">
              <input className="rounded-lg border px-2 py-2 text-xs" placeholder={t("journey.results_analyte")} value={row.analyte} onChange={(e) => setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, analyte: e.target.value } : r)))} />
              <input className="rounded-lg border px-2 py-2 text-xs" placeholder={t("journey.results_value")} value={row.value} onChange={(e) => setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))} />
              <input className="rounded-lg border px-2 py-2 text-xs" placeholder={t("journey.results_unit")} value={row.unit} onChange={(e) => setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)))} />
            </div>
          ))}
          <button type="button" className="text-xs text-sky-800 underline" onClick={() => setRows((r) => [...r, emptyRow()])}>
            {t("journey.results_add_row")}
          </button>
        </section>

        {error ? <div className="rounded-2xl bg-red-50 text-red-800 p-3 text-sm">{error}</div> : null}

        <Button
          className="w-full h-14 text-base font-bold rounded-full bg-sky-500 hover:bg-sky-600"
          disabled={loading || !canRun}
          onClick={interpret}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("journey.results_run")}
        </Button>

        {help ? (
          <div id="clinic-draft-print" className={`clinic-card p-5 space-y-3 border-2 ${help.urgency === "urgent" ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
            {help.urgency === "urgent" ? (
              <p className="text-sm font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t("journey.results_urgent_banner")}
              </p>
            ) : (
              <p className="text-xs font-bold text-amber-800">{t("dp.draft_badge")}</p>
            )}
            <p className="font-extrabold text-lg leading-snug">{help.picture}</p>
            {help.ask_doctor?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("parent.ask_title")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.ask_doctor.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            {help.recommend_do?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("parent.do_title")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.recommend_do.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            {help.next_steps?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("journey.results_next")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.next_steps.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-slate-600">{t("parent.not_doctor")}</p>
            <PrintDraftButton />
          </div>
        ) : null}

        <DisclaimerBanner />
      </div>
    </div>
  );
}
