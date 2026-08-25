import React, { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { sceneDataUrl } from "../lib/artwork.js";

const ASPECTS = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  video: "aspect-video",
};

/**
 * Frame for AI-generated images.
 *
 * The remote URL is tried first; if it fails, locally generated artwork for the
 * same prompt takes its place so a result grid never shows broken tiles.
 */
export default function ResultImage({
  src,
  fallbackUrl,
  alt = "",
  prompt = "",
  className = "",
  aspect = "square",
  showDownload = false,
}) {
  const topic = prompt || alt || "FreeAI";
  const fallback = useMemo(
    () => fallbackUrl || sceneDataUrl({ topic, width: 512, height: 512 }),
    [fallbackUrl, topic],
  );

  const [displaySrc, setDisplaySrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(!src);

  useEffect(() => {
    setDisplaySrc(src || fallback);
    setLoaded(false);
    setUsingFallback(!src);
  }, [src, fallback]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/5 group ${ASPECTS[aspect] || ASPECTS.square} ${className}`}>
      {!loaded && <div className="absolute inset-0 fa-skeleton" aria-hidden />}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (usingFallback) return;
          setUsingFallback(true);
          setDisplaySrc(fallback);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {showDownload && src && !usingFallback && (
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          aria-label="הורד תמונה"
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}
