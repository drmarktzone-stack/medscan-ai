import React from "react";
import { ExternalLink, Phone, Building2, Globe, AlertTriangle } from "lucide-react";
import { telHref } from "@/lib/medscan/journey/appointmentLinks";
import { useI18n } from "@/lib/i18n";

const KIND_STYLE = Object.freeze({
  hmo: "border-sky-200 bg-sky-50/80",
  national: "border-red-200 bg-red-50/80",
  private: "border-violet-200 bg-violet-50/80",
});

export default function AppointmentDestinationCard({ destination, rank }) {
  const { t } = useI18n();
  if (!destination) return null;
  const phoneHref = telHref(destination.phone);
  const isEmergency = destination.kind === "national";

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${KIND_STYLE[destination.kind] || KIND_STYLE.hmo}`}>
      <div className="flex items-start gap-3">
        <div className={`clinic-icon w-10 h-10 shrink-0 ${isEmergency ? "tone-rose" : destination.kind === "private" ? "tone-slate" : "tone-sky"}`}>
          {destination.kind === "private" ? (
            <Globe className="w-5 h-5 text-white" />
          ) : isEmergency ? (
            <AlertTriangle className="w-5 h-5 text-white" />
          ) : (
            <Building2 className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            {t("appt.option_rank", { n: rank })}
          </p>
          <p className="text-sm font-extrabold text-slate-900 mt-0.5">{t(destination.labelKey)}</p>
          {destination.descKey ? (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t(destination.descKey)}</p>
          ) : null}
          {destination.hintKey ? (
            <p className="text-xs text-sky-900/80 mt-2 leading-relaxed font-medium">{t(destination.hintKey)}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {destination.url ? (
          <a
            href={destination.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold clinic-chip-on"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t("appt.open_booking")}
          </a>
        ) : null}
        {phoneHref ? (
          <a
            href={phoneHref}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold bg-white/80 border border-slate-200 text-slate-800"
          >
            <Phone className="w-3.5 h-3.5" />
            {destination.phone}
          </a>
        ) : null}
      </div>
    </div>
  );
}
