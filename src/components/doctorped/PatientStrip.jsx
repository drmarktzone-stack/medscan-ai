import React from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";

export default function PatientStrip({ compact = false }) {
  const { t } = useI18n();
  const { session, patch } = usePatientSession();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Input type="number" placeholder={t("dp.age")} value={session.ageValue} onChange={(e) => patch({ ageValue: e.target.value })} />
        <select className="h-10 rounded-md border px-2 text-sm bg-white" value={session.ageUnit} onChange={(e) => patch({ ageUnit: e.target.value })}>
          <option value="days">{t("dp.days")}</option>
          <option value="months">{t("dp.months")}</option>
          <option value="years">{t("dp.years")}</option>
        </select>
        <Input type="number" placeholder={t("dp.weight")} value={session.weight} onChange={(e) => patch({ weight: e.target.value })} />
        {!compact && (
          <Input type="number" placeholder={t("dp.height")} value={session.height} onChange={(e) => patch({ height: e.target.value })} />
        )}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select className="h-10 rounded-md border px-2 text-sm bg-white" value={session.sex} onChange={(e) => patch({ sex: e.target.value })}>
            <option value="">{t("dp.sex")}</option>
            <option value="male">{t("dp.male")}</option>
            <option value="female">{t("dp.female")}</option>
          </select>
          <Input type="number" placeholder={t("dp.gcs")} value={session.gcs} onChange={(e) => patch({ gcs: e.target.value })} />
          <Input type="number" placeholder={t("dp.ga")} value={session.gaWeeks} onChange={(e) => patch({ gaWeeks: e.target.value })} />
        </div>
      )}
    </div>
  );
}
