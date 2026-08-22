import React, { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Stethoscope, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import PatientStrip from "@/components/doctorped/PatientStrip";
import EngineResultPanel from "@/components/doctorped/EngineResultPanel";
import PrintDraftButton from "@/components/clinic/PrintDraftButton";
import ChartExam from "@/components/clinic/chart/ChartExam";
import ChartIcdPicker from "@/components/clinic/chart/ChartIcdPicker";
import ChartReferrals from "@/components/clinic/chart/ChartReferrals";
import ChartSmartPanel from "@/components/clinic/chart/ChartSmartPanel";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import { runDoctorPedAI, listToolboxModules } from "@/lib/medscan/doctorped/index.js";
import { persistDoctorPedEncounter } from "@/lib/supabase/encounters.js";
import { mergeChartFindings } from "@/lib/clinic/physicalExam.js";
import { buildWorkupGuide } from "@/lib/medscan/doctorped/workupGuide.js";
import { toAgeDays } from "@/lib/medscan/deterministic/labNormalize.js";

const TABS = [
  { id: "details", key: "chart.tab_details" },
  { id: "vitals", key: "chart.tab_vitals" },
  { id: "history", key: "chart.tab_history" },
  { id: "exam", key: "chart.tab_exam" },
  { id: "icd", key: "chart.tab_icd" },
  { id: "orders", key: "chart.tab_orders" },
  { id: "smart", key: "chart.tab_smart" },
];

export default function DoctorPedWorkbench() {
  const { t, lang } = useI18n();
  const { session, patch, patchFeature, patchExam, patient, findings } = usePatientSession();
  const [tab, setTab] = useState("details");
  const [proceed, setProceed] = useState(false);
  const [answers, setAnswers] = useState({});
  const [pupils, setPupils] = useState("");
  const [rrFlag, setRrFlag] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveNote, setSaveNote] = useState(null);
  const toolbox = useMemo(() => listToolboxModules(), []);

  const merged = useMemo(() => mergeChartFindings({
    findings,
    exam: session.exam,
    vitals: { temp: session.temp, spo2: session.spo2, gcs: session.gcs },
  }), [findings, session.exam, session.temp, session.spo2, session.gcs]);

  const workup = useMemo(() => buildWorkupGuide({
    query: [session.presentation, ...merged.findings].join(" "),
    age_days: toAgeDays(patient),
    currentStepId: session.workupStepId,
    locale: lang,
  }), [session.presentation, merged.findings, patient, session.workupStepId, lang]);

  const run = (extra = {}) => {
    setLoading(true);
    setError(null);
    try {
      const features = {
        ...session.features,
        ...merged.features,
        vision_tested: session.features.vision_tested === true,
        hearing_tested: session.features.hearing_tested === true,
        gluten_containing_diet: session.features.gluten_containing_diet === true,
        gluten_free_diet: session.features.gluten_free_diet === true,
        growth_plotted: session.features.growth_plotted === true,
        ...extra.features,
      };
      const next = runDoctorPedAI({
        persona: "clinician",
        integrationMode: "unified",
        patient,
        presentation: session.presentation,
        findings: extra.findings ?? merged.findings,
        features,
        answers: { ...answers, ...extra.answers },
        vitals: {
          gcs: session.gcs !== "" ? Number(session.gcs) : undefined,
          pupils: pupils || undefined,
          rr_flag: rrFlag || session.rr || undefined,
          temp: session.temp !== "" ? Number(session.temp) : undefined,
          hr: session.hr !== "" ? Number(session.hr) : undefined,
          spo2: session.spo2 !== "" ? Number(session.spo2) : undefined,
        },
        gcs: session.gcs !== "" ? Number(session.gcs) : undefined,
        father_cm: session.fatherCm !== "" ? Number(session.fatherCm) : undefined,
        mother_cm: session.motherCm !== "" ? Number(session.motherCm) : undefined,
        proceed,
        locale: lang,
        mode: "development",
      });
      setResult(next);
      if (next?.ok && !next.awaiting_anamnesis) {
        persistDoctorPedEncounter({ result: next, locale: lang }).then((saved) => {
          setSaveNote(saved?.backend === "supabase" ? t("dp.save_ok") : t("dp.save_local"));
        }).catch(() => setSaveNote(t("dp.save_local")));
      }
      setTab("smart");
    } catch (e) {
      setError(e.message || t("dp.error"));
    } finally {
      setLoading(false);
    }
  };

  const urgencyStyle = result?.emergency
    ? "bg-red-600 text-white"
    : result?.triage?.urgency === "home_care"
      ? "bg-emerald-50 border border-emerald-200"
      : "bg-amber-50 border border-amber-200";

  const canRun = Boolean(session.presentation.trim() || session.findingsText.trim() || merged.findings.length);

  return (
    <div className="clinic-page">
      <ClinicHeader title={t("chart.title")} icon={Stethoscope} tone="clinic" />
      <div className="clinic-wrap py-5 grid lg:grid-cols-[220px_minmax(0,1fr)_300px] gap-4">
        <aside className="order-3 lg:order-none space-y-3 no-print">
          <div className="clinic-card p-3 lg:sticky lg:top-24">
            <p className="text-sm font-bold mb-2 px-1">{t("dp.toolbox")}</p>
            <div className="grid grid-cols-1 gap-1 max-h-[62vh] overflow-auto">
              {toolbox.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.route}
                  className={({ isActive }) =>
                    `text-xs rounded-xl px-3 py-2 font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-[0_8px_18px_-10px_hsl(var(--primary))]"
                        : "text-slate-700 hover:bg-white/60"
                    }`
                  }
                >
                  {m.title_he || t(m.i18n_key)}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed clinic-card p-4">{t("chart.intro")}</p>
          <div className="flex flex-wrap gap-1.5 no-print">
            {TABS.map((tabDef) => (
              <button
                key={tabDef.id}
                type="button"
                onClick={() => setTab(tabDef.id)}
                className={`clinic-chip text-xs ${tab === tabDef.id ? "clinic-chip-on" : "text-slate-700"}`}
              >
                {t(tabDef.key)}
              </button>
            ))}
          </div>

          {tab === "details" && (
            <div className="space-y-3">
              <div className="clinic-card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="clinic-label">{t("chart.patient_name")}</span>
                  <Input value={session.patientName} onChange={(e) => patch({ patientName: e.target.value })} />
                </label>
                <label className="block">
                  <span className="clinic-label">{t("chart.national_id")}</span>
                  <Input value={session.nationalId} onChange={(e) => patch({ nationalId: e.target.value })} />
                </label>
                <label className="block">
                  <span className="clinic-label">{t("chart.phone")}</span>
                  <Input value={session.phone} onChange={(e) => patch({ phone: e.target.value })} />
                </label>
              </div>
              <p className="clinic-label">{t("dp.patient_strip")}</p>
              <PatientStrip />
            </div>
          )}

          {tab === "vitals" && (
            <div className="clinic-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["temp", "chart.temp"],
                ["hr", "chart.hr"],
                ["rr", "chart.rr"],
                ["bpSys", "chart.bp_sys"],
                ["bpDia", "chart.bp_dia"],
                ["spo2", "chart.spo2"],
                ["pain", "chart.pain"],
                ["gcs", "dp.gcs"],
              ].map(([field, key]) => (
                <label key={field} className="block">
                  <span className="clinic-label">{t(key)}</span>
                  <Input type="number" value={session[field]} onChange={(e) => patch({ [field]: e.target.value })} />
                </label>
              ))}
              <label className="block">
                <span className="clinic-label">{t("dp.pupils")}</span>
                <Input value={pupils} onChange={(e) => setPupils(e.target.value)} />
              </label>
              <label className="block">
                <span className="clinic-label">{t("dp.rr")}</span>
                <Input value={rrFlag} onChange={(e) => setRrFlag(e.target.value)} />
              </label>
            </div>
          )}

          {tab === "history" && (
            <div className="clinic-card p-4 space-y-3">
              <label className="clinic-label">{t("dp.presentation")}</label>
              <textarea className="w-full min-h-[80px] rounded-xl border p-3 text-sm" placeholder={t("dp.presentation")} value={session.presentation} onChange={(e) => patch({ presentation: e.target.value })} />
              <label className="clinic-label">{t("dp.findings")}</label>
              <textarea className="w-full min-h-[72px] rounded-xl border p-3 text-sm" placeholder={t("dp.findings")} value={session.findingsText} onChange={(e) => patch({ findingsText: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder={t("dp.father")} value={session.fatherCm} onChange={(e) => patch({ fatherCm: e.target.value })} />
                <Input type="number" placeholder={t("dp.mother")} value={session.motherCm} onChange={(e) => patch({ motherCm: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2">
                {["vision_tested", "hearing_tested", "gluten_containing_diet", "growth_plotted"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`clinic-chip text-xs ${session.features[k] === true ? "clinic-chip-on" : "text-slate-700"}`}
                    onClick={() => patchFeature(k, session.features[k] !== true)}
                  >
                    {t(`dp.feat.${k}`)}
                  </button>
                ))}
                <button type="button" className={`clinic-chip text-xs ${proceed ? "clinic-chip-on" : "text-slate-700"}`} onClick={() => setProceed((v) => !v)}>
                  {t("dp.proceed")}
                </button>
              </div>
              {result?.awaiting_anamnesis && (
                <div className="space-y-3">
                  <p className="text-sm font-bold">{t("dp.anamnesis")}</p>
                  {(result.anamnesis?.questions ?? []).map((q) => (
                    <div key={q.id} className="space-y-1 clinic-card p-3">
                      <p className="text-sm text-amber-950">{q.question_he}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={answers[q.need] === true ? "default" : "outline"} onClick={() => setAnswers((a) => ({ ...a, [q.need]: true }))}>{t("dp.yes")}</Button>
                        <Button size="sm" variant={answers[q.need] === false ? "default" : "outline"} onClick={() => setAnswers((a) => ({ ...a, [q.need]: false }))}>{t("dp.no")}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "exam" && (
            <ChartExam exam={session.exam || {}} onSelect={patchExam} />
          )}

          {tab === "icd" && (
            <ChartIcdPicker diagnoses={session.diagnoses || []} onChange={(diagnoses) => patch({ diagnoses })} t={t} />
          )}

          {tab === "orders" && (
            <ChartReferrals
              orders={session.orders || { labs: [], imaging: [], consults: [] }}
              onChange={(orders) => patch({ orders })}
              engineTests={result?.recommended_tests}
              t={t}
            />
          )}

          {tab === "smart" && (
            <ChartSmartPanel
              result={result}
              workup={workup}
              onStep={(id) => patch({ workupStepId: id })}
              t={t}
            />
          )}

          <Button className="w-full h-12 font-bold rounded-2xl" disabled={loading} onClick={() => {
            if (!canRun) {
              setError(t("dp.need_presentation"));
              return;
            }
            run(result?.awaiting_anamnesis ? { answers } : {});
          }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("chart.run_smart")}
          </Button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {saveNote && <p className="text-[11px] text-slate-500">{saveNote}</p>}
        </div>

        <aside className="order-2 lg:order-none space-y-3 lg:sticky lg:top-24 self-start">
          <div className="clinic-card p-4 min-h-[12rem]">
            <p className="text-sm font-bold mb-3">{t("dp.triage")}</p>
            {!result && <p className="text-xs text-slate-500">{t("chart.smart_empty")}</p>}
            {result?.triage && (
              <div className={`rounded-2xl p-3 mb-3 ${urgencyStyle}`}>
                <p className="text-sm font-extrabold flex items-center gap-2">
                  {result.emergency && <AlertTriangle className="w-4 h-4" />}
                  {result.triage.urgency}
                </p>
              </div>
            )}
            {result?.triggered_modules?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {result.triggered_modules.map((id) => {
                  const mod = toolbox.find((m) => m.id === id);
                  return (
                    <Link key={id} to={mod?.route || "/doctorped"} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                      {mod?.title_he || t(mod?.i18n_key) || id}
                    </Link>
                  );
                })}
              </div>
            )}
            {result?.referral_gate && Object.keys(result.referral_gate).length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-sm font-semibold">{t("dp.referrals")}</p>
                {Object.entries(result.referral_gate).map(([k, v]) => (
                  <p key={k} className="text-xs">{k}: {v.allowed ? t("dp.refer_ok") : v.message_he}</p>
                ))}
                <Link to="/referrals" className="text-xs underline font-semibold">{t("home.referrals_title")}</Link>
              </div>
            )}
            {session.diagnoses?.length > 0 && (
              <div className="mb-3 space-y-1">
                <p className="text-xs font-bold">{t("chart.tab_icd")}</p>
                {session.diagnoses.map((d, i) => (
                  <p key={i} className="text-[11px]">{d.icd10 || d.icd9} · {d.label_he}</p>
                ))}
              </div>
            )}
            {result && (
              <div id="clinic-draft-print" className="space-y-4">
                <EngineResultPanel result={result} />
                {!result.awaiting_anamnesis ? <PrintDraftButton /> : null}
              </div>
            )}
          </div>
          <div className="no-print">
            <DisclaimerBanner />
          </div>
        </aside>
      </div>
    </div>
  );
}
