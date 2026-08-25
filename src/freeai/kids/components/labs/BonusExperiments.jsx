import React, { useState, useEffect } from "react";
import { pickL } from "../../lib/locale.js";

export function RhythmExp({ lang, onComplete }) {
  const pattern = [1, 0, 1, 1, 0, 1, 0, 0];
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setStep((s) => (s + 1) % pattern.length), 500);
    return () => clearInterval(t);
  }, [playing, pattern.length]);

  const tap = () => {
    if (pattern[step] === 1) setScore((s) => s + 1);
    if (score >= 6) onComplete?.(15);
  };

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "הקש בקצב כשהעיגול זוהר!", en: "Tap when circle glows!", ar: "!" }, lang)}</p>
      <div className="flex gap-2 justify-center">
        {pattern.map((p, i) => (
          <div key={i} className={`w-8 h-8 rounded-full transition-all ${i === step && playing ? "bg-yellow-400 scale-125 kids-glow" : p ? "bg-white/30" : "bg-white/10"}`} />
        ))}
      </div>
      <p className="text-2xl font-black">⭐ {score}</p>
      {!playing ? (
        <button type="button" onClick={() => { setPlaying(true); setScore(0); }} className="kids-sim-btn px-8 py-3 font-black">▶️ {pickL({ he: "התחל!", en: "Start!", ar: "!" }, lang)}</button>
      ) : (
        <button type="button" onClick={tap} className="kids-sim-btn w-24 h-24 rounded-full text-4xl bg-pink-500/50 font-black kids-pulse-soft">👏</button>
      )}
      {score >= 6 && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">🥁 {pickL({ he: "מוזיקאי/ת!", en: "Musician!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function SoundWaveExp({ lang, onComplete }) {
  const [amp, setAmp] = useState(0);
  const [taps, setTaps] = useState(0);
  const displayTaps = Math.min(taps, 5);

  const ping = () => {
    setAmp(Date.now());
    setTaps((t) => Math.min(t + 1, 5));
  };

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "לחץ — ראה גל קול!", en: "Tap — see sound wave!", ar: "!" }, lang)}</p>
      <div className="h-24 flex items-center justify-center gap-1">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="w-2 bg-purple-300 rounded-full transition-all duration-150"
            style={{ height: amp ? 8 + Math.abs(Math.sin(i * 0.8 + amp * 0.01)) * 40 : 8 }} />
        ))}
      </div>
      <button type="button" onClick={ping} disabled={taps >= 5}
        className="kids-lab-action-btn kids-glow disabled:opacity-50">🔊</button>
      <p className="font-bold">{displayTaps}/5</p>
      {displayTaps >= 5 && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">〰️ {pickL({ he: "מדען קול!", en: "Sound scientist!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function WeatherExp({ lang, onComplete }) {
  const [sun, setSun] = useState(50);
  const [rain, setRain] = useState(0);
  const weather = sun > 70 && rain < 30 ? "☀️" : rain > 60 ? "🌧️" : sun < 40 ? "❄️" : "⛅";

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: "שחק עם שמש וגשם!", en: "Play with sun & rain!", ar: "!" }, lang)}</p>
      <p className="text-7xl kids-float">{weather}</p>
      <label className="block text-sm font-bold">☀️ {sun}%</label>
      <input type="range" min="0" max="100" value={sun} onChange={(e) => setSun(+e.target.value)} className="w-full" />
      <label className="block text-sm font-bold">🌧️ {rain}%</label>
      <input type="range" min="0" max="100" value={rain} onChange={(e) => setRain(+e.target.value)} className="w-full" />
      <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">⛅ {pickL({ he: "מטeorolog/ית!", en: "Weather pro!", ar: "!" }, lang)}</button>
    </div>
  );
}

export function EcosystemExp({ lang, onComplete }) {
  const chain = [
    { id: "sun", emoji: "☀️", next: "plant" },
    { id: "plant", emoji: "🌱", next: "bug" },
    { id: "bug", emoji: "🐛", next: "bird" },
    { id: "bird", emoji: "🐦", next: "done" },
  ];
  const [built, setBuilt] = useState([]);

  const add = (id) => {
    const expected = chain[built.length]?.id;
    if (id === expected) setBuilt([...built, id]);
  };

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "בנה שרשרת מזון!", en: "Build food chain!", ar: "!" }, lang)}</p>
      <div className="flex gap-2 justify-center min-h-[3rem]">
        {built.map((id) => (
          <span key={id} className="text-4xl kids-pop-in">{chain.find((c) => c.id === id)?.emoji}</span>
        ))}
        {built.length < chain.length && <span className="text-2xl opacity-50">→ ?</span>}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {chain.map((c) => (
          <button key={c.id} type="button" disabled={built.includes(c.id)} onClick={() => add(c.id)} className="kids-sim-btn text-3xl">{c.emoji}</button>
        ))}
      </div>
      {built.length === chain.length && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">🦋 {pickL({ he: "אקולוג/ist!", en: "Ecologist!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}
