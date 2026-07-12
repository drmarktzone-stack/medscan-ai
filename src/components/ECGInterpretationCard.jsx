import React, { useState } from "react";
import { Brain, ChevronDown, Activity, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const statusConfig = {
  met: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "מתקיים" },
  not_met: { icon: XCircle, color: "text-slate-400", bg: "bg-slate-50", label: "לא מתקיים" },
  indeterminate: { icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-50", label: "לא בר-הערכה" },
};

export default function ECGInterpretationCard({ interpretation }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if (!interpretation) return null;

  const rules = interpretation.rule_applications || [];
  const metRules = rules.filter((r) => r.status === "met");
  const leads = interpretation.lead_findings || [];
  const systematic = interpretation.systematic_analysis || [];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900">פרשנות עצמאית ממנוע החוקים</p>
            <p className="text-xs text-indigo-700 mt-0.5">{interpretation.preliminary_diagnosis || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {metRules.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {metRules.length} כללים מתקיימים
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-indigo-100 pt-3">
          {/* Reasoning */}
          {interpretation.reasoning && (
            <div>
              <p className="text-[11px] font-bold text-indigo-800 mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                נימוק על בסיס חוקים והובלות
              </p>
              <p className="text-xs text-indigo-900/80 leading-relaxed">{interpretation.reasoning}</p>
            </div>
          )}

          {/* Lead findings */}
          {leads.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-indigo-800 mb-1.5">ממצאים לפי הובלות</p>
              <div className="space-y-1">
                {leads.map((lf, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="font-bold text-indigo-700 shrink-0 min-w-[70px]">{lf.leads}</span>
                    <span className="text-slate-600">{lf.territory ? `[${lf.territory}] ` : ""}{lf.finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Systematic analysis */}
          {systematic.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-indigo-800 mb-1.5">פענוח שיטתי (10 שלבים)</p>
              <div className="grid grid-cols-2 gap-1.5">
                {systematic.map((s, i) => (
                  <div key={i} className="bg-white/60 rounded-md px-2 py-1">
                    <p className="text-[10px] font-semibold text-indigo-700">{s.step}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{s.result}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rule applications */}
          {rules.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-indigo-800 mb-1.5">הפעלת כללי אבחנה</p>
              <div className="space-y-1">
                {rules.map((r, i) => {
                  const cfg = statusConfig[r.status] || statusConfig.indeterminate;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-700">{r.rule}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{r.evidence}</p>
                      </div>
                      {typeof r.confidence === "number" && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color} bg-white/70`}>
                          {r.confidence}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Differentials */}
          {interpretation.differentials && interpretation.differentials.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-indigo-800 mb-1">אבחנות מבדלות</p>
              <div className="flex flex-wrap gap-1">
                {interpretation.differentials.map((d, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-slate-600 border border-indigo-100">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}