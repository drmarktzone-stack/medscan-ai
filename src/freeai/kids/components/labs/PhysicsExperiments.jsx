import React, { useState } from "react";
import { pickL } from "../../lib/locale.js";

export function PendulumExp({ lang, onComplete }) {
  const [len, setLen] = useState(120);
  const period = (2 * Math.PI * Math.sqrt(len / 980)).toFixed(1);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "שנה אורך החוט — ראה את הקצב!", en: "Change string length — see the swing!", ar: "!" }, lang)}</p>
      <div className="relative h-48 mx-auto">
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 z-10" />
        <div
          className="absolute top-0 left-1/2 kids-pendulum-swing"
          style={{ height: len, transformOrigin: "top center", marginLeft: "-1px" }}
        >
          <div className="w-0.5 h-full bg-white/80 mx-auto" />
          <div className="w-8 h-8 rounded-full bg-yellow-400 border-4 border-white mx-auto shadow-lg flex items-center justify-center">⚫</div>
        </div>
      </div>
      <p className="text-center font-mono text-sm">{pickL({ he: "זמן מחזור", en: "Period", ar: "دورة" }, lang)}: ~{period}s</p>
      <input type="range" min="60" max="200" value={len} onChange={(e) => setLen(+e.target.value)} className="w-full" />
      <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">🎯 {pickL({ he: "הבנתי מטוטלת!", en: "Got pendulum!", ar: "!" }, lang)}</button>
    </div>
  );
}

export function MagnetsExp({ lang, onComplete }) {
  const [pos, setPos] = useState(50);
  const force = pos < 45 ? "repel" : pos > 55 ? "attract" : "neutral";

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "קרב/י את המagnטים!", en: "Move the magnets!", ar: "!" }, lang)}</p>
      <div className="relative h-24 flex items-center justify-center gap-4">
        <span className="text-5xl">🧲</span>
        <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(+e.target.value)} className="flex-1 max-w-[200px]" />
        <span className="text-5xl" style={{ transform: force === "repel" ? "translateX(-12px)" : force === "attract" ? "translateX(12px)" : "none" }}>🧲</span>
      </div>
      <p className="text-lg font-black">
        {force === "repel" && pickL({ he: "← דוחים! (N-N)", en: "← Repelling!", ar: "!" }, lang)}
        {force === "attract" && pickL({ he: "→ נמשכים! (N-S)", en: "→ Attracting!", ar: "!" }, lang)}
        {force === "neutral" && "..."}
      </p>
      {force !== "neutral" && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">🧲 {pickL({ he: "מagnט מלומד/ת!", en: "Magnet master!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function PrismExp({ lang, onComplete }) {
  const [on, setOn] = useState(false);
  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "הדלק אור —ראה קשת!", en: "Turn on light — see rainbow!", ar: "!" }, lang)}</p>
      <div className="relative h-32 bg-gray-900/40 rounded-2xl overflow-hidden">
        {on && (
          <div className="absolute inset-0 flex justify-center items-end pb-2 gap-0.5 kids-rainbow-beam">
            {["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"].map((c) => (
              <div key={c} className="w-3 h-20 rounded-t opacity-80" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        <span className="absolute left-4 top-1/2 text-4xl -translate-y-1/2">☀️</span>
        <span className="absolute left-1/2 top-1/2 text-4xl -translate-x-1/2 -translate-y-1/2">🔺</span>
      </div>
      <button type="button" onClick={() => { setOn(true); setTimeout(() => onComplete?.(15), 800); }} className="kids-sim-btn px-8 py-3 font-black kids-glow">
        {on ? "🌈" : pickL({ he: "💡 הדלק!", en: "💡 Light on!", ar: "!" }, lang)}
      </button>
    </div>
  );
}

export function CircuitExp({ lang, onComplete }) {
  const [wires, setWires] = useState([false, false, false]);
  const lit = wires.every(Boolean);

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "חבר את כל החוטים!", en: "Connect all wires!", ar: "!" }, lang)}</p>
      <div className="flex items-center justify-center gap-2 text-4xl">
        <span>🔋</span>
        {wires.map((w, i) => (
          <button key={i} type="button" onClick={() => { const n = [...wires]; n[i] = !n[i]; setWires(n); }}
            className={`kids-sim-btn px-3 ${w ? "bg-yellow-400/50" : ""}`}>
            {w ? "━━" : "╌╌"}
          </button>
        ))}
        <span className={lit ? "kids-glow text-5xl" : "opacity-30 text-5xl"}>💡</span>
      </div>
      {lit && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black animate-pulse">
          ⚡ {pickL({ he: "הדלקתי נורה!", en: "Light is ON!", ar: "!" }, lang)}
        </button>
      )}
    </div>
  );
}

export function RollerExp({ lang, onComplete }) {
  const [h, setH] = useState(50);
  const speed = Math.sqrt(2 * 9.8 * h / 10).toFixed(1);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "גובה = אנרגיה = מהירות!", en: "Height = energy = speed!", ar: "!" }, lang)}</p>
      <div className="relative h-36 bg-gradient-to-b from-sky-400/30 to-green-500/30 rounded-2xl overflow-hidden">
        <svg viewBox="0 0 200 80" className="w-full h-full">
          <path d="M10,70 Q60,10 120,40 T190,70" fill="none" stroke="white" strokeWidth="4" />
          <circle cx={10 + h * 1.6} cy={70 - h * 0.5} r="8" fill="#fbbf24" />
        </svg>
      </div>
      <p className="text-center font-mono">{pickL({ he: "מהירות", en: "Speed", ar: "سرعة" }, lang)}: ~{speed} m/s</p>
      <input type="range" min="10" max="90" value={h} onChange={(e) => setH(+e.target.value)} className="w-full" />
      {h >= 80 && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">🎢 {pickL({ he: "רכבת הרים!", en: "Coaster pro!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}
