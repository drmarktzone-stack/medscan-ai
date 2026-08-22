import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUploader from "@/components/ImageUploader";
import ChipToggle from "@/components/doctorped/ChipToggle";
import ParentHelpCard from "@/components/parent/ParentHelpCard";
import { useI18n } from "@/lib/i18n";
import { usePatientSession, buildPatient } from "@/lib/doctorped/patientSession";
import { analyzeSkinPhoto, humanizeAnalysisError } from "@/lib/analysisPipeline";
import {
  PARENT_MILESTONE_CHIPS,
  PARENT_ADHD_CHIPS,
  PARENT_BURN_CHIPS,
  chipLabel,
  buildParentMilestones,
  buildParentVaccines,
  buildParentAdhd,
  buildParentTrauma,
  buildParentSkin,
} from "@/lib/medscan/doctorped/parentModules.js";

function opts(rows, lang) {
  return rows.map((r) => ({ id: r.id, label: chipLabel(r, lang) }));
}

export function ParentSkinPanel() {
  const { t, lang } = useI18n();
  const { session } = usePatientSession();
  const [files, setFiles] = useState([]);
  const [marks, setMarks] = useState([]);
  const [help, setHelp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      let photoReady = files.length > 0;
      let onDevice = false;
      if (photoReady) {
        const res = await analyzeSkinPhoto({
          files,
          clinicalContext: marks.join(", "),
          language: lang,
          pediatric: true,
        });
        onDevice = Boolean(res?.on_device);
      }
      const findings = ["rash"];
      if (marks.includes("fever")) findings.push("fever");
      if (marks.includes("petechiae")) findings.push("non-blanching rash");
      setHelp(buildParentSkin({
        patient: buildPatient(session),
        findings,
        features: { rash: true, petechiae: marks.includes("petechiae") },
        photoReady,
        onDevice,
        locale: lang,
      }));
    } catch (e) {
      setError(humanizeAnalysisError(e, t("analysis.error_fallback")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="clinic-card p-4 space-y-3">
      <p className="text-sm font-bold">{t("parent.tab_skin")}</p>
      <p className="text-xs text-slate-500">{t("parent.skin_hint")}</p>
      <ImageUploader files={files} onFilesChange={setFiles} label={t("parent.skin_upload")} />
      <ChipToggle
        options={[{ id: "fever", label: t("parent.skin_fever") }, { id: "petechiae", label: t("parent.skin_blanch") }]}
        selected={marks}
        onToggle={setMarks}
      />
      <Button className="w-full h-12 font-bold rounded-full bg-rose-500 hover:bg-rose-600" disabled={loading || (files.length === 0 && marks.length === 0)} onClick={run}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("parent.skin_run")}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ParentHelpCard help={help} />
    </section>
  );
}

export function ParentTraumaPanel() {
  const { t, lang } = useI18n();
  const { session } = usePatientSession();
  const [head, setHead] = useState(false);
  const [flags, setFlags] = useState([]);
  const [burns, setBurns] = useState([]);
  const [help, setHelp] = useState(null);

  function run() {
    const features = {
      vomiting: flags.includes("vomit"),
      loc: flags.includes("loc"),
      not_acting_normally: flags.includes("abnormal"),
      severe_headache: flags.includes("ha"),
      seizure: flags.includes("seizure"),
    };
    const findings = [];
    if (features.vomiting) findings.push("vomiting");
    if (features.seizure) findings.push("seizure");
    setHelp(buildParentTrauma({
      patient: buildPatient(session),
      head,
      features,
      findings,
      burnIds: burns,
      locale: lang,
    }));
  }

  return (
    <section className="clinic-card p-4 space-y-3">
      <p className="text-sm font-bold">{t("parent.tab_trauma")}</p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={head} onChange={(e) => setHead(e.target.checked)} />
        {t("parent.trauma_head")}
      </label>
      <ChipToggle
        options={[
          { id: "vomit", label: t("parent.trauma_vomit") },
          { id: "loc", label: t("dp.loc") },
          { id: "abnormal", label: t("parent.trauma_abnormal") },
          { id: "ha", label: t("parent.trauma_ha") },
          { id: "seizure", label: t("parent.trauma_seizure") },
        ]}
        selected={flags}
        onToggle={setFlags}
      />
      <p className="text-xs font-medium">{t("parent.trauma_burn")}</p>
      <ChipToggle options={opts(PARENT_BURN_CHIPS, lang)} selected={burns} onToggle={setBurns} />
      <Button className="w-full h-12 font-bold rounded-full bg-rose-500 hover:bg-rose-600" onClick={run}>{t("parent.run_trauma")}</Button>
      <ParentHelpCard help={help} />
    </section>
  );
}

export function ParentDevelopPanel() {
  const { t, lang } = useI18n();
  const { session } = usePatientSession();
  const patient = buildPatient(session);
  const [canDo, setCanDo] = useState([]);
  const [vax, setVax] = useState([]);
  const [adhd, setAdhd] = useState([]);
  const [settings, setSettings] = useState([]);
  const [senses, setSenses] = useState([]);
  const [mchat, setMchat] = useState("");
  const [msHelp, setMsHelp] = useState(null);
  const [vaxHelp, setVaxHelp] = useState(null);
  const [adhdHelp, setAdhdHelp] = useState(null);

  return (
    <div className="space-y-4">
      <section className="clinic-card p-4 space-y-3">
        <p className="text-sm font-bold">{t("dp.milestones")}</p>
        <p className="text-xs text-slate-500">{t("parent.ms_hint")}</p>
        <ChipToggle options={opts(PARENT_MILESTONE_CHIPS, lang)} selected={canDo} onToggle={setCanDo} />
        <Button className="w-full h-11 font-bold rounded-full" onClick={() => setMsHelp(buildParentMilestones({
          patient, can_do: canDo, ga_weeks: patient.ga_weeks, locale: lang,
        }))}>{t("parent.run_ms")}</Button>
        <ParentHelpCard help={msHelp} />
      </section>

      <section className="clinic-card p-4 space-y-3">
        <p className="text-sm font-bold">{t("home.growth_title")}</p>
        <ChipToggle
          options={[
            { id: "delayed", label: t("parent.vax_delayed") },
            { id: "allergy", label: t("parent.vax_allergy") },
            { id: "immune", label: t("parent.vax_immune") },
          ]}
          selected={vax}
          onToggle={setVax}
        />
        <Button className="w-full h-11 font-bold rounded-full" onClick={() => setVaxHelp(buildParentVaccines({
          patient,
          immunization: {
            delayed: vax.includes("delayed"),
            missed_doses: vax.includes("delayed"),
            anaphylaxis_to_component: vax.includes("allergy"),
            immunodeficiency: vax.includes("immune"),
          },
          locale: lang,
        }))}>{t("parent.run_vax")}</Button>
        <ParentHelpCard help={vaxHelp} />
      </section>

      <section className="clinic-card p-4 space-y-3">
        <p className="text-sm font-bold">{t("home.neurodev_title")}</p>
        <ChipToggle
          options={[
            { id: "home", label: t("parent.adhd_home") },
            { id: "school", label: t("parent.adhd_school") },
          ]}
          selected={settings}
          onToggle={setSettings}
        />
        <ChipToggle options={opts(PARENT_ADHD_CHIPS, lang)} selected={adhd} onToggle={setAdhd} />
        <ChipToggle
          options={[
            { id: "vision", label: t("dp.feat.vision_tested") },
            { id: "hearing", label: t("dp.feat.hearing_tested") },
          ]}
          selected={senses}
          onToggle={setSenses}
        />
        <Input type="number" placeholder={t("dp.mchat")} value={mchat} onChange={(e) => setMchat(e.target.value)} />
        <Button className="w-full h-11 font-bold rounded-full" onClick={() => setAdhdHelp(buildParentAdhd({
          patient,
          findings: adhd,
          settings,
          mchat_total: mchat === "" ? null : Number(mchat),
          vision_tested: senses.includes("vision"),
          hearing_tested: senses.includes("hearing"),
          locale: lang,
        }))}>{t("parent.run_adhd")}</Button>
        <ParentHelpCard help={adhdHelp} />
      </section>
    </div>
  );
}
