import React, { useState, useEffect } from "react";
import { pickL } from "../lib/locale.js";

function NumberLineSim({ lang }) {
  const [pos, setPos] = useState(0);
  const [target, setTarget] = useState(7);
  const win = pos === target;

  return (
    <div className="kids-sim-panel space-y-4">
      <p className="font-bold text-center">
        {lang === "he" ? `הגע ל-${target} על ציר המספרים!` : lang === "ar" ? `اصل إلى ${target}!` : `Reach ${target} on the number line!`}
      </p>
      <div className="relative h-16 bg-white/20 rounded-2xl flex items-center px-4">
        <div className="absolute inset-x-4 top-1/2 h-1 bg-white/40 rounded" />
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPos(n)}
            className="relative z-10 flex-1 text-center text-xs font-bold py-4 hover:bg-white/10 rounded"
          >
            {n}
          </button>
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-yellow-400 rounded-full border-4 border-white shadow-lg transition-all duration-300 flex items-center justify-center font-black text-purple-900"
          style={{ left: `calc(${(pos / 10) * 100}% - 20px + 16px)` }}
        >
          🚀
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={() => setPos((p) => Math.max(0, p - 1))} className="kids-sim-btn">−</button>
        <button type="button" onClick={() => setPos((p) => Math.min(10, p + 1))} className="kids-sim-btn">+</button>
        <button type="button" onClick={() => setTarget(Math.floor(Math.random() * 11))} className="kids-sim-btn">🎲</button>
      </div>
      {win && <p className="text-center font-black text-yellow-300 text-lg animate-bounce">🎉 {lang === "he" ? "כל הכבוד!" : "Great!"}</p>}
    </div>
  );
}

function FractionPizzaSim({ lang }) {
  const [slices, setSlices] = useState(4);
  const [eaten, setEaten] = useState(0);
  const frac = `${eaten}/${slices}`;

  return (
    <div className="kids-sim-panel space-y-4 text-center">
      <p className="font-bold">{lang === "he" ? `אכלת ${frac} מהפיצה` : `You ate ${frac} of the pizza`}</p>
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          {Array.from({ length: slices }, (_, i) => {
            const a0 = (i / slices) * 360;
            const a1 = ((i + 1) / slices) * 360;
            const eatenSlice = i < eaten;
            const rad = (deg) => (deg * Math.PI) / 180;
            const x1 = 50 + 45 * Math.cos(rad(a0 - 90));
            const y1 = 50 + 45 * Math.sin(rad(a0 - 90));
            const x2 = 50 + 45 * Math.cos(rad(a1 - 90));
            const y2 = 50 + 45 * Math.sin(rad(a1 - 90));
            const large = a1 - a0 > 180 ? 1 : 0;
            return (
              <path
                key={i}
                d={`M50,50 L${x1},${y1} A45,45 0 ${large} 1 ${x2},${y2} Z`}
                fill={eatenSlice ? "#fca5a5" : "#fbbf24"}
                stroke="#fff"
                strokeWidth="1"
                className="cursor-pointer transition-all hover:opacity-80"
                onClick={() => setEaten(i + 1 === eaten ? i : i + 1)}
              />
            );
          })}
        </svg>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {[2, 4, 6, 8].map((s) => (
          <button key={s} type="button" onClick={() => { setSlices(s); setEaten(0); }} className="kids-sim-btn">{s} {lang === "he" ? "חתיכות" : "slices"}</button>
        ))}
      </div>
    </div>
  );
}

function MultiplicationSim({ lang }) {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  return (
    <div className="kids-sim-panel space-y-4 text-center">
      <p className="text-3xl font-black">{a} × {b} = {a * b}</p>
      <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${b}, minmax(0, 1fr))`, maxWidth: `${b * 36}px` }}>
        {Array.from({ length: a * b }, (_, i) => (
          <div key={i} className="w-8 h-8 rounded-lg bg-pink-400 border-2 border-white kids-pop-in" style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <input type="range" min="1" max="9" value={a} onChange={(e) => setA(+e.target.value)} className="w-32" />
        <input type="range" min="1" max="9" value={b} onChange={(e) => setB(+e.target.value)} className="w-32" />
      </div>
    </div>
  );
}

function SolarSystemSim() {
  const [speed, setSpeed] = useState(1);
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAngle((a) => a + speed * 2), 50);
    return () => clearInterval(t);
  }, [speed]);
  const planets = [
    { r: 35, size: 8, color: "#60a5fa", emoji: "🌍" },
    { r: 55, size: 10, color: "#f97316", emoji: "🔴" },
    { r: 75, size: 14, color: "#eab308", emoji: "🪐" },
  ];
  return (
    <div className="kids-sim-panel">
      <div className="relative w-full aspect-square max-w-xs mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/50">☀️</div>
        {planets.map((p, i) => {
          const rad = ((angle + i * 120) * Math.PI) / 180;
          const x = 50 + (p.r / 2) * Math.cos(rad);
          const y = 50 + (p.r / 2) * Math.sin(rad);
          return (
            <div key={i} className="absolute rounded-full border border-white/20" style={{ width: p.r, height: p.r, left: `calc(50% - ${p.r / 2}px)`, top: `calc(50% - ${p.r / 2}px)` }} />
          );
        })}
        {planets.map((p, i) => {
          const rad = ((angle + i * 120) * Math.PI) / 180;
          const x = 50 + (p.r / 2) * Math.cos(rad);
          const y = 50 + (p.r / 2) * Math.sin(rad);
          return (
            <div key={`p-${i}`} className="absolute text-lg transition-none" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}>{p.emoji}</div>
          );
        })}
      </div>
      <input type="range" min="0.5" max="4" step="0.5" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full mt-4" />
    </div>
  );
}

function PlantGrowthSim({ lang }) {
  const [stage, setStage] = useState(0);
  const stages = ["🌰", "🌱", "🪴", "🌿", "🌸", "🌳"];
  return (
    <div className="kids-sim-panel text-center space-y-4">
      <div className="text-8xl kids-float transition-all duration-500">{stages[stage]}</div>
      <p className="font-bold">{lang === "he" ? `שלב ${stage + 1}/${stages.length}` : `Stage ${stage + 1}/${stages.length}`}</p>
      <button type="button" onClick={() => setStage((s) => (s + 1) % stages.length)} className="kids-sim-btn px-8">
        {lang === "he" ? "💧 השקה / ☀️ אור" : "💧 Water / ☀️ Sun"}
      </button>
    </div>
  );
}

function WaterCycleSim() {
  const [phase, setPhase] = useState(0);
  const labels = ["🌊 Sea", "☀️ Evaporate", "☁️ Cloud", "🌧️ Rain", "🏔️ Mountain"];
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % labels.length), 2000);
    return () => clearInterval(t);
  }, [labels.length]);
  return (
    <div className="kids-sim-panel text-center space-y-3">
      <div className="text-6xl">{labels[phase].split(" ")[0]}</div>
      <p className="font-black text-lg">{labels[phase]}</p>
      <div className="flex gap-1 justify-center">
        {labels.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${i === phase ? "w-8 bg-cyan-400" : "w-2 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}

function HeartBeatSim() {
  const [bpm, setBpm] = useState(72);
  const [beat, setBeat] = useState(false);
  useEffect(() => {
    const ms = 60000 / bpm;
    const t = setInterval(() => {
      setBeat(true);
      setTimeout(() => setBeat(false), 150);
    }, ms);
    return () => clearInterval(t);
  }, [bpm]);
  return (
    <div className="kids-sim-panel text-center space-y-4">
      <div className={`text-8xl transition-transform duration-150 ${beat ? "scale-125" : "scale-100"}`}>❤️</div>
      <p className="font-black text-2xl">{bpm} BPM</p>
      <input type="range" min="60" max="120" value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full max-w-xs mx-auto block" />
      <p className="text-xs opacity-80">{beat ? "💓 lub-dub!" : "..."}</p>
    </div>
  );
}

function BodyMapSim({ lang, onSelect }) {
  const parts = [
    { id: "head", emoji: "😊", top: "8%", left: "50%" },
    { id: "heart", emoji: "❤️", top: "35%", left: "45%" },
    { id: "lungs", emoji: "🫁", top: "32%", left: "55%" },
    { id: "stomach", emoji: "🫃", top: "50%", left: "50%" },
    { id: "hands", emoji: "🤲", top: "40%", left: "22%" },
    { id: "hands", emoji: "🤲", top: "40%", left: "78%" },
    { id: "feet", emoji: "🦶", top: "82%", left: "40%" },
    { id: "feet", emoji: "🦶", top: "82%", left: "60%" },
  ];
  return (
    <div className="kids-sim-panel relative aspect-[3/4] max-w-xs mx-auto bg-white/10 rounded-3xl border-2 border-white/30">
      <div className="absolute inset-0 flex items-center justify-center text-[120px] opacity-20 pointer-events-none">🧒</div>
      {parts.map((p, i) => (
        <button
          key={`${p.id}-${i}`}
          type="button"
          onClick={() => onSelect?.(p.id)}
          className="absolute text-2xl hover:scale-125 transition-transform kids-pop-in"
          style={{ top: p.top, left: p.left, transform: "translate(-50%,-50%)" }}
          title={p.id}
        >
          {p.emoji}
        </button>
      ))}
      <p className="absolute bottom-3 inset-x-0 text-center text-xs font-bold opacity-80">
        {lang === "he" ? "לחץ על חלק בגוף!" : "Tap a body part!"}
      </p>
    </div>
  );
}

function BinarySim({ lang }) {
  const [bits, setBits] = useState([0, 0, 0, 0]);
  const val = bits.reduce((acc, b, i) => acc + b * (2 ** (3 - i)), 0);
  return (
    <div className="kids-sim-panel text-center space-y-4">
      <p className="font-bold">{lang === "he" ? "הדלק/כבה ביטים — ראה את המספר!" : "Toggle bits — see the number!"}</p>
      <div className="flex gap-3 justify-center">
        {bits.map((b, i) => (
          <button key={i} type="button" onClick={() => setBits(bits.map((x, j) => (j === i ? 1 - x : x)))}
            className={`w-14 h-20 rounded-xl font-mono text-2xl font-black border-4 transition-all ${
              b ? "bg-green-400 border-green-200 text-green-900" : "bg-gray-700 border-gray-500 text-gray-300"
            }`}>
            {b}
          </button>
        ))}
      </div>
      <p className="text-4xl font-black">{val}</p>
    </div>
  );
}

function GlobeSim() {
  const [spin, setSpin] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSpin((s) => s + 1), 40);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="kids-sim-panel text-center">
      <div className="text-8xl inline-block" style={{ transform: `rotateY(${spin}deg)`, transformStyle: "preserve-3d" }}>🌍</div>
    </div>
  );
}

const SIM_MAP = {
  numberline: NumberLineSim,
  fractionpizza: FractionPizzaSim,
  multiplication: MultiplicationSim,
  solar: SolarSystemSim,
  plant: PlantGrowthSim,
  watercycle: WaterCycleSim,
  heartbeat: HeartBeatSim,
  bodyparts: BodyMapSim,
  binary: BinarySim,
  globe: GlobeSim,
};

export default function SimulationPanel({ simId, lang = "he", onBodySelect }) {
  const Comp = SIM_MAP[simId];
  if (!Comp) return null;
  return (
    <div className="kids-glass-card p-4 sm:p-5">
      <Comp lang={lang} onSelect={onBodySelect} />
    </div>
  );
}

export { SIM_MAP };
