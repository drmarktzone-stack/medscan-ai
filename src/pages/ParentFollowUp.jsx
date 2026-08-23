import React, { useState } from "react";
import { ClipboardCheck, Plus, Trash2, ChevronDown, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import JourneyTimeline, { JourneyBackLink } from "@/components/journey/JourneyTimeline";
import SectionCard from "@/components/journey/SectionCard";
import { useI18n } from "@/lib/i18n";
import {
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUS,
  loadFollowUps,
  addFollowUp,
  updateFollowUp,
  removeFollowUp,
  followUpStats,
} from "@/lib/medscan/journey/followUpStore";
import { MEDICAL_HEALTH_TIPS } from "@/lib/medscan/journey/medicalHealthTips";

const STATUS_STYLE = Object.freeze({
  pending: "border-amber-200 bg-amber-50/70",
  done: "border-emerald-200 bg-emerald-50/70",
  stuck: "border-red-200 bg-red-50/70",
});

export default function ParentFollowUp() {
  const { t } = useI18n();
  const [items, setItems] = useState(() => loadFollowUps());
  const [title, setTitle] = useState("");
  const [type, setType] = useState("results");
  const [dueDate, setDueDate] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);

  const stats = followUpStats(items);

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    addFollowUp({ title: title.trim(), type, dueDate });
    setItems(loadFollowUps());
    setTitle("");
    setDueDate("");
  }

  return (
    <div className="clinic-page">
      <ClinicHeader
        title={t("journey.phase_after_title")}
        subtitle={t("journey.step_after")}
        icon={ClipboardCheck}
        tone="amber"
        backTo="/parent"
      />
      <div className="max-w-lg mx-auto px-4 sm:px-5 py-5 space-y-4">
        <JourneyBackLink />
        <div className="clinic-panel !p-3">
          <JourneyTimeline activePhaseId="after" compact />
        </div>

        <p className="clinic-sub clinic-panel">{t("journey.follow_intro")}</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["pending", stats.pending, "text-amber-800", "bg-amber-50/70 border-amber-200"],
            ["done", stats.done, "text-emerald-800", "bg-emerald-50/70 border-emerald-200"],
            ["stuck", stats.stuck, "text-red-800", "bg-red-50/70 border-red-200"],
          ].map(([key, count, color, surface]) => (
            <div key={key} className={`rounded-2xl border p-3 ${surface}`}>
              <p className={`text-2xl font-black ${color}`}>{count}</p>
              <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                {t(`journey.follow_stat_${key}`)}
              </p>
            </div>
          ))}
        </div>

        <SectionCard titleKey="journey.follow_add" descKey="journey.follow_add_desc" icon={Plus}>
          <form onSubmit={handleAdd} className="space-y-2.5">
            <label className="block">
              <span className="clinic-label">{t("journey.follow_title_label")}</span>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("journey.follow_title_ph")}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="clinic-label">{t("journey.follow_type_label")}</span>
                <select
                  className="h-10 w-full rounded-xl border px-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {FOLLOWUP_TYPES.map((opt) => (
                    <option key={opt.id} value={opt.id}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="clinic-label">{t("journey.follow_due")}</span>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
            </div>
            <button type="submit" className="clinic-cta !h-12 !text-sm" disabled={!title.trim()}>
              {t("journey.follow_add_btn")}
            </button>
          </form>
        </SectionCard>

        <section className="space-y-2.5">
          <h2 className="clinic-h2 text-sm px-1">{t("journey.follow_list_title")}</h2>
          {items.length === 0 ? (
            <div className="clinic-panel text-center py-8">
              <div className="clinic-icon w-12 h-12 mx-auto mb-3 tone-slate">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-slate-700">{t("journey.follow_empty")}</p>
              <p className="clinic-sub mt-1">{t("journey.follow_empty_hint")}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-3.5 space-y-2.5 ${STATUS_STYLE[item.status] || STATUS_STYLE.pending}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-sky-800">
                      {t(FOLLOWUP_TYPES.find((x) => x.id === item.type)?.labelKey || "journey.follow_type_other")}
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5 break-words">{item.title}</p>
                    {item.dueDate ? (
                      <p className="text-xs text-slate-500 mt-0.5">{t("journey.follow_due")}: {item.dueDate}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600 shrink-0"
                    onClick={() => setItems(removeFollowUp(item.id))}
                    aria-label={t("chart.remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {FOLLOWUP_STATUS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setItems(updateFollowUp(item.id, { status: s }))}
                      className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-bold transition-all ${
                        item.status === s
                          ? "clinic-chip-on"
                          : "bg-white/70 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {t(`journey.follow_status_${s}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="clinic-panel">
          <button
            type="button"
            onClick={() => setTipsOpen((v) => !v)}
            className="w-full flex items-center gap-3 text-start"
          >
            <div className="clinic-icon w-9 h-9 tone-sky">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="clinic-h2 text-sm">{t("journey.med_tips_title")}</h2>
              <p className="clinic-sub text-[11px] mt-0.5">{t("journey.med_tips_intro")}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${tipsOpen ? "rotate-180" : ""}`} />
          </button>
          {tipsOpen ? (
            <div className="mt-3 space-y-2">
              {MEDICAL_HEALTH_TIPS.map((tip) => (
                <div key={tip.id} className="rounded-xl border border-white/70 bg-white/60 p-3">
                  <p className="text-sm font-bold text-slate-900">{t(tip.titleKey)}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t(tip.bodyKey)}</p>
                </div>
              ))}
              <p className="text-[10px] text-sky-800/70 font-semibold">{t("journey.med_tips_disclaimer")}</p>
            </div>
          ) : null}
        </section>

        <DisclaimerBanner />
      </div>
    </div>
  );
}
