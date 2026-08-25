import React, { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import KidsImage from "./KidsImage.jsx";
import { pickL } from "../lib/locale.js";

const COPY = {
  moreTools: {
    he: "עוד כלים חינמיים",
    en: "More free tools",
    ar: "أدوات مجانية أخرى",
  },
  animating: {
    he: "אנימציה",
    en: "Animation",
    ar: "رسوم متحركة",
  },
};

/**
 * Reveals images / flipbook animation instantly with shimmer preload.
 * @param {{ media?: object; className?: string; showProviderLinks?: boolean; lang?: string; single?: boolean }} props
 */
export default function KidsMediaReveal({
  media,
  className = "",
  showProviderLinks = false,
  lang = "he",
  single = false,
}) {
  const [animFrame, setAnimFrame] = useState(0);

  const frames = media?.instant?.animationFrames;
  const images = media?.instant?.images || [];

  useEffect(() => {
    if (!frames?.length) return undefined;
    const id = setInterval(() => {
      setAnimFrame((f) => (f + 1) % frames.length);
    }, 750);
    return () => clearInterval(id);
  }, [frames]);

  if (!frames?.length && !images.length) return null;

  const browserLinks = (media?.providerLinks || []).filter((p) => p.isBrowser);

  return (
    <div className={`kids-media-reveal space-y-3 kids-fade-in ${className}`}>
      {frames?.length ? (
        <div className="relative">
          <KidsImage
            src={frames[animFrame].url}
            alt=""
            aspect="video"
            className="border-4 border-white/40 shadow-2xl kids-glow"
          />
          <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            ✨ {pickL(COPY.animating, lang)} {animFrame + 1}/{frames.length}
          </span>
        </div>
      ) : single ? (
        <KidsImage src={images[0].url} alt="" aspect="video" className="border-4 border-white/30 shadow-xl" />
      ) : (
        <div className={`grid gap-3 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((img) => (
            <KidsImage key={img.id} src={img.url} alt="" aspect="square" />
          ))}
        </div>
      )}

      {showProviderLinks && browserLinks.length > 0 && (
        <div className="kids-glass-card p-3 space-y-2">
          <p className="text-xs font-bold opacity-80 text-center">{pickL(COPY.moreTools, lang)}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {browserLinks.slice(0, 4).map((p) => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="kids-sim-btn text-xs inline-flex items-center gap-1"
              >
                {p.name} <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
