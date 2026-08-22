import React from "react";
import { LAB_ORDERS, IMAGING_ORDERS, CONSULT_ORDERS, toggleOrder, labelOrders } from "@/lib/clinic/referralOrders.js";

function OrderGroup({ title, catalog, ids, onToggle }) {
  return (
    <div className="clinic-card p-3 space-y-2">
      <p className="text-xs font-extrabold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {catalog.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onToggle(row.id)}
            className={`clinic-chip text-xs ${ids.includes(row.id) ? "clinic-chip-on" : "text-slate-700"}`}
          >
            {row.he}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChartReferrals({ orders, onChange, engineTests, t }) {
  const labs = orders.labs ?? [];
  const imaging = orders.imaging ?? [];
  const consults = orders.consults ?? [];
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">{t("chart.orders_note")}</p>
      <OrderGroup title={t("chart.orders_labs")} catalog={LAB_ORDERS} ids={labs} onToggle={(id) => onChange({ ...orders, labs: toggleOrder(labs, id) })} />
      <OrderGroup title={t("chart.orders_imaging")} catalog={IMAGING_ORDERS} ids={imaging} onToggle={(id) => onChange({ ...orders, imaging: toggleOrder(imaging, id) })} />
      <OrderGroup title={t("chart.orders_consults")} catalog={CONSULT_ORDERS} ids={consults} onToggle={(id) => onChange({ ...orders, consults: toggleOrder(consults, id) })} />
      {engineTests?.length > 0 && (
        <div className="clinic-card p-3 space-y-1">
          <p className="text-xs font-extrabold">{t("chart.engine_tests")}</p>
          {engineTests.map((row, i) => (
            <p key={i} className="text-xs text-slate-700">{typeof row === "string" ? row : row.label_he || row.title_he || JSON.stringify(row)}</p>
          ))}
        </div>
      )}
      {(labs.length || imaging.length || consults.length) ? (
        <p className="text-[11px] text-slate-500">
          {t("chart.orders_summary")}: {[
            ...labelOrders(labs, LAB_ORDERS),
            ...labelOrders(imaging, IMAGING_ORDERS),
            ...labelOrders(consults, CONSULT_ORDERS),
          ].join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
