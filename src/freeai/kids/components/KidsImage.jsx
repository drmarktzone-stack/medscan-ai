import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { emojiPlaceholderDataUrl, emojiForTopic } from "../../lib/visualFallback.js";

const LOAD_TIMEOUT_MS = 12000;

export default function KidsImage({
  src,
  alt = "",
  className = "",
  aspect = "video",
}) {
  const [loaded, setLoaded] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);
  const fallback = emojiPlaceholderDataUrl(alt || "Kids", emojiForTopic(alt));

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

  useEffect(() => {
    setDisplaySrc(src);
    setLoaded(false);
    const timer = setTimeout(() => {
      setDisplaySrc((current) => {
        if (!loaded) return fallback;
        return current;
      });
      setLoaded(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [src, fallback, loaded]);

  const onError = () => {
    setDisplaySrc(fallback);
    setLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/10 kids-illustration-frame ${aspectClass} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 kids-shimmer flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
