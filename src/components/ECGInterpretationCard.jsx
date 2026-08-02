import React, { useState } from "react";
import {
  Brain, ChevronDown, Activity, ShieldAlert, AlertTriangle,
  Ruler, Heart, Zap, Waves, ListChecks, Stethoscope,
} from "lucide-react";

/**
 * Renders the structured output of the state-of-the-art ECG engine.
 * `interpretation` is the engine result object:
 *   { abstain, structured, warnings, confidence, uncertaintyLevel, scrutiny }
 */

const urgencyConfig = {
  Emergency: { label: "חירום", cls: "bg-red-100 text-red-700 border-red-200" },
  Urgent: { label: "דחוף", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  Normal: { label: "תקין", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function Row({ label, value }) {
  if (value === undefined || value === null || value === "" || value === "—") return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="font-semibold text-indigo-700 shrink-0 min-w-[92px]">{label}</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-indigo-800 mb-1.5 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {title}
      </p>
      {children}
    </div>
  );
}

export default function ECGInterpretationCard({ interpretation }) {
  const [expanded, setExpanded] = useState(false);

  if (!interpretation || !interpretation.structured) return null;

  const st = interpretation.structured;
  const warnings = interpretation.warnings || [];
  const confidence = interpretation.confidence;
  const iv = st.intervals || {};
  const rr = st.rhythm_and_rate || {};
  const tc = st.technical_check || {};
  const morph = st.wave_and_segment_morphology || {};
  const hyp = st.hypertrophy_and_enlargement || {};
  const evidence = st.finding_evidence || [];
  const primary = (st.primary_findings || []).filter(Boolean);
  const urg = urgencyConfig[st.clinical_urgency] || urgencyConfig.Normal;

  const boolHe = (b) => (b ? "כן" : "לא");

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-indigo-900">מנוע ECG מובנה (7 שלבים)</p>
            <p className="text-xs text-indigo-700 mt-0.5 truncate">{primary[0] || "פענוח שיטתי"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urg.cls}`}>{urg.label}</span>
          {typeof confidence === "number" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {confidence}%
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Anti-hallucination warnings — always visible, even collapsed */}
      {warnings.length > 0 && (
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            בקרת אמינות — שים לב
          </p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-[11px] text-amber-800/90 leading-relaxed flex gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-indigo-100 pt-3">
          {/* Reasoning */}
          {st.reasoning && (
            <Section icon={Activity} title="נימוק על בסיס מדידות">
              <p className="text-xs text-indigo-900/80 leading-relaxed">{st.reasoning}</p>
            </Section>
          )}

          {/* Technical check */}
          <Section icon={ShieldAlert} title="בדיקה טכנית וכיול">
            <div className="space-y-1">
              <Row label="איכות" value={tc.quality} />
              <Row label="מהירות נייר" value={tc.speed_mm_s ? `${tc.speed_mm_s} mm/s` : null} />
              <Row label="כיול" value={tc.calibration_mm_mv ? `${tc.calibration_mm_mv} mm/mV` : null} />
              <Row label="ארטיפקטים" value={tc.artifacts} />
            </div>
          </Section>

          {/* Rate & rhythm */}
          <Section icon={Heart} title="קצב וריתמוס">
            <div className="space-y-1">
              <Row label="דופק" value={rr.heart_rate_bpm ? `${rr.heart_rate_bpm} bpm` : null} />
              <Row label="קצב" value={rr.rhythm_type} />
              <Row label="רגולריות" value={rr.regularity} />
              <Row label="גל P" value={rr.p_wave_present === undefined ? null : boolHe(rr.p_wave_present)} />
              <Row label="יחס P:QRS" value={rr.p_qrs_relationship} />
            </div>
          </Section>

          {/* Axis */}
          {(st.axis?.degrees !== undefined || st.axis?.interpretation) && (
            <Section icon={Zap} title="ציר חשמלי">
              <Row
                label="ציר QRS"
                value={`${st.axis?.degrees !== undefined ? st.axis.degrees + "° " : ""}${st.axis?.interpretation || ""}`.trim()}
              />
            </Section>
          )}

          {/* Intervals — with dual QTc */}
          <Section icon={Ruler} title="מרווחים ומתחים">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["PR", iv.pr_ms],
                ["QRS", iv.qrs_ms],
                ["QT", iv.qt_ms],
                ["RR", iv.rr_ms],
                ["QTc Bazett", iv.qtc_bazett_ms],
                ["QTc Fridericia", iv.qtc_fridericia_ms],
              ].map(([k, v]) =>
                v !== undefined && v !== null ? (
                  <div key={k} className="bg-white/60 rounded-md px-2 py-1">
                    <p className="text-[10px] font-semibold text-indigo-700">{k}</p>
                    <p className="text-[11px] text-slate-700">{v} ms</p>
                  </div>
                ) : null
              )}
            </div>
            {iv.qtc_status && (
              <p className="text-[10px] text-slate-500 mt-1.5">סטטוס QTc: <span className="font-semibold">{iv.qtc_status}</span> (מחושב בקוד)</p>
            )}
          </Section>

          {/* Morphology */}
          <Section icon={Waves} title="מורפולוגיה — ST / T / Q">
            <div className="space-y-1">
              <Row label="מקטע ST" value={morph.st_segment} />
              <Row label="גלי T" value={morph.t_waves} />
              <Row label="גלי Q" value={morph.q_waves} />
            </div>
          </Section>

          {/* Hypertrophy */}
          <Section icon={Activity} title="היפרטרופיה והגדלה">
            <div className="space-y-1">
              <Row label="LVH" value={hyp.lvh_present === undefined ? null : boolHe(hyp.lvh_present)} />
              <Row label="RVH" value={hyp.rvh_present === undefined ? null : boolHe(hyp.rvh_present)} />
              <Row label="הגדלת עליות" value={hyp.atrial_enlargement} />
            </div>
          </Section>

          {/* Findings + evidence */}
          {primary.length > 0 && (
            <Section icon={ListChecks} title="ממצאים עיקריים וראיות">
              <div className="space-y-1.5">
                {primary.map((f, i) => {
                  const ev = evidence.find(
                    (e) => e.finding === f || (e.finding && (f.includes(e.finding) || e.finding.includes(f)))
                  );
                  const unproven = (st.unevidenced_findings || []).includes(f);
                  return (
                    <div key={i} className={`rounded-md px-2 py-1.5 ${unproven ? "bg-amber-50 border border-amber-200" : "bg-white/70"}`}>
                      <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        {f}
                        {unproven && <span className="text-[9px] text-amber-600">(לא מבוסס)</span>}
                      </p>
                      {ev && (
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          ↳ {ev.evidence}{ev.leads ? ` [${ev.leads}]` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Differentials */}
          {st.differential_diagnoses && st.differential_diagnoses.length > 0 && (
            <Section icon={Stethoscope} title="אבחנות מבדלות">
              <div className="flex flex-wrap gap-1">
                {st.differential_diagnoses.map((d, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-slate-600 border border-indigo-100">
                    {d}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Next steps */}
          {st.recommended_next_steps && st.recommended_next_steps.length > 0 && (
            <Section icon={ListChecks} title="צעדי המשך מומלצים">
              <ul className="space-y-0.5">
                {st.recommended_next_steps.map((s, i) => (
                  <li key={i} className="text-[11px] text-slate-600 flex gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
