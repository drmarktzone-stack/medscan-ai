import React from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Titled content block. `step` renders a numbered marker so multi-step
 * forms tell the user where they are without extra copy.
 */
export default function SectionCard({
  titleKey,
  descKey,
  step,
  icon: Icon,
  actions = null,
  children,
  className = "",
}) {
  const { t } = useI18n();

  return (
    <section className={`clinic-panel space-y-3 ${className}`}>
      {titleKey || descKey ? (
        <div className="flex items-start gap-3">
          {step != null ? <span className="clinic-step-num clinic-step-num-on">{step}</span> : null}
          {Icon && step == null ? (
            <div className="clinic-icon w-9 h-9">
              <Icon className="w-4 h-4 text-white" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            {titleKey ? <h2 className="clinic-h2 text-sm sm:text-base">{t(titleKey)}</h2> : null}
            {descKey ? <p className="clinic-sub mt-0.5">{t(descKey)}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
