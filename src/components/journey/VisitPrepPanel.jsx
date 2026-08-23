import React, { useState } from "react";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  prepItemsForService,
  prepProgress,
  loadPrepChecks,
  togglePrepItem,
} from "@/lib/medscan/journey/visitPrepChecklists";

export default function VisitPrepPanel({ serviceId, compact = false }) {
  const { t } = useI18n();
  const [checked, setChecked] = useState(() => loadPrepChecks()[serviceId] || []);
  const items = prepItemsForService(serviceId);
  const prog = prepProgress(serviceId, checked);

  function onToggle(itemId) {
    const next = togglePrepItem(serviceId, itemId);
    setChecked(next);
  }

  if (!items.length) return null;

  return (
    <div className={`rounded-2xl border border-sky-200/80 bg-sky-50/50 ${compact ? "p-3" : "p-4"} space-y-3`}>
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-sky-700 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-sky-950">{t("prep.panel_title")}</p>
          {!compact ? (
            <p className="text-[11px] text-sky-900/70">{t("prep.panel_desc")}</p>
          ) : null}
        </div>
        <span className={`text-[11px] font-black px-2 py-1 rounded-full ${prog.ready ? "bg-emerald-100 text-emerald-800" : "bg-white text-sky-800"}`}>
          {prog.done}/{prog.total}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const done = checked.includes(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`w-full flex items-start gap-2.5 text-start rounded-xl px-2.5 py-2 transition-colors ${
                  done ? "bg-emerald-50/90 border border-emerald-200" : "bg-white/80 border border-white hover:border-sky-200"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${done ? "text-emerald-600" : "text-slate-300"}`} />
                <span className={`text-xs leading-relaxed ${done ? "text-emerald-900 line-through opacity-80" : "text-slate-800"}`}>
                  {item.critical ? "★ " : ""}{t(item.labelKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {prog.ready ? (
        <p className="text-xs font-bold text-emerald-800">{t("prep.ready")}</p>
      ) : (
        <p className="text-[10px] text-sky-900/60">{t("prep.critical_hint")}</p>
      )}
    </div>
  );
}
