import React, { useState } from "react";
import { pickL } from "../lib/locale.js";
import SimulationPanel from "./SimulationPanel.jsx";
import { simsForSubject } from "../data/simulationCatalog.js";

export default function SimulationHub({ subjectId, lang, onBodySelect }) {
  const sims = simsForSubject(subjectId);
  const [active, setActive] = useState(sims[0]?.id);

  if (!sims.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-black text-lg flex items-center gap-2">
        🎮 {pickL({ he: "סימולציות אינטראקטיביות", en: "Interactive simulations", ar: "محاكيات تفاعلية" }, lang)}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sims.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              active === s.id ? "bg-white text-purple-700 scale-105 shadow-lg" : "bg-white/20 hover:bg-white/30"
            }`}
          >
            {s.icon} {pickL(s.name, lang)}
          </button>
        ))}
      </div>
      <SimulationPanel simId={active} lang={lang} onBodySelect={onBodySelect} />
    </div>
  );
}
