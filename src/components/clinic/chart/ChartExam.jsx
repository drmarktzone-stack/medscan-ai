import React from "react";
import { EXAM_SYSTEMS } from "@/lib/clinic/physicalExam.js";

export default function ChartExam({ exam, onSelect }) {
  return (
    <div className="space-y-3">
      {EXAM_SYSTEMS.map((sys) => (
        <div key={sys.id} className="clinic-card p-3 space-y-2">
          <p className="text-xs font-extrabold text-slate-700">{sys.title_he}</p>
          <div className="flex flex-wrap gap-2">
            {sys.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(sys.id, exam[sys.id] === opt.id ? "" : opt.id)}
                className={`clinic-chip text-xs ${exam[sys.id] === opt.id ? "clinic-chip-on" : "text-slate-700"}`}
              >
                {opt.label_he}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
