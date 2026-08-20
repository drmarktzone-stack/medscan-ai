import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Loader2, AlertTriangle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { runDoctorPedAI, listToolboxModules } from "@/lib/medscan/doctorped/index.js";

const splitList = (s) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export default function DoctorPedWorkbench() {
  const { t, lang } = useI18n();
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState("years");
  const [weight, setWeight] = useState("");
  const [presentation, setPresentation] = useState("");
  const [findingsText, setFindingsText] = useState("");
  const [proceed, setProceed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const toolbox = useMemo(() => listToolboxModules(), []);

  const handleRun = () => {
    setLoading(true);
    setError(null);
    try {
      const patient = {
        [ageUnit === "days" ? "age_days" : ageUnit === "months" ? "age_months" : "age_years"]:
          Number(ageValue),
        weight_kg: weight ? Number(weight) : undefined,
      };
      setResult(runDoctorPedAI({
        persona: "clinician",
        integrationMode: "unified",
        patient,
        presentation,
        findings: splitList(findingsText),
        proceed,
        locale: lang,
        mode: "development",
      }));
    } catch (e) {
      setError(e.message || t("dp.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/60 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <BackButton />
          <Stethoscope className="w-5 h-5 text-cyan-700" />
          <h1 className="font-bold text-base flex-1">{t("dp.workbench_title")}</h1>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <p className="text-xs text-slate-600 leading-relaxed bg-cyan-50 border border-cyan-100 rounded-xl p-3">
          {t("dp.workbench_intro")}
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder={t("dp.age")} value={ageValue} onChange={(e) => setAgeValue(e.target.value)} />
            <select className="h-10 rounded-md border px-2 text-sm" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value)}>
              <option value="days">{t("dp.days")}</option>
              <option value="months">{t("dp.months")}</option>
              <option value="years">{t("dp.years")}</option>
            </select>
          </div>
          <Input type="number" placeholder={t("dp.weight")} value={weight} onChange={(e) => setWeight(e.target.value)} />
          <textarea className="w-full min-h-[72px] rounded-md border p-2 text-sm" placeholder={t("dp.presentation")} value={presentation} onChange={(e) => setPresentation(e.target.value)} />
          <textarea className="w-full min-h-[72px] rounded-md border p-2 text-sm" placeholder={t("dp.findings")} value={findingsText} onChange={(e) => setFindingsText(e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={proceed} onChange={(e) => setProceed(e.target.checked)} />
            {t("dp.proceed")}
          </label>
          <Button className="w-full" disabled={loading || !presentation.trim()} onClick={handleRun}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("dp.run")}
          </Button>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        {result?.awaiting_anamnesis && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold">{t("dp.anamnesis")}</p>
            {(result.anamnesis?.questions ?? []).map((q) => (
              <p key={q.id} className="text-xs text-amber-900">• {q.question_he}</p>
            ))}
          </div>
        )}

        {result?.triage && (
          <div className={`rounded-xl p-4 border ${result.emergency ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
            <p className="text-sm font-bold flex items-center gap-2">
              {result.emergency && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {t("dp.triage")}: {result.triage.urgency}
            </p>
            {(result.red_flags ?? []).slice(0, 6).map((f) => (
              <p key={f.flag_key} className="text-xs mt-1">{f.action_he || f.label_he}</p>
            ))}
          </div>
        )}

        {result?.differential?.length > 0 && (
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><ListChecks className="w-4 h-4" />{t("dp.ddx")}</p>
            {result.differential.slice(0, 8).map((d, i) => (
              <p key={d.direction_id || i} className="text-xs">
                {d.must_not_miss ? "⚠ " : ""}{d.diagnosis_direction_he}
              </p>
            ))}
          </div>
        )}

        {result?.referral_gate && Object.keys(result.referral_gate).length > 0 && (
          <div className="bg-white rounded-xl border p-4 space-y-1">
            <p className="text-sm font-semibold">{t("dp.referrals")}</p>
            {Object.entries(result.referral_gate).map(([k, v]) => (
              <p key={k} className="text-xs">{k}: {v.message_he}</p>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm font-semibold mb-2">{t("dp.toolbox")}</p>
          <div className="grid grid-cols-2 gap-2">
            {toolbox.map((m) => (
              <Link key={m.id} to={m.route} className="text-xs border rounded-lg p-2 hover:bg-slate-50">
                {m.title_he || t(m.i18n_key)}
              </Link>
            ))}
          </div>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
}
