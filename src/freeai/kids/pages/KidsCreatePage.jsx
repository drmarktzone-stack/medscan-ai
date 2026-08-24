import React, { useState } from "react";
import { Loader2, BookHeart, User, Image } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import KidsMediaReveal from "../components/KidsMediaReveal.jsx";
import VoiceMic from "../components/VoiceMic.jsx";
import { pickL } from "../lib/locale.js";
import { STORY_STEPS, DRAW_TEMPLATES } from "../lib/gameGenerator.js";
import { generateKidsStory, generateKidsCharacter, generateKidsDrawing } from "../lib/kidsEngine.js";
import { saveCreation } from "../lib/kidsStore.js";

const MODES = [
  { id: "story", icon: BookHeart, label: { he: "סיפור", en: "Story", ar: "قصة" } },
  { id: "character", icon: User, label: { he: "דמות", en: "Character", ar: "شخصية" } },
  { id: "draw", icon: Image, label: { he: "ציור", en: "Drawing", ar: "رسم" } },
];

const COPY = {
  title: { he: "סטודיו יצירה", en: "Creation Studio", ar: "استوديو الإبداع" },
  create: { he: "צור! ✨", en: "Create! ✨", ar: "أبدع! ✨" },
  loading: { he: "יוצר...", en: "Creating...", ar: "جاري الإبداع..." },
  traits: { he: "תכונות (אמיץ, מצחיק...)", en: "Traits (brave, funny...)", ar: "صفات (شجاع، مضحك...)" },
  style: { he: "סגנון (קartoon, א anime...)", en: "Style (cartoon, anime...)", ar: "أسلوب (كرتون...)" },
  detail: { he: "פרטים נוספים", en: "Extra details", ar: "تفاصيل إضافية" },
  name: { he: "שם", en: "Name", ar: "الاسم" },
};

export default function KidsCreatePage() {
  const { lang } = useI18n();
  const [mode, setMode] = useState("story");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [story, setStory] = useState({ hero: "", place: "", problem: "", ending: "" });
  const [character, setCharacter] = useState({ name: "", traits: "", style: "cartoon colorful" });
  const [draw, setDraw] = useState({ template: "hero", detail: "" });

  const create = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (mode === "story") {
        const res = await generateKidsStory({ ...story, lang });
        setResult({ type: "story", text: res.story, scenes: res.scenes });
        saveCreation({ type: "story", title: story.hero || "Story", preview: res.story?.slice(0, 80), data: { story: res.story, scenes: res.scenes } });
      } else if (mode === "character") {
        const res = await generateKidsCharacter({ ...character, lang });
        setResult({ type: "character", ...res });
        saveCreation({
          type: "character",
          title: character.name,
          preview: res.description,
          data: res,
        });
      } else {
        const tpl = DRAW_TEMPLATES.find((t) => t.id === draw.template);
        const res = await generateKidsDrawing({
          template: tpl ? pickL(tpl.name, lang) : draw.template,
          detail: draw.detail,
          lang,
        });
        setResult({ type: "drawing", ...res });
        saveCreation({
          type: "drawing",
          title: tpl ? pickL(tpl.name, lang) : "Drawing",
          preview: res.images?.[0]?.url,
          data: res,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KidsLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black">{pickL(COPY.title, lang)}</h1>

        <div className="flex gap-2">
          {MODES.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setResult(null); }}
              className={`flex-1 py-3 rounded-2xl font-bold flex flex-col items-center gap-1 ${
                mode === id ? "bg-white text-purple-700" : "bg-white/20"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{pickL(label, lang)}</span>
            </button>
          ))}
        </div>

        <div className="bg-white/20 rounded-3xl p-4 space-y-3 border-2 border-white/30">
          {mode === "story" && STORY_STEPS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-sm font-bold">{pickL(label, lang)}</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={story[key]}
                  onChange={(e) => setStory({ ...story, [key]: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl text-purple-900 font-semibold"
                />
                <VoiceMic size="sm" onText={(t) => setStory({ ...story, [key]: story[key] ? `${story[key]} ${t}` : t })} />
              </div>
            </div>
          ))}

          {mode === "character" && (
            <>
              <div>
                <label className="text-sm font-bold">{pickL(COPY.name, lang)}</label>
              <div className="flex gap-2 mt-1">
                <input value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl text-purple-900 font-semibold" />
                <VoiceMic size="sm" onText={(t) => setCharacter({ ...character, name: t })} />
              </div>
              </div>
              <div>
                <label className="text-sm font-bold">{pickL(COPY.traits, lang)}</label>
                <input value={character.traits} onChange={(e) => setCharacter({ ...character, traits: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-purple-900 font-semibold" />
              </div>
              <div>
                <label className="text-sm font-bold">{pickL(COPY.style, lang)}</label>
                <input value={character.style} onChange={(e) => setCharacter({ ...character, style: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-purple-900 font-semibold" />
              </div>
            </>
          )}

          {mode === "draw" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {DRAW_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDraw({ ...draw, template: t.id })}
                    className={`p-3 rounded-xl font-bold text-sm ${
                      draw.template === t.id ? "bg-white text-purple-700" : "bg-white/15"
                    }`}
                  >
                    {t.icon} {pickL(t.name, lang)}
                  </button>
                ))}
              </div>
              <input
                value={draw.detail}
                onChange={(e) => setDraw({ ...draw, detail: e.target.value })}
                placeholder={pickL(COPY.detail, lang)}
                className="w-full px-3 py-2 rounded-xl text-purple-900 font-semibold"
              />
              <div className="flex justify-center pt-1">
                <VoiceMic onText={(t) => setDraw({ ...draw, detail: draw.detail ? `${draw.detail} ${t}` : t })} />
              </div>
            </>
          )}

          <button type="button" onClick={create} disabled={loading}
            className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {pickL(COPY.create, lang)}
          </button>
        </div>

        {result?.type === "story" && (
          <div className="space-y-5">
            {(result.scenes || []).map((scene, i) => (
              <div key={i} className="kids-glass-card p-4 space-y-3 kids-fade-in">
                {scene.media ? (
                  <KidsMediaReveal media={scene.media} lang={lang} single />
                ) : scene.imageUrl ? (
                  <KidsMediaReveal media={{ instant: { images: [{ id: `s-${i}`, url: scene.imageUrl }] } }} lang={lang} single />
                ) : null}
                <p className="text-purple-900 bg-white/90 rounded-2xl p-4 leading-relaxed whitespace-pre-wrap">{scene.text}</p>
              </div>
            ))}
            {!result.scenes?.length && (
              <div className="bg-white/90 text-purple-900 rounded-3xl p-5 whitespace-pre-wrap leading-relaxed shadow-xl">
                {result.text}
              </div>
            )}
          </div>
        )}

        {result?.type === "character" && (
          <div className="space-y-3">
            <p className="bg-white/20 rounded-2xl p-4 kids-glass-card">{result.description}</p>
            <KidsMediaReveal media={result.media} lang={lang} showProviderLinks />
          </div>
        )}

        {result?.type === "drawing" && (
          <KidsMediaReveal media={result.media} lang={lang} showProviderLinks />
        )}
      </div>
    </KidsLayout>
  );
}
