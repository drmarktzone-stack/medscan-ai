import React, { useState } from "react";
import { School, Copy, Check } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import AgeFields from "@/components/clinic/AgeFields";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import { evaluateDaycareReturn, ganMessageForGanenet } from "@/lib/medscan/journey/daycareReturn";
import { loadEmergencyProfile } from "@/lib/medscan/journey/emergencyProfile";

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full text-start rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
        value ? "clinic-chip-on border-sky-300" : "bg-white/70 border-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

export default function DaycareReturnPage() {
  const { t } = useI18n();
  const { session, patch } = usePatientSession();
  const childName = loadEmergencyProfile().childName || session.patientName;

  const [feverC, setFeverC] = useState("");
  const [flags, setFlags] = useState({
    feverFree24h: false,
    vomiting: false,
    diarrhea: false,
    rash: false,
    rashSpreading: false,
    eyeDischarge: false,
    cough: false,
    lethargic: false,
    onAntibiotics: false,
    doctorCleared: false,
  });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  function evaluate() {
    const r = evaluateDaycareReturn({
      ageYears: session.ageYears,
      ageMonths: session.ageMonths,
      ageDays: session.ageDays,
      feverC: feverC ? Number(feverC) : undefined,
      abxDays: flags.onAntibiotics ? 2 : 0,
      ...flags,
    });
    setResult(r);
  }

  async function copyGanMsg() {
    if (!result) return;
    const msg = ganMessageForGanenet(result, childName, t);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  const verdictColor = result?.verdict === "stay_home"
    ? "border-red-300 bg-red-50"
    : result?.verdict === "likely_ok"
      ? "border-emerald-300 bg-emerald-50"
      : "border-amber-300 bg-amber-50";

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={School}
        tone="sky"
        badgeKey="life.badge"
        titleKey="gan.title"
        subtitleKey="gan.subtitle"
        noteKey="gan.note"
      />
      <main className="clinic-wrap pb-10 max-w-lg mx-auto space-y-4">
        <div className="clinic-panel space-y-3">
          <AgeFields session={session} onPatch={patch} />
          <label className="block">
            <span className="clinic-label">{t("gan.fever_now")}</span>
            <input
              type="number"
              step="0.1"
              className="h-10 w-full rounded-xl border px-3 text-sm"
              value={feverC}
              onChange={(e) => setFeverC(e.target.value)}
              placeholder="37.5"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["feverFree24h", "gan.flag_fever_free"],
              ["vomiting", "gan.flag_vomit"],
              ["diarrhea", "gan.flag_diarrhea"],
              ["rash", "gan.flag_rash"],
              ["rashSpreading", "gan.flag_rash_spread"],
              ["eyeDischarge", "gan.flag_eye"],
              ["cough", "gan.flag_cough"],
              ["lethargic", "gan.flag_lethargic"],
              ["onAntibiotics", "gan.flag_abx"],
              ["doctorCleared", "gan.flag_doctor_ok"],
            ].map(([key, labelKey]) => (
              <Toggle
                key={key}
                label={t(labelKey)}
                value={flags[key]}
                onChange={(v) => setFlags((f) => ({ ...f, [key]: v }))}
              />
            ))}
          </div>
          <button type="button" className="clinic-cta w-full !h-12" onClick={evaluate}>
            {t("gan.evaluate")}
          </button>
        </div>

        {result ? (
          <div className={`clinic-panel space-y-3 border-2 ${verdictColor}`}>
            <p className="text-lg font-extrabold">{t(result.verdictKey)}</p>
            <p className="text-sm text-slate-800">{t(result.ganNoteKey)}</p>
            {[...result.red, ...result.yellow].length ? (
              <ul className="list-disc pr-5 text-xs text-slate-700 space-y-0.5">
                {[...result.red, ...result.yellow].map((k) => <li key={k}>{t(k)}</li>)}
              </ul>
            ) : null}
            <p className="text-[11px] font-medium text-slate-600 border-t pt-2">{t("gan.message_for_gan")}</p>
            <p className="text-sm bg-white/80 rounded-xl p-3 border">{ganMessageForGanenet(result, childName, t)}</p>
            <button type="button" onClick={copyGanMsg} className="w-full rounded-xl border py-2.5 text-xs font-bold flex items-center justify-center gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {t("gan.copy_message")}
            </button>
            <p className="text-[10px] text-slate-500">{t("gan.disclaimer")}</p>
          </div>
        ) : null}
        <DisclaimerBanner />
      </main>
    </div>
  );
}
