import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrintDraftButton from "@/components/clinic/PrintDraftButton";
import { useI18n } from "@/lib/i18n";

export default function ParentHelpCard({ help, emergency = false }) {
  const { t } = useI18n();
  if (!help?.ok) {
    return help?.message_he ? <p className="text-sm text-red-700">{help.message_he}</p> : null;
  }
  if (emergency || help.emergency) {
    return (
      <div className="bg-red-600 text-white rounded-3xl p-5 space-y-2">
        <p className="font-extrabold text-xl flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" /> {t("dp.parent_ed")}
        </p>
        <p className="text-sm leading-relaxed">{help.picture_he}</p>
        {(help.recommend_do_he || []).map((x) => <p key={x} className="text-sm">{x}</p>)}
        <p className="text-xs opacity-90">{t("parent.not_doctor")}</p>
      </div>
    );
  }
  return (
    <div id="clinic-draft-print" className="clinic-card p-4 space-y-3 border-2 border-amber-200 bg-amber-50">
      <p className="text-xs font-bold text-amber-800">{t("dp.draft_badge")}</p>
      <p className="font-extrabold leading-snug">{help.picture_he}</p>
      {help.ask_doctor_he?.length ? (
        <div>
          <p className="text-xs font-black text-slate-500">{t("parent.ask_title")}</p>
          <ul className="list-disc pr-5 text-sm space-y-1">{help.ask_doctor_he.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      ) : null}
      {help.recommend_do_he?.length ? (
        <div>
          <p className="text-xs font-black text-slate-500">{t("parent.do_title")}</p>
          <ul className="list-disc pr-5 text-sm space-y-1">{help.recommend_do_he.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      ) : null}
      {help.referrals_he?.length ? (
        <div>
          <p className="text-xs font-black text-slate-500">{t("parent.ref_title")}</p>
          <ul className="list-disc pr-5 text-sm space-y-1">{help.referrals_he.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      ) : null}
      <p className="text-xs text-slate-600">{t("parent.not_doctor")}</p>
      <PrintDraftButton />
    </div>
  );
}
