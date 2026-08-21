import React from "react";
import { AlertTriangle, ListChecks, FlaskConical, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { asArray, displayText, joinHe, reasonHe } from "@/lib/clinic/engineDisplay";

function items(result) {
  const inst = result?.instrument && typeof result.instrument === "object" ? result.instrument : result;
  return inst || {};
}

function LineList({ title, icon: Icon, rows, tone = "white" }) {
  const list = asArray(rows).map((row, i) => ({ key: displayText(row) || i, text: displayText(row) })).filter((r) => r.text);
  if (!list.length) return null;
  const box =
    tone === "red"
      ? "bg-red-50 border border-red-100"
      : tone === "amber"
        ? "bg-amber-50 border border-amber-200"
        : "clinic-card";
  return (
    <div className={`${box} rounded-xl p-4 space-y-1`}>
      <p className="text-sm font-semibold flex items-center gap-2">
        {Icon ? <Icon className="w-4 h-4" /> : null}
        {title}
      </p>
      {list.map((r, i) => (
        <p key={`${r.key}-${i}`} className="text-xs leading-relaxed">{r.text}</p>
      ))}
    </div>
  );
}

export default function EngineResultPanel({ result }) {
  const { t } = useI18n();
  if (!result) return null;
  const body = items(result);
  const failed = body.ok === false;
  const flags = asArray(body.red_flags ?? body.safety_alerts ?? result.red_flags);
  const ddx = result.hides_mg ? [] : asArray(body.differential ?? result.differential);
  const tests = result.hides_mg ? [] : asArray(body.recommended_tests ?? result.recommended_tests);
  const patterns = asArray(body.matched_patterns ?? result.matched_patterns);
  const kbItems = asArray(body.kbItems ?? result.kbItems);
  const unknowns = asArray(body.unknowns_he ?? result.unknowns_he);
  const notes = joinHe(body.notes_he ?? result.notes_he);
  const title = displayText(body.title_he || result.title_he || kbItems[0]);
  const message = body.message_he || result.message_he || reasonHe(body.reason || result.reason);
  const emergency = Boolean(result.emergency || body.emergency);

  const hasClinical =
    emergency
    || flags.length
    || ddx.length
    || tests.length
    || patterns.length
    || kbItems.length
    || body.pecarn_action
    || body.pecarn
    || body.tbsa_pct != null
    || body.burn
    || body.volume
    || body.formula
    || unknowns.length
    || notes
    || title;

  if (failed && !flags.length && !hasClinical) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 leading-relaxed">
        {message || t("dp.error")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emergency && (
        <div className="bg-red-600 text-white rounded-2xl p-4">
          <p className="font-extrabold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {t("dp.parent_ed")}
          </p>
        </div>
      )}
      {failed && message ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 leading-relaxed">
          {message}
        </div>
      ) : null}
      {title ? (
        <p className="text-sm font-bold clinic-card p-3">{title}</p>
      ) : null}
      {(body.pecarn_action || body.pecarn?.pecarn_action) && (
        <p className="text-sm bg-white/50 border border-white/70 rounded-xl p-3">
          PECARN: <strong>{body.pecarn_action || body.pecarn.pecarn_action}</strong>
          {body.risk || body.pecarn?.risk ? ` · ${body.risk || body.pecarn.risk}` : ""}
        </p>
      )}
      {(body.tbsa_pct != null || body.burn?.tbsa_pct != null) && (
        <p className="text-sm bg-white border rounded-xl p-3">
          TBSA: <strong>{body.tbsa_pct ?? body.burn.tbsa_pct}%</strong>
        </p>
      )}
      {body.volume?.ok && (
        <p className="text-sm bg-white border rounded-xl p-3">
          {body.volume.daily_ml} mL/{t("dp.days")} · {body.volume.per_feed_ml} mL/{t("dp.feed")}
          <span className="block text-[11px] text-slate-500 mt-1">{t("dp.heuristic")}</span>
        </p>
      )}
      {body.formula && (
        <p className="text-sm bg-white border rounded-xl p-3">
          {t("dp.formula")}: {body.formula.type || displayText(body.formula)}
        </p>
      )}
      <LineList title={t("dp.kb_items")} icon={BookOpen} rows={kbItems} />
      <LineList title={t("dp.matched")} rows={patterns} />
      <LineList title={t("dp.red_flags")} icon={AlertTriangle} rows={flags} tone="red" />
      {ddx.length > 0 && (
        <div className="clinic-card p-4 space-y-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4" />{t("dp.ddx")}
          </p>
          <p className="text-[10px] text-slate-500">{t("dp.draft_badge")}</p>
          {ddx.slice(0, 12).map((d, i) => {
            const label = displayText(d);
            if (!label) return null;
            return (
              <p key={d.direction_id || i} className="text-xs leading-relaxed">
                {d.must_not_miss ? "⚠ " : ""}{label}
                {d.probability_note_he ? (
                  <span className="block text-[10px] text-slate-500">{d.probability_note_he}</span>
                ) : null}
              </p>
            );
          })}
        </div>
      )}
      <LineList title={t("dp.tests")} icon={FlaskConical} rows={tests} />
      <LineList title={t("dp.unknowns")} rows={unknowns} tone="amber" />
      {notes ? <p className="text-[11px] text-slate-500 leading-relaxed">{notes}</p> : null}
      {!failed && !hasClinical ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
          {t("dp.result_empty")}
        </div>
      ) : null}
      <p className="text-[10px] text-slate-400">{t("dp.draft_badge")}</p>
    </div>
  );
}
