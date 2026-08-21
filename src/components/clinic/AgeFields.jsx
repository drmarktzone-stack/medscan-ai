import React from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

export default function AgeFields({
  ageYears = "",
  ageMonths = "",
  ageDays = "",
  onChange,
  showDays = true,
  required = false,
  hint = true,
}) {
  const { t } = useI18n();
  const fields = [
    { key: "ageYears", label: t("dp.years"), value: ageYears },
    { key: "ageMonths", label: t("dp.months"), value: ageMonths },
  ];
  if (showDays) fields.push({ key: "ageDays", label: t("dp.days"), value: ageDays });

  return (
    <div>
      <p className="clinic-label">
        {t("dp.age")}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      <div className={`grid gap-2 ${showDays ? "grid-cols-3" : "grid-cols-2"}`}>
        {fields.map((f) => (
          <label key={f.key} className="block min-w-0">
            <span className="clinic-label">{f.label}</span>
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={f.value}
              placeholder="0"
              onChange={(e) => onChange?.({ [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {hint ? <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{t("dp.age_hint")}</p> : null}
    </div>
  );
}
