import React, { useState } from "react";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import ClinicHeader from "@/components/clinic/ClinicHeader";
import JourneyTimeline, { JourneyBackLink } from "@/components/journey/JourneyTimeline";
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

export default function ParentFollowUp() {
  const { t } = useI18n();
  const [items, setItems] = useState(() => loadFollowUps());
  const [title, setTitle] = useState("");
  const [type, setType] = useState("results");
  const [dueDate, setDueDate] = useState("");

  const stats = followUpStats(items);

  function refresh(next) {
    setItems(next);
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    refresh(addFollowUp({ title: title.trim(), type, dueDate }));
    setTitle("");
    setDueDate("");
  }

  return (
    <div className="clinic-page">
      <ClinicHeader title={t("journey.phase_after_title")} icon={ClipboardCheck} tone="parent" backTo="/parent" />
      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <JourneyBackLink />
        <section className="clinic-card p-3">
          <JourneyTimeline activePhaseId="after" compact />
        </section>

        <p className="text-sm text-slate-700 leading-relaxed clinic-card p-4">{t("journey.follow_intro")}</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["pending", stats.pending, "text-amber-800"],
            ["done", stats.done, "text-emerald-800"],
            ["stuck", stats.stuck, "text-red-800"],
          ].map(([key, count, color]) => (
            <div key={key} className="clinic-card p-3">
              <p className={`text-xl font-black ${color}`}>{count}</p>
              <p className="text-[10px] font-bold text-slate-600">{t(`journey.follow_stat_${key}`)}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="clinic-card p-4 space-y-3">
          <p className="text-sm font-bold">{t("journey.follow_add")}</p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("journey.follow_title_ph")} />
          <select className="h-10 w-full rounded-xl border px-2 text-sm bg-white/50" value={type} onChange={(e) => setType(e.target.value)}>
            {FOLLOWUP_TYPES.map((opt) => (
              <option key={opt.id} value={opt.id}>{t(opt.labelKey)}</option>
            ))}
          </select>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button type="submit" className="w-full rounded-full bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4" />
            {t("journey.follow_add_btn")}
          </Button>
        </form>

        <section className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center clinic-card p-6">{t("journey.follow_empty")}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="clinic-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-sky-800">{t(FOLLOWUP_TYPES.find((x) => x.id === item.type)?.labelKey || "journey.follow_type_other")}</p>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    {item.dueDate ? <p className="text-xs text-slate-500">{t("journey.follow_due")}: {item.dueDate}</p> : null}
                  </div>
                  <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => refresh(removeFollowUp(item.id))} aria-label={t("chart.remove")}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <select
                  className="h-9 w-full rounded-lg border px-2 text-xs bg-white/50"
                  value={item.status}
                  onChange={(e) => refresh(updateFollowUp(item.id, { status: e.target.value }))}
                >
                  {FOLLOWUP_STATUS.map((s) => (
                    <option key={s} value={s}>{t(`journey.follow_status_${s}`)}</option>
                  ))}
                </select>
              </div>
            ))
          )}
        </section>

        <DisclaimerBanner />
      </div>
    </div>
  );
}
