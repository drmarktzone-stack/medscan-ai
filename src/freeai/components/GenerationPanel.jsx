import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { generateFree } from "../lib/router.js";
import { R } from "../lib/routes.js";
import ResultImage from "./ResultImage.jsx";
import MotifIcon from "./MotifIcon.jsx";

export default function GenerationPanel({ locale = "he" }) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("image");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const types = [
    { id: "image", labelHe: "תמונה", labelEn: "Image", motif: "art" },
    { id: "design", labelHe: "עיצוב", labelEn: "Design", motif: "logo" },
    { id: "video", labelHe: "וידאו", labelEn: "Video", motif: "game" },
  ];

  const run = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await generateFree({ type, prompt, count: Number(count) });
      if (!res.ok) {
        setError({
          text: locale === "he" ? res.messageHe || res.reason : res.messageEn || res.reason,
          suggestion: res.suggestion,
        });
        return;
      }
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-bold text-white">
          {locale === "he" ? "יצירה מיידית (חינם)" : "Instant generation (free)"}
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              type === t.id
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            <MotifIcon motif={t.motif} size="sm" accent="#ffffff" className="w-4 h-4" />
            {locale === "he" ? t.labelHe : t.labelEn}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={locale === "he"
          ? "תאר מה ליצור... למשל: פוסטר מוצר מודרני עם רקע כחול"
          : "Describe what to create... e.g. modern product poster with blue background"}
        className="w-full h-24 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-white/30 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        dir="auto"
      />

      <div className="flex items-center gap-3 mt-3">
        <label className="text-sm text-white/60">
          {locale === "he" ? "כמות:" : "Count:"}
          <input
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="ml-2 w-16 rounded-lg bg-black/30 border border-white/10 text-white px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading || !prompt.trim()}
          className="mr-auto px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {locale === "he" ? "צור בחינם" : "Generate free"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-amber-300 text-sm bg-amber-500/10 border border-amber-400/25 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>{error.text}</p>
            {error.suggestion === "planner" && (
              <Link to={R.planner} className="inline-flex items-center gap-1 font-bold underline">
                {locale === "he" ? "פתח את המתכנן" : "Open the planner"}
              </Link>
            )}
          </div>
        </div>
      )}

      {results?.images?.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {locale === "he"
              ? `${results.images.length} תמונות נוצרו דרך Pollinations (חינם)`
              : `${results.images.length} images generated via Pollinations (free)`}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {results.images.map((img) => (
              <ResultImage
                key={img.id}
                src={img.url}
                fallbackUrl={img.fallbackUrl}
                prompt={img.prompt || prompt}
                alt={img.prompt}
                className="rounded-xl"
                showDownload
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
