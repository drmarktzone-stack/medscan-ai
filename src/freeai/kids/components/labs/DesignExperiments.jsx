import React, { useState } from "react";
import { pickL } from "../../lib/locale.js";

const OCCASIONS = [
  { id: "birthday", emoji: "🎂", bg: "from-pink-400 to-rose-500", label: { he: "יום הולדת", en: "Birthday", ar: "عيد ميلاد" } },
  { id: "thanks", emoji: "💐", bg: "from-green-400 to-emerald-500", label: { he: "תודה", en: "Thank you", ar: "شكراً" } },
  { id: "holiday", emoji: "🎄", bg: "from-red-500 to-green-600", label: { he: "חג", en: "Holiday", ar: "عيد" } },
  { id: "friend", emoji: "🤝", bg: "from-blue-400 to-indigo-500", label: { he: "חברות", en: "Friendship", ar: "صداقة" } },
];

export function GreetingCardExp({ lang, onComplete, onSave }) {
  const [occ, setOcc] = useState("birthday");
  const [msg, setMsg] = useState("");
  const o = OCCASIONS.find((x) => x.id === occ);

  const finish = () => {
    onSave?.({ type: "design", title: msg.slice(0, 30) || pickL(o.label, lang), preview: o.emoji, data: { occ, msg } });
    onComplete?.(20);
  };

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "עצב כרטיס ברכה!", en: "Design a greeting card!", ar: "!" }, lang)}</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {OCCASIONS.map((c) => (
          <button key={c.id} type="button" onClick={() => setOcc(c.id)}
            className={`kids-sim-btn ${occ === c.id ? "ring-4 ring-yellow-300" : ""}`}>{c.emoji}</button>
        ))}
      </div>
      <div className={`rounded-3xl p-8 text-center bg-gradient-to-br ${o.bg} shadow-2xl border-4 border-white/40 min-h-[180px] flex flex-col justify-center`}>
        <span className="text-5xl mb-2">{o.emoji}</span>
        <p className="text-xl font-black drop-shadow">{msg || pickL(o.label, lang)}</p>
      </div>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2}
        placeholder={pickL({ he: "כתוב ברכה...", en: "Write greeting...", ar: "..." }, lang)}
        className="w-full px-4 py-3 rounded-xl text-purple-900 font-semibold" />
      {msg.trim().length >= 3 && (
        <button type="button" onClick={finish} className="kids-sim-btn w-full py-3 font-black kids-glow">💌 {pickL({ he: "שמרתי בגלריה!", en: "Saved to gallery!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function TypographyExp({ lang, onComplete }) {
  const fonts = ["Comic Sans MS", "Georgia", "Impact", "Courier New"];
  const [font, setFont] = useState(0);
  const [size, setSize] = useState(24);
  const text = pickL({ he: "אני יוצר/ת!", en: "I create!", ar: "أبدع!" }, lang);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "שחק עם פונטים!", en: "Play with fonts!", ar: "!" }, lang)}</p>
      <p className="text-center break-words px-2" style={{ fontFamily: fonts[font], fontSize: size }}>{text}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {fonts.map((f, i) => (
          <button key={f} type="button" onClick={() => setFont(i)} className={`kids-sim-btn text-xs ${font === i ? "bg-white/40" : ""}`}>Aa</button>
        ))}
      </div>
      <input type="range" min="16" max="48" value={size} onChange={(e) => setSize(+e.target.value)} className="w-full" />
      <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">✨ {pickL({ he: "מעצב/ת טקסט!", en: "Text designer!", ar: "!" }, lang)}</button>
    </div>
  );
}

export function StickerSceneExp({ lang, onComplete }) {
  const stickers = ["⭐", "🌈", "🦄", "🚀", "🌸", "🐱", "🎈", "💫"];
  const [placed, setPlaced] = useState([]);

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "הדבק מדבקות על הסצנה!", en: "Stick stickers on the scene!", ar: "!" }, lang)}</p>
      <div className="relative h-48 bg-gradient-to-b from-sky-300/40 to-green-400/40 rounded-2xl border-4 border-white/30 overflow-hidden">
        {placed.map((s, i) => (
          <span key={i} className="absolute text-3xl kids-pop-in cursor-move" style={{ left: `${s.x}%`, top: `${s.y}%` }}>{s.emoji}</span>
        ))}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {stickers.map((s) => (
          <button key={s} type="button" onClick={() => setPlaced([...placed, { emoji: s, x: 10 + Math.random() * 70, y: 10 + Math.random() * 60 }])}
            className="kids-sim-btn text-2xl">{s}</button>
        ))}
      </div>
      {placed.length >= 5 && (
        <button type="button" onClick={() => onComplete?.(20)} className="kids-sim-btn w-full py-3 font-black">🎪 {pickL({ he: "יצירת מaster!", en: "Masterpiece!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}

export function MadLibsExp({ lang, onComplete }) {
  const [words, setWords] = useState({ noun: "", adj: "", verb: "" });
  const story = words.noun && words.adj && words.verb
    ? pickL({
      he: `פעם ${words.adj} ${words.noun} ${words.verb} — וכולם צחקו! 😂`,
      en: `Once a ${words.adj} ${words.noun} ${words.verb} — everyone laughed! 😂`,
      ar: `مرة ${words.adj} ${words.noun} ${words.verb}! 😂`,
    }, lang)
    : "";

  return (
    <div className="kids-lab-panel space-y-3">
      <p className="font-bold text-center">{pickL({ he: "מלא מילים — סיפור מטורף!", en: "Fill words — crazy story!", ar: "!" }, lang)}</p>
      {[
        { key: "adj", ph: { he: "תואר (מצחיק)", en: "Adjective (funny)", ar: "صفة" } },
        { key: "noun", ph: { he: "שם (חיה)", en: "Noun (animal)", ar: "اسم" } },
        { key: "verb", ph: { he: "פועל (קפץ)", en: "Verb (jumped)", ar: "فعل" } },
      ].map(({ key, ph }) => (
        <input key={key} value={words[key]} onChange={(e) => setWords({ ...words, [key]: e.target.value })}
          placeholder={pickL(ph, lang)} className="w-full px-4 py-2 rounded-xl text-purple-900 font-bold" />
      ))}
      {story && (
        <>
          <p className="bg-white/20 rounded-2xl p-4 font-bold text-lg">{story}</p>
          <button type="button" onClick={() => onComplete?.(15)} className="kids-sim-btn w-full py-3 font-black">📖 {pickL({ he: "סופר/ת!", en: "Author!", ar: "!" }, lang)}</button>
        </>
      )}
    </div>
  );
}

export function BannerExp({ lang, onComplete, onSave }) {
  const [text, setText] = useState("");
  const [colors, setColors] = useState(0);
  const palettes = ["from-yellow-400 to-pink-500", "from-cyan-400 to-blue-600", "from-lime-400 to-green-600"];

  const finish = () => {
    onSave?.({ type: "design", title: text, preview: "🎉", data: { text, palette: colors } });
    onComplete?.(20);
  };

  return (
    <div className="kids-lab-panel space-y-4">
      <p className="font-bold text-center">{pickL({ he: "באנר לחגיגה!", en: "Party banner!", ar: "!" }, lang)}</p>
      <div className={`rounded-2xl py-6 px-4 text-center bg-gradient-to-r ${palettes[colors]} border-4 border-white shadow-xl`}>
        <p className="text-2xl sm:text-3xl font-black drop-shadow-lg">{text || "🎉 PARTY 🎉"}</p>
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={pickL({ he: "מזל טוב!", en: "Congratulations!", ar: "!" }, lang)}
        className="w-full px-4 py-2 rounded-xl text-purple-900 font-bold" />
      <div className="flex gap-2 justify-center">
        {palettes.map((_, i) => (
          <button key={i} type="button" onClick={() => setColors(i)} className={`w-10 h-10 rounded-full bg-gradient-to-r ${palettes[i]} border-2 ${colors === i ? "border-white ring-2 ring-yellow-300" : "border-white/50"}`} />
        ))}
      </div>
      {text.trim() && (
        <button type="button" onClick={finish} className="kids-sim-btn w-full py-3 font-black">🎉 {pickL({ he: "באנר מוכן!", en: "Banner ready!", ar: "!" }, lang)}</button>
      )}
    </div>
  );
}
