import React, { useState, useEffect, useMemo } from "react";
import { sceneDataUrl } from "../../lib/artwork.js";

const ASPECTS = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  video: "aspect-video",
};

/**
 * Illustration frame for Kids screens.
 *
 * Locally generated artwork loads instantly, so the shimmer only ever appears
 * for remote AI images. Any load failure swaps in a local scene for the same
 * topic rather than leaving a broken frame.
 */
export default function KidsImage({ src, alt = "", className = "", aspect = "video" }) {
  const fallback = useMemo(
    () => sceneDataUrl({ topic: alt || "FreeAI Kids", width: 640, height: 480 }),
    [alt],
  );

  const [displaySrc, setDisplaySrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDisplaySrc(src || fallback);
    setLoaded(false);
  }, [src, fallback]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white/10 kids-illustration-frame ${ASPECTS[aspect] || ASPECTS.video} ${className}`}
    >
      {!loaded && <div className="absolute inset-0 kids-shimmer" aria-hidden />}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setDisplaySrc(fallback);
          setLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
