import React from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import AgeFields from "@/components/clinic/AgeFields";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="clinic-label">{label}</span>
      {children}
    </label>
  );
}

export default function PatientStrip({ compact = false }) {
  const { t } = useI18n();
  const { session, patch } = usePatientSession();
  return (
    <div className="clinic-card p-4 space-y-3">
      <AgeFields
        ageYears={session.ageYears}
        ageMonths={session.ageMonths}
        ageDays={session.ageDays}
        onChange={patch}
        hint={!compact}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label={t("dp.weight")}>
          <Input type="number" value={session.weight} onChange={(e) => patch({ weight: e.target.value })} />
        </Field>
        {!compact && (
          <Field label={t("dp.height")}>
            <Input type="number" value={session.height} onChange={(e) => patch({ height: e.target.value })} />
          </Field>
        )}
        {compact && (
          <Field label={t("dp.sex")}>
            <select className="h-10 w-full rounded-xl border px-2 text-sm bg-white/50" value={session.sex} onChange={(e) => patch({ sex: e.target.value })}>
              <option value="">{t("dp.sex")}</option>
              <option value="male">{t("dp.male")}</option>
              <option value="female">{t("dp.female")}</option>
            </select>
          </Field>
        )}
      </div>
      {!compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label={t("dp.sex")}>
            <select className="h-10 w-full rounded-xl border px-2 text-sm bg-white/50" value={session.sex} onChange={(e) => patch({ sex: e.target.value })}>
              <option value="">{t("dp.sex")}</option>
              <option value="male">{t("dp.male")}</option>
              <option value="female">{t("dp.female")}</option>
            </select>
          </Field>
          <Field label={t("dp.gcs")}>
            <Input type="number" value={session.gcs} onChange={(e) => patch({ gcs: e.target.value })} />
          </Field>
          <Field label={t("dp.ga")}>
            <Input type="number" value={session.gaWeeks} onChange={(e) => patch({ gaWeeks: e.target.value })} />
          </Field>
        </div>
      )}
      {compact ? (
        <Field label={t("dp.findings")}>
          <textarea
            className="w-full min-h-[56px] rounded-xl border p-2 text-sm bg-white/50"
            value={session.findingsText}
            onChange={(e) => patch({ findingsText: e.target.value })}
            placeholder={t("dp.findings")}
          />
        </Field>
      ) : null}
    </div>
  );
}
