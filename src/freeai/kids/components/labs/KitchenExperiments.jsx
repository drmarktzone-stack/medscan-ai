import React, { useState } from "react";
import { pickL } from "../../lib/locale.js";

const FRUITS = [
  { id: "banana", emoji: "🍌", color: "#fde047" },
  { id: "berry", emoji: "🫐", color: "#6366f1" },
  { id: "straw", emoji: "🍓", color: "#f87171" },
  { id: "kiwi", emoji: "🥝", color: "#84cc16" },
  { id: "mango", emoji: "🥭", color: "#fb923c" },
];

export function SmoothieExp({ lang, onComplete }) {
  const [inBlender, setInBlender] = useState([]);
  const [blended, setBlended] = useState(false);

  const mixColor = () => {
    if (!inBlender.length) return "#94a3b8";
    const idx = inBlender.reduce((s, id) => s + FRUITS.findIndex((f) => f.id === id), 0);
    return FRUITS[idx % FRUITS.length].color;
  };

  const blend = () => {
    setBlended(true);
    setTimeout(() => onComplete?.(15), 600);
  };

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "בחר פירות — ערבב שייק!", en: "Pick fruits — blend!", ar: "!" }, lang)}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {FRUITS.map((f) => (
          <button key={f.id} type="button" disabled={blended}
            onClick={() => setInBlender([...inBlender, f.id])}
            className="kids-sim-btn text-2xl">{f.emoji}</button>
        ))}
      </div>
      <div className="mx-auto w-28 h-36 rounded-b-2xl border-4 border-white/50 overflow-hidden transition-colors duration-500" style={{ backgroundColor: blended ? mixColor() : "#e2e8f0" }}>
        {!blended && inBlender.map((id, i) => (
          <span key={i} className="block text-center text-xl">{FRUITS.find((f) => f.id === id)?.emoji}</span>
        ))}
        {blended && <p className="text-center pt-8 text-4xl kids-shake">🥤</p>}
      </div>
      {inBlender.length >= 2 && !blended && (
        <button type="button" onClick={blend} className="kids-sim-btn w-full py-3 font-black kids-glow">{pickL({ he: "🌀 ערבב!", en: "🌀 Blend!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function MeasureExp({ lang, onComplete }) {
  const [cups, setCups] = useState(0);
  const target = 2;
  const win = Math.abs(cups - target) < 0.01;

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="font-bold">{pickL({ he: `מלא בדיוק ${target} כוסות קמח!`, en: `Fill exactly ${target} cups flour!`, ar: "!" }, lang)}</p>
      <div className="text-4xl">{"🥣".repeat(Math.min(5, Math.round(cups * 2)))}</div>
      <p className="text-2xl font-black">{cups.toFixed(1)} / {target}</p>
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={() => setCups((c) => Math.max(0, c - 0.5))} className="kids-sim-btn text-xl">−½</button>
        <button type="button" onClick={() => setCups((c) => c + 0.5)} className="kids-sim-btn text-xl">+½</button>
        <button type="button" onClick={() => setCups((c) => c + 1)} className="kids-sim-btn text-xl">+1</button>
      </div>
      {win && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">👨‍🍳 {pickL({ he: "שף מדידות!", en: "Measuring chef!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function FoodGroupsExp({ lang, onComplete }) {
  const foods = [
    { id: "apple", emoji: "🍎", group: "fruit", label: { he: "תפוח", en: "Apple", ar: "!" } },
    { id: "carrot", emoji: "🥕", group: "veg", label: { he: "גזר", en: "Carrot", ar: "!" } },
    { id: "bread", emoji: "🍞", group: "grain", label: { he: "לחם", en: "Bread", ar: "!" } },
    { id: "milk", emoji: "🥛", group: "dairy", label: { he: "חלב", en: "Milk", ar: "!" } },
    { id: "chicken", emoji: "🍗", group: "protein", label: { he: "עוף", en: "Chicken", ar: "!" } },
  ];
  const groups = {
    fruit: { he: "🍎 פירות", en: "🍎 Fruits", ar: "!" },
    veg: { he: "🥕 ירקות", en: "🥕 Veggies", ar: "!" },
    grain: { he: "🍞 דגנים", en: "🍞 Grains", ar: "!" },
    dairy: { he: "🥛 חלב", en: "🥛 Dairy", ar: "!" },
    protein: { he: "🍗 חלבון", en: "🍗 Protein", ar: "!" },
  };

  const [selectedFood, setSelectedFood] = useState(foods[0].id);
  const [sorted, setSorted] = useState({});
  const [feedback, setFeedback] = useState("");

  const food = foods.find((f) => f.id === selectedFood);
  const assign = (group) => {
    if (!food) return;
    const correct = group === food.group;
    setSorted({ ...sorted, [food.id]: group });
    setFeedback(correct
      ? pickL({ he: "✅ נכון!", en: "✅ Correct!", ar: "!" }, lang)
      : pickL({ he: "❌ נסה שוב", en: "❌ Try again", ar: "!" }, lang));
    if (correct) {
      const next = foods.find((f) => !sorted[f.id] && f.id !== food.id);
      if (next) setTimeout(() => setSelectedFood(next.id), 400);
    }
  };

  const allSorted = foods.every((f) => sorted[f.id] === f.group);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "מיין לארוחה מאוזנת!", en: "Sort for balanced meal!", ar: "!" }, lang)}</p>

      <div className="text-center">
        <p className="text-sm opacity-80 mb-2">{pickL({ he: "לאיזו קבוצה שייך:", en: "Which group:", ar: "?" }, lang)}</p>
        <p className="text-5xl kids-float">{food?.emoji}</p>
        <p className="font-black text-lg">{food ? pickL(food.label, lang) : ""}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(groups).map(([g, label]) => (
          <button key={g} type="button" onClick={() => assign(g)}
            className={`kids-sim-btn py-3 font-black text-sm ${sorted[food?.id] === g ? (sorted[food?.id] === food?.group ? "bg-green-500/50" : "bg-red-500/40") : ""}`}>
            {pickL(label, lang)}
          </button>
        ))}
      </div>

      {feedback && <p className="text-center font-bold">{feedback}</p>}

      <div className="flex gap-2 justify-center flex-wrap">
        {foods.map((f) => (
          <button key={f.id} type="button" onClick={() => setSelectedFood(f.id)}
            className={`text-2xl p-2 rounded-xl ${selectedFood === f.id ? "ring-2 ring-white bg-white/30" : "opacity-70"} ${sorted[f.id] === f.group ? "bg-green-500/30" : ""}`}>
            {f.emoji}
          </button>
        ))}
      </div>

      {allSorted && (
        <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">🥗 {pickL({ he: "תזונה חכמה!", en: "Smart nutrition!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function BreadRiseExp({ lang, onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    { he: "שים קמח ומים", en: "Add flour & water", emoji: "🥣" },
    { he: "הוסף שמרים!", en: "Add yeast!", emoji: "🧫" },
    { he: "חמם — השמרים יוצרים בועות!", en: "Warm — yeast makes bubbles!", emoji: "🫧" },
    { he: "הלחם עולה!", en: "Bread rises!", emoji: "🍞" },
  ];

  return (
    <div className="kids-lab-panel space-y-4 text-center">
      <p className="text-5xl kids-float">{steps[step].emoji}</p>
      <p className="font-bold text-lg">{pickL({ he: steps[step].he, en: steps[step].en, ar: steps[step].en }, lang)}</p>
      <div className="flex gap-1 justify-center">
        {steps.map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i <= step ? "bg-yellow-400" : "bg-white/30"}`} />
        ))}
      </div>
      {step < steps.length - 1 ? (
        <button type="button" onClick={() => setStep(step + 1)} className="kids-sim-btn px-8 py-3 font-black">{pickL({ he: "הבא →", en: "Next →", ar: "→" }, lang)}</button>
      ) : (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">🍞 {pickL({ he: "אפיתי בידע!", en: "Baking scientist!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function RecipeBuilderExp({ lang, onComplete }) {
  const [ingredients, setIngredients] = useState([]);
  const opts = ["🥚", "🥛", "🍯", "🧈", "🌾", "🍫", "🥜", "🍌"];
  const [name, setName] = useState("");

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "בנה מתכון משלך!", en: "Build your recipe!", ar: "!" }, lang)}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={pickL({ he: "שם המתכון", en: "Recipe name", ar: "اسم" }, lang)}
        className="w-full px-4 py-2 rounded-xl text-purple-900 font-bold" />
      <div className="flex flex-wrap gap-2 justify-center">
        {opts.map((o) => (
          <button key={o} type="button" onClick={() => setIngredients([...ingredients, o])} className="kids-sim-btn text-2xl">{o}</button>
        ))}
      </div>
      <p className="text-center text-2xl min-h-[2rem]">{ingredients.join(" ")}</p>
      {name.trim() && ingredients.length >= 3 && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">📝 {pickL({ he: "שף יוצר/ת!", en: "Creator chef!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}
