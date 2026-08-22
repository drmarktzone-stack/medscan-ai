import React, { useMemo, useState } from "react";
import { Heart, Loader2, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import PrintDraftButton from "@/components/clinic/PrintDraftButton";
import AccountSettings from "@/components/AccountSettings";
import AgeFields from "@/components/clinic/AgeFields";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import { parseAgeParts } from "@/lib/clinic/ageParts.js";
import {
  runDoctorPedAI,
  PARENT_COMPLAINTS,
  complaintLabel,
  tokensFromComplaintIds,
  needKey,
  classifyParentQuestion,
  applyYesNoAnswer,
  applyTextAnswer,
  isYesNoNeed,
  buildParentHelp,
  parentSafeResult,
} from "@/lib/medscan/doctorped/index.js";
import { persistDoctorPedEncounter } from "@/lib/supabase/encounters.js";
import { ParentSkinPanel, ParentTraumaPanel, ParentDevelopPanel } from "@/components/parent/ParentExtraTools";

function durationHours(n, unit) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return undefined;
  return unit === "hours" ? v : v * 24;
}

export default function ParentPortal() {
  const { t, lang } = useI18n();
  const { session, patch } = usePatientSession();

  const [complaintIds, setComplaintIds] = useState([]);
  const [durN, setDurN] = useState("");
  const [durUnit, setDurUnit] = useState("days");
  const [freeText, setFreeText] = useState("");
  const [question, setQuestion] = useState("");
  const [mchat, setMchat] = useState("");
  const [textDraft, setTextDraft] = useState("");

  const [findings, setFindings] = useState([]);
  const [features, setFeatures] = useState({});
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [help, setHelp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acked, setAcked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState("intake");
  const [tab, setTab] = useState("visit");

  const complaintTokens = useMemo(() => tokensFromComplaintIds(complaintIds), [complaintIds]);
  const hours = durationHours(durN, durUnit);
  const canStart = complaintIds.length > 0 || Boolean(freeText.trim()) || Boolean(question.trim());

  function toggleComplaint(id) {
    setComplaintIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function presentationText() {
    const labels = complaintIds.map((id) => complaintLabel(id, lang)).join(", ");
    const dur = hours != null
      ? ` ${t("parent.duration")}: ${durN} ${durUnit === "hours" ? t("parent.hours") : t("parent.days")}.`
      : "";
    const extra = freeText.trim() ? ` ${freeText.trim()}` : "";
    const q = question.trim() ? ` ${t("parent.question")}: ${question.trim()}` : "";
    return `${labels}${dur}${extra}${q}`.trim();
  }

  function persistChild() {
    patch({
      patientName: session.patientName,
      ageYears: session.ageYears,
      ageMonths: session.ageMonths,
      sex: session.sex,
      weight: session.weight,
      height: session.height,
      presentation: presentationText(),
      findingsText: complaintTokens.join(", "),
    });
  }

  function consult({ nextFindings, nextFeatures, nextAnswers }) {
    const f = nextFindings ?? findings;
    const feat = nextFeatures ?? features;
    const ans = nextAnswers ?? answers;
    const presentation = presentationText();
    if (!f.length && !presentation) {
      setError(t("parent.need_input"));
      return;
    }
    persistChild();
    setLoading(true);
    setError("");
    setAcked(false);
    try {
      const patient = {
        ...parseAgeParts({ ageYears: session.ageYears, ageMonths: session.ageMonths }),
        sex: session.sex || undefined,
        weight_kg: session.weight === "" ? undefined : Number(session.weight),
        height_cm: session.height === "" ? undefined : Number(session.height),
      };
      const raw = runDoctorPedAI({
        persona: "parent",
        integrationMode: "unified",
        locale: lang,
        mode: "development",
        patient,
        findings: f,
        presentation,
        features: feat,
        answers: ans,
        questionnaires: feat.mchat_total != null ? { mchat_total: feat.mchat_total } : {},
      });
      const built = buildParentHelp({
        result: raw,
        question,
        complaints_he: complaintIds.map((id) => complaintLabel(id, "he")),
        locale: lang,
      });
      const safe = parentSafeResult(raw, built);
      setResult(safe);
      setHelp(built);
      if (safe.awaiting_anamnesis) setPhase("questions");
      else {
        setPhase("plan");
        persistDoctorPedEncounter({ result: safe, locale: lang }).catch(() => {});
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function startVisit() {
    const feat = {};
    const ans = {};
    if (hours != null) {
      feat.duration_hours = hours;
      ans.duration = hours;
    }
    if (mchat !== "" && Number.isFinite(Number(mchat))) feat.mchat_total = Number(mchat);
    setFindings(complaintTokens);
    setFeatures(feat);
    setAnswers(ans);
    setTextDraft("");
    consult({ nextFindings: complaintTokens, nextFeatures: feat, nextAnswers: ans });
  }

  function answerYesNo(need, value) {
    const next = applyYesNoAnswer(need, value, { findings, features });
    const nextAnswers = { ...answers, [need]: value };
    setFindings(next.findings);
    setFeatures(next.features);
    setAnswers(nextAnswers);
    consult({ nextFindings: next.findings, nextFeatures: next.features, nextAnswers });
  }

  function answerText(need) {
    const note = textDraft.trim();
    if (!note) return;
    const next = applyTextAnswer(need, note, { findings, features });
    const nextAnswers = { ...answers, [need]: note };
    setFindings(next.findings);
    setFeatures(next.features);
    setAnswers(nextAnswers);
    setTextDraft("");
    consult({ nextFindings: next.findings, nextFeatures: next.features, nextAnswers });
  }

  function resetVisit() {
    setPhase("intake");
    setResult(null);
    setHelp(null);
    setFindings([]);
    setFeatures({});
    setAnswers({});
    setAcked(false);
    setError("");
  }

  const openQ = result?.awaiting_anamnesis ? result.anamnesis?.questions?.[0] : null;
  const openNeed = openQ ? needKey(openQ.need) : "";
  const emergency = Boolean(result?.emergency);
  const qMeta = classifyParentQuestion(question);

  return (
    <div className="clinic-page">
      <ClinicHeader
        title={t("dp.parent_title")}
        icon={Heart}
        tone="parent"
        backTo="/parent"
        extra={(
          <button type="button" onClick={() => setSettingsOpen(true)} className="text-slate-500">
            <Settings className="w-4 h-4" />
          </button>
        )}
      />
      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <p className="text-base text-slate-700 leading-relaxed clinic-card p-4">{t("dp.parent_intro")}</p>
        <div className="grid grid-cols-4 gap-1 clinic-card p-1">
          {[
            ["visit", "parent.tab_visit"],
            ["skin", "parent.tab_skin"],
            ["trauma", "parent.tab_trauma"],
            ["develop", "parent.tab_develop"],
          ].map(([id, key]) => (
            <button
              key={id}
              type="button"
              className={`clinic-chip text-[11px] py-2 ${tab === id ? "clinic-chip-on bg-rose-500" : "text-slate-700"}`}
              onClick={() => setTab(id)}
            >
              {t(key)}
            </button>
          ))}
        </div>
        {error ? <div className="rounded-2xl bg-red-50 text-red-800 p-3 text-sm">{error}</div> : null}

        {tab !== "visit" ? (
          <section className="clinic-card p-3">
            <AgeFields ageYears={session.ageYears} ageMonths={session.ageMonths} showDays={false} onChange={patch} hint={false} />
          </section>
        ) : null}

        {tab === "skin" ? <ParentSkinPanel /> : null}
        {tab === "trauma" ? <ParentTraumaPanel /> : null}
        {tab === "develop" ? <ParentDevelopPanel /> : null}

        {tab === "visit" && phase === "intake" ? (
          <>
            <section className="clinic-card p-4 space-y-3">
              <p className="text-sm font-bold">{t("dp.patient_strip")}</p>
              <Input value={session.patientName} onChange={(e) => patch({ patientName: e.target.value })} placeholder={t("parent.name")} />
              <AgeFields
                ageYears={session.ageYears}
                ageMonths={session.ageMonths}
                showDays={false}
                onChange={patch}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="clinic-label">{t("dp.weight")}</span>
                  <Input type="number" inputMode="decimal" value={session.weight} onChange={(e) => patch({ weight: e.target.value })} />
                </label>
                <label className="block">
                  <span className="clinic-label">{t("dp.height")}</span>
                  <Input type="number" inputMode="decimal" value={session.height} onChange={(e) => patch({ height: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="clinic-label">{t("dp.sex")}</span>
                <select className="h-10 w-full rounded-xl border px-2 text-sm bg-white/50" value={session.sex} onChange={(e) => patch({ sex: e.target.value })}>
                  <option value="">{t("dp.sex")}</option>
                  <option value="female">{t("dp.female")}</option>
                  <option value="male">{t("dp.male")}</option>
                </select>
              </label>
            </section>

            <section className="clinic-card p-4 space-y-3">
              <p className="text-sm font-bold">{t("dp.step_symptoms")}</p>
              <p className="text-xs text-slate-500">{t("parent.multi")}</p>
              <div className="flex flex-wrap gap-2">
                {PARENT_COMPLAINTS.map((c) => {
                  const on = complaintIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleComplaint(c.id)}
                      className={`clinic-chip ${on ? "clinic-chip-on bg-rose-500 shadow-[0_8px_20px_-10px_rgba(244,63,94,0.85)]" : "text-slate-700"}`}
                    >
                      {complaintLabel(c, lang)}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="clinic-label">{t("parent.duration")}</span>
                  <Input type="number" inputMode="numeric" value={durN} onChange={(e) => setDurN(e.target.value)} />
                </label>
                <label className="block">
                  <span className="clinic-label">{t("parent.duration")}</span>
                  <select className="h-10 w-full rounded-xl border px-2 text-sm bg-white/50" value={durUnit} onChange={(e) => setDurUnit(e.target.value)}>
                    <option value="hours">{t("parent.hours")}</option>
                    <option value="days">{t("parent.days")}</option>
                  </select>
                </label>
              </div>
              <textarea className="w-full min-h-[72px] rounded-xl border p-3 text-sm bg-white/50" value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder={t("parent.free")} />
              <textarea className="w-full min-h-[72px] rounded-xl border p-3 text-sm bg-white/50" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("parent.question")} />
              <Input type="number" placeholder={t("dp.mchat")} value={mchat} onChange={(e) => setMchat(e.target.value)} />
              <Button
                className="w-full h-14 text-base font-bold rounded-full bg-rose-500 hover:bg-rose-600 shadow-[0_10px_24px_-12px_rgba(244,63,94,0.9)]"
                disabled={loading || !canStart}
                onClick={startVisit}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("dp.parent_run")}
              </Button>
            </section>
          </>
        ) : null}

        {tab === "visit" && phase === "questions" && openQ ? (
          <section className="clinic-card p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("parent.next_q")}</p>
            <p className="text-lg font-black leading-snug text-slate-900">{openQ.question_he}</p>
            {isYesNoNeed(openNeed) ? (
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-12 font-bold rounded-full bg-rose-500 hover:bg-rose-600" disabled={loading} onClick={() => answerYesNo(openNeed, true)}>
                  {t("dp.yes")}
                </Button>
                <Button variant="outline" className="h-12 font-bold rounded-full" disabled={loading} onClick={() => answerYesNo(openNeed, false)}>
                  {t("dp.no")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder={t("parent.text_ph")} />
                <Button className="w-full h-12 font-bold rounded-full" disabled={loading || !textDraft.trim()} onClick={() => answerText(openNeed)}>
                  {t("parent.continue")}
                </Button>
              </div>
            )}
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-500" /> : null}
            <button type="button" className="text-xs underline text-slate-500" onClick={resetVisit}>
              {t("parent.back")}
            </button>
          </section>
        ) : null}

        {tab === "visit" && emergency ? (
          <div className="bg-red-600 text-white rounded-3xl p-6 space-y-3 shadow-lg">
            <p className="font-extrabold text-2xl flex items-center gap-2">
              <AlertTriangle className="w-7 h-7" /> {t("dp.parent_ed")}
            </p>
            <p className="text-base leading-relaxed">{help?.picture_he || result?.parent_plan_he}</p>
            {(help?.recommend_do_he || []).map((x) => (
              <p key={x} className="text-sm">{x}</p>
            ))}
            <p className="text-xs opacity-90">{t("parent.not_doctor")}</p>
            {!acked && (
              <Button className="w-full h-12 bg-white text-red-700 hover:bg-red-50 font-bold" onClick={() => setAcked(true)}>
                {t("dp.ack_emergency")}
              </Button>
            )}
          </div>
        ) : null}

        {tab === "visit" && phase === "plan" && result && help && !emergency ? (
          <div id="clinic-draft-print" className="clinic-card p-5 space-y-3 border-2 border-amber-200 bg-amber-50">
            <p className="text-xs font-bold text-amber-800">{t("dp.draft_badge")}</p>
            <p className="font-extrabold text-lg leading-snug">{help.picture_he}</p>
            {qMeta.intent !== "general" ? <p className="text-xs text-slate-600">{help.intent_he}</p> : null}
            {help.ask_doctor_he?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("parent.ask_title")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.ask_doctor_he.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            {help.recommend_do_he?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("parent.do_title")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.recommend_do_he.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            {help.referrals_he?.length ? (
              <div>
                <p className="text-xs font-black text-slate-500">{t("parent.ref_title")}</p>
                <ul className="list-disc pr-5 text-sm space-y-1">
                  {help.referrals_he.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-slate-600">{t("parent.not_doctor")}</p>
            <p className="text-xs text-slate-500 whitespace-pre-wrap">
              {`${t("dp.patient_strip")}: ${session.patientName || "—"}
${t("dp.age")}: ${session.ageYears || "0"} / ${session.ageMonths || "0"}
${t("dp.weight")}: ${session.weight || "—"}
${t("dp.height")}: ${session.height || "—"}
${t("parent.duration")}: ${durN || "—"} ${durUnit}
${t("parent.free")}: ${freeText || "—"}
${t("parent.question")}: ${question || "—"}`}
            </p>
            <PrintDraftButton />
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={resetVisit}>{t("parent.new")}</Button>
          </div>
        ) : null}

        <DisclaimerBanner />
      </div>
      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
