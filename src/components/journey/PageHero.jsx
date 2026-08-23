import React from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * One hero pattern for every top-level page so the product reads the same
 * whichever door the user came through.
 */
export default function PageHero({
  icon: Icon,
  tone = "sky",
  badgeKey,
  titleKey,
  subtitleKey,
  noteKey,
  children,
}) {
  const { t } = useI18n();

  return (
    <header className="clinic-wrap pt-7 pb-6 text-center">
      {Icon ? (
        <div className={`clinic-icon w-16 h-16 mx-auto mb-4 tone-${tone}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      ) : null}
      {badgeKey ? (
        <p className="inline-flex items-center gap-1.5 clinic-chip-on text-[10px] font-black uppercase tracking-[0.14em] px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {t(badgeKey)}
        </p>
      ) : null}
      <h1 className="text-2xl md:text-[1.75rem] font-black tracking-tight text-slate-900 leading-tight">
        {t(titleKey)}
      </h1>
      {subtitleKey ? (
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm leading-relaxed">
          {t(subtitleKey)}
        </p>
      ) : null}
      {noteKey ? (
        <p className="text-[11px] text-sky-900/60 mt-3 font-semibold">{t(noteKey)}</p>
      ) : null}
      {children}
    </header>
  );
}
