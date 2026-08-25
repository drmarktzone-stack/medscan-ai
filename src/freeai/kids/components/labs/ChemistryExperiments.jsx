import React, { useState } from "react";
import { pickL } from "../../lib/locale.js";

function useComplete(onComplete, xp = 15) {
  return () => onComplete?.(xp);
}

export function ColorMixExp({ lang, onComplete }) {
  const [r, setR] = useState(128);
  const [g, setG] = useState(64);
  const [b, setB] = useState(200);
  const color = `rgb(${r},${g},${b})`;
  const done = useComplete(onComplete, 15);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "ערבב צבעים בבקבוקון!", en: "Mix colors in the flask!", ar: "امزج الألوان!" }, lang)}</p>
      <div className="flex justify-center gap-4">
        {[
          { v: r, set: setR, label: "R", emoji: "🔴" },
          { v: g, set: setG, label: "G", emoji: "🟢" },
          { v: b, set: setB, label: "B", emoji: "🔵" },
        ].map(({ v, set, label, emoji }) => (
          <div key={label} className="text-center space-y-1">
            <span className="text-2xl">{emoji}</span>
            <input type="range" min="0" max="255" value={v} onChange={(e) => set(+e.target.value)} className="w-20" />
          </div>
        ))}
      </div>
      <div className="mx-auto w-32 h-40 rounded-b-3xl rounded-t-lg border-4 border-white/50 shadow-xl kids-lab-beaker transition-colors duration-300" style={{ backgroundColor: color }}>
        <div className="h-4 bg-white/30 rounded-t-lg" />
      </div>
      <button type="button" onClick={done} className="kids-sim-btn w-full py-3 bg-white/30 font-black">{pickL({ he: "✨ שמרתי את הצבע!", en: "✨ Saved my color!", ar: "✨!" }, lang)}</button>
    </div>
  );
}

export function VolcanoExp({ lang, onComplete }) {
  const [stage, setStage] = useState(0);
  const erupt = () => {
    setStage(1);
    setTimeout(() => { setStage(2); onComplete?.(20); }, 1200);
  };

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "הוסף חומרים — הר געש בטוח!", en: "Add ingredients — safe volcano!", ar: "بركان آمن!" }, lang)}</p>
      <div className={`relative mx-auto w-40 h-32 ${stage >= 1 ? "kids-volcano-erupt" : ""}`}>
        <div className="absolute bottom-0 w-full h-20 bg-amber-800 rounded-b-full border-4 border-amber-950" />
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-16 h-12 bg-amber-700 rounded-t-full" />
        {stage >= 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="kids-bubble text-2xl" style={{ animationDelay: `${i * 0.1}s` }}>🫧</span>
            ))}
          </div>
        )}
        {stage >= 2 && <p className="absolute -top-4 w-full text-4xl kids-confetti-burst">🌋💥</p>}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <button type="button" disabled={stage > 0} onClick={() => setStage(0.5)} className="kids-sim-btn">🧪 {pickL({ he: "סודה", en: "Soda", ar: "صودا" }, lang)}</button>
        <button type="button" disabled={stage > 0} onClick={erupt} className="kids-sim-btn kids-glow">🍋 {pickL({ he: "חומץ — התפרץ!", en: "Vinegar — Erupt!", ar: "خل!" }, lang)}</button>
      </div>
    </div>
  );
}

export function PhScaleExp({ lang, onComplete }) {
  const items = [
    { id: "lemon", emoji: "🍋", ph: 2, name: { he: "לימון", en: "Lemon", ar: "ليمون" } },
    { id: "water", emoji: "💧", ph: 7, name: { he: "מים", en: "Water", ar: "ماء" } },
    { id: "soap", emoji: "🧼", ph: 9, name: { he: "סבון", en: "Soap", ar: "صابون" } },
    { id: "baking", emoji: "🥄", ph: 8, name: { he: "סודה לשתייה", en: "Baking soda", ar: "بيكربونات" } },
  ];
  const [placed, setPlaced] = useState({});
  const allDone = items.every((i) => placed[i.id] != null);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "גרור לסולם pH (0=חמוץ, 14=בסיס)", en: "Place on pH scale (0=acid, 14=base)", ar: "ضع على pH" }, lang)}</p>
      <div className="h-8 rounded-full bg-gradient-to-r from-red-500 via-green-400 to-blue-500 relative">
        {items.map((item) => placed[item.id] != null && (
          <span key={item.id} className="absolute -top-6 text-xl transition-all" style={{ left: `${(placed[item.id] / 14) * 100}%`, transform: "translateX(-50%)" }}>{item.emoji}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((item) => (
          <button key={item.id} type="button" disabled={placed[item.id] != null}
            onClick={() => setPlaced({ ...placed, [item.id]: item.ph })}
            className="kids-sim-btn flex items-center gap-1">
            {item.emoji} {pickL(item.name, lang)}
          </button>
        ))}
      </div>
      {allDone && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 bg-green-500/40 font-black animate-pulse">
          🎉 {pickL({ he: "מדען/ית pH!", en: "pH scientist!", ar: "!" }, lang)}
        </button>
      )}
    </div>
  );
}

export function StatesExp({ lang, onComplete }) {
  const [temp, setTemp] = useState(25);
  const state = temp < 0 ? "solid" : temp < 100 ? "liquid" : "gas";
  const visuals = { solid: "🧊", liquid: "💧", gas: "☁️" };
  const names = {
    solid: { he: "מוצק", en: "Solid", ar: "صلب" },
    liquid: { he: "נוזל", en: "Liquid", ar: "سائل" },
    gas: { he: "גaz", en: "Gas", ar: "غاز" },
  };

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="text-6xl kids-float">{visuals[state]}</p>
      <p className="text-2xl font-black">{pickL(names[state], lang)} — {temp}°C</p>
      <input type="range" min="-20" max="120" value={temp} onChange={(e) => set(+e.target.value)} className="w-full max-w-xs mx-auto block" />
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={() => set(-10)} className="kids-sim-btn">❄️</button>
        <button type="button" onClick={() => set(25)} className="kids-sim-btn">💧</button>
        <button type="button" onClick={() => set(110)} className="kids-sim-btn">♨️</button>
      </div>
      {temp >= 100 && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">{pickL({ he: "ראיתי איך מים הופכים לקitור!", en: "I saw water become steam!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function ElementsExp({ lang, onComplete }) {
  const pairs = [
    { sym: "H", name: { he: "מימן", en: "Hydrogen", ar: "هيدrogen" }, emoji: "💨" },
    { sym: "O", name: { he: "חמצן", en: "Oxygen", ar: "أكسجين" }, emoji: "🌬️" },
    { sym: "C", name: { he: "פחמן", en: "Carbon", ar: "كربون" }, emoji: "💎" },
    { sym: "Na", name: { he: "נatrium", en: "Sodium", ar: "صوديوم" }, emoji: "🧂" },
  ];
  const [matched, setMatched] = useState([]);
  const [pick, setPick] = useState(null);

  const tap = (sym) => {
    if (matched.includes(sym)) return;
    if (!pick) { setPick(sym); return; }
    if (pick === sym) { setMatched([...matched, sym]); setPick(null); }
    else setPick(sym);
  };

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "לחץ על הסמל ואז על השם!", en: "Tap symbol then name!", ar: "!" }, lang)}</p>
      <div className="grid grid-cols-2 gap-2">
        {pairs.map((p) => (
          <button key={p.sym} type="button" onClick={() => tap(p.sym)}
            className={`kids-sim-btn py-4 ${matched.includes(p.sym) ? "bg-green-500/50" : pick === p.sym ? "ring-4 ring-yellow-300" : ""}`}>
            <span className="text-2xl font-black">{p.sym}</span>
            <span className="block text-xs">{p.emoji} {pickL(p.name, lang)}</span>
          </button>
        ))}
      </div>
      {matched.length === pairs.length && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">⚛️ {pickL({ he: "כימאי/ית!", en: "Chemist!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}
