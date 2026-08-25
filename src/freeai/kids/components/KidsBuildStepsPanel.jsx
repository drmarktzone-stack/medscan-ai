import React from "react";
import { CheckCircle2, Circle, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { pickL } from "../lib/locale.js";
import KidsMediaReveal from "./KidsMediaReveal.jsx";
import KidsImage from "./KidsImage.jsx";

const COPY = {
  title: { he: "הבנייה שלך — צעד אחר צעד", en: "Your build — step by step", ar: "بناؤك — خطوة بخطوة" },
  empty: {
    he: "כתוב/י בצ'אט: \"צור לי משחק על חתולים\" או \"עצב לוגו\" — ותראה כאן כל שלב!",
    en: "Type: \"Create a cat game\" or \"Design a logo\" — watch each step here!",
    ar: "اكتب: \"اصنع لعبة\" — وشاهد كل خطوة!",
  },
  play: { he: "▶ שחק/י", en: "▶ Play", ar: "▶ العب" },
  open: { he: "פתח/י", en: "Open", ar: "افتح" },
};

function StepIcon({ status }) {
  if (status === "done") return <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />;
  if (status === "active") return <Loader2 className="w-5 h-5 animate-spin text-yellow-300 shrink-0" />;
  if (status === "error") return <span className="text-red-300 shrink-0">❌</span>;
  return <Circle className="w-5 h-5 text-white/30 shrink-0" />;
}

export default function KidsBuildStepsPanel({ steps = [], result, lang = "he" }) {
  const hasSteps = steps.length > 0;

  return (
    <div className="kids-build-panel flex flex-col h-full min-h-[320px] rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/25 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-white/20 bg-gradient-to-r from-purple-600/30 to-pink-500/30">
        <h3 className="font-black flex items-center gap-2 text-sm sm:text-base">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          {pickL(COPY.title, lang)}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 kids-chat-scroll">
        {!hasSteps && (
          <div className="text-center py-6 opacity-80 space-y-3 kids-fade-in">
            <div className="text-4xl kids-float">🛠️✨</div>
            <p className="text-sm font-semibold leading-relaxed">{pickL(COPY.empty, lang)}</p>
          </div>
        )}

        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-2xl transition-all ${
              step.status === "active" ? "bg-yellow-400/20 ring-2 ring-yellow-300/50 kids-glow" :
              step.status === "done" ? "bg-green-500/15" : "bg-white/5"
            }`}
          >
            <StepIcon status={step.status} />
            <span className={`text-sm font-bold ${step.status === "active" ? "kids-pulse-soft" : ""}`}>
              {typeof step.label === "string" ? step.label : pickL(step.label, lang)}
            </span>
          </div>
        ))}

        {result?.type === "game" || result?.type === "puzzle" ? (
          <div className="space-y-2 kids-fade-in">
            {result.previewUrl && (
              <>
                <iframe title="preview" src={result.previewUrl} className="w-full h-40 rounded-2xl border-2 border-white/30 bg-white" sandbox="allow-scripts" />
                <div className="flex gap-2">
                  <a href={result.previewUrl} target="_blank" rel="noopener noreferrer" className="kids-sim-btn flex-1 text-center text-xs py-2">
                    {pickL(COPY.open, lang)} <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </div>
              </>
            )}
          </div>
        ) : null}

        {result?.media && (
          <KidsMediaReveal media={result.media} lang={lang} single className="kids-fade-in" />
        )}

        {result?.images?.length && !result?.media && (
          <div className="grid grid-cols-2 gap-2 kids-fade-in">
            {result.images.slice(0, 2).map((img) => (
              <KidsImage key={img.id} src={img.url} alt="" aspect="square" />
            ))}
          </div>
        )}

        {result?.story && (
          <p className="text-xs bg-white/15 rounded-2xl p-3 leading-relaxed max-h-32 overflow-y-auto kids-fade-in whitespace-pre-wrap">
            {result.story.slice(0, 400)}…
          </p>
        )}

        {result?.scenes?.[0]?.media && (
          <KidsMediaReveal media={result.scenes[0].media} lang={lang} single />
        )}
      </div>
    </div>
  );
}
