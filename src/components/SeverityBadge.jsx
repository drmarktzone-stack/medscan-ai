import React from "react";

const config = {
  normal: { label: "תקין", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  mild: { label: "קל", bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  moderate: { label: "בינוני", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  severe: { label: "חמור", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  urgent: { label: "דחוף", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export default function SeverityBadge({ severity }) {
  const c = config[severity] || config.normal;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}