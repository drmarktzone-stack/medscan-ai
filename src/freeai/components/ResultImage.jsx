import React, { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import { emojiPlaceholderDataUrl, emojiForTopic } from "../lib/visualFallback.js";

/**
 * Tries the real CDN URL first; falls back to SVG emoji placeholder on error.
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
  const fallback = fallbackUrl || emojiPlaceholderDataUrl(topic, emojiForTopic(topic));

  const [displaySrc, setDisplaySrc] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setDisplaySrc(src || fallback);
    setLoaded(false);
    setUsingFallback(false);
  }, [src, fallback]);

  const aspectClass =
    aspect === "video" ? "aspect-video" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-square";

  const onError = () => {
    if (!usingFallback) {
      setUsingFallback(true);
      setDisplaySrc(fallback);
      setLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-white/5 group ${aspectClass} ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {showDownload && src && !usingFallback && (
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
