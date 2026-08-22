import React from "react";
import { AlertTriangle, GitBranch, HelpCircle, ListChecks, Route } from "lucide-react";
import { Button } from "@/components/ui/button";

function Block({ icon: Icon, title, children }) {
  if (!children) return null;
  return (
    <div className="clinic-card p-4 space-y-2">
      <p className="text-sm font-extrabold flex items-center gap-2">
        <Icon className="w-4 h-4" /> {title}
      </p>
      {children}
    </div>
  );
}

export default function ChartSmartPanel({ result, workup, onStep, t }) {
  if (!result && !workup) {
    return <p className="text-xs text-slate-500 leading-relaxed">{t("chart.smart_empty")}</p>;
  }
  const ddx = result?.hides_mg ? [] : (result?.differential ?? []);
  const flags = result?.red_flags ?? [];
  const questions = result?.anamnesis?.questions ?? [];
  const kb = result?.kbItems ?? [];
  const trees = result?.diagnostic_trees ?? [];
  const hard = (result?.engines_run ?? []).filter((e) => ["pain", "triads", "genetics", "metabolic", "neurodev"].includes(e.id));

  return (
    <div className="space-y-3">
      {result?.emergency && (
        <div className="bg-red-600 text-white rounded-2xl p-4">
          <p className="font-extrabold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t("dp.parent_ed")}</p>
        </div>
      )}
      <Block icon={AlertTriangle} title={t("dp.red_flags")}>
        {flags.length ? flags.map((f, i) => (
          <p key={i} className="text-xs">{f.label_he || f.i18n_key} {f.action_he ? `— ${f.action_he}` : ""}</p>
        )) : <p className="text-xs text-slate-500">{t("chart.none")}</p>}
      </Block>
      <Block icon={HelpCircle} title={t("chart.ask_next")}>
        {questions.length ? questions.map((q) => (
          <p key={q.id} className="text-xs">{q.question_he}</p>
        )) : <p className="text-xs text-slate-500">{result?.awaiting_anamnesis ? t("dp.anamnesis") : t("chart.history_complete")}</p>}
      </Block>
      <Block icon={ListChecks} title={t("dp.ddx")}>
        {ddx.length ? ddx.slice(0, 12).map((d, i) => (
          <p key={i} className="text-xs">
            {d.must_not_miss ? "⚠ " : ""}{d.diagnosis_direction_he || d.title_he || d.label_he || d.direction_id}
          </p>
        )) : <p className="text-xs text-slate-500">{t("dp.result_empty")}</p>}
      </Block>
      <Block icon={GitBranch} title={t("chart.triads")}>
        {kb.filter((k) => /triad|syndrome|kawasaki|hus|cushing|samter|charcot|reynolds/i.test(JSON.stringify(k))).length
          ? kb.map((k, i) => <p key={i} className="text-xs">{k.title_he || k.pattern_key}</p>)
          : hard.some((e) => e.id === "triads")
            ? <p className="text-xs">{t("chart.triads_ran")}</p>
            : <p className="text-xs text-slate-500">{t("chart.triads_none")}</p>}
      </Block>
      <Block icon={GitBranch} title={t("chart.hard_dx")}>
        {hard.length
          ? hard.map((e) => <p key={e.id} className="text-xs">{e.id}{e.matched_patterns?.length ? ` · ${e.matched_patterns.join(", ")}` : ""}</p>)
          : <p className="text-xs text-slate-500">{t("chart.hard_none")}</p>}
      </Block>
      <Block icon={Route} title={t("chart.workup")}>
        {workup?.ok ? (
          <div className="space-y-2">
            <p className="text-xs font-bold">{workup.title_he}</p>
            <p className="text-[11px] text-slate-500">
              {t("chart.workup_start")}: {workup.start_title_he}
              {workup.is_end ? ` · ${t("chart.workup_end")}` : ""}
            </p>
            <p className="text-xs font-semibold">{t("chart.workup_now")}: {workup.current_title_he}</p>
            {(workup.actions_he ?? []).map((a, i) => <p key={i} className="text-xs">• {a}</p>)}
            {(workup.red_flags_he ?? []).map((a, i) => <p key={`rf-${i}`} className="text-xs text-red-700">⚠ {a}</p>)}
            <div className="flex flex-wrap gap-2">
              {(workup.next_branches ?? []).map((b) => (
                <Button key={b.next_step_id} type="button" size="sm" variant="outline" onClick={() => onStep(b.next_step_id)}>
                  {b.condition_he}
                </Button>
              ))}
              {!workup.is_start && (
                <Button type="button" size="sm" variant="ghost" onClick={() => onStep(null)}>{t("chart.workup_restart")}</Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{workup?.message_he || t("chart.workup_none")}</p>
        )}
      </Block>
      {trees.length > 0 && (
        <Block icon={Route} title={t("chart.trees")}>
          {trees.map((tr) => (
            <div key={tr.pathway} className="space-y-1">
              <p className="text-xs font-bold">{tr.pathway}</p>
              {(tr.tiers ?? []).map((tier) => (
                <p key={tier.tier} className="text-[11px]">{tier.title_he}: {(tier.items ?? []).map((it) => (typeof it === "string" ? it : it.title_he || it.i18n_key)).join(" · ")}</p>
              ))}
            </div>
          ))}
        </Block>
      )}
    </div>
  );
}
