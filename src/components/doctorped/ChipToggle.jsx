import React from "react";

export default function ChipToggle({ options, selected, onToggle, multi = true }) {
  const isOn = (id) => (multi ? selected.includes(id) : selected === id);
  const click = (id) => {
    if (!multi) {
      onToggle(selected === id ? '' : id);
      return;
    }
    onToggle(isOn(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const id = opt.id ?? opt;
        const label = opt.label ?? opt;
        const on = isOn(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => click(id)}
            className={`clinic-chip text-xs ${on ? "clinic-chip-on" : "text-slate-700"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
