import React, { useState, useEffect } from "react";
import { emojiPlaceholderDataUrl, emojiForTopic } from "../lib/visualFallback.js";

/**
 * Image with Pollinations retry + SVG emoji fallback.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  label = "",
  aspect = "square",
}) {
  const [attempt, setAttempt] = useState(0);
  const [displaySrc, setDisplaySrc] = useState(src);

  const aspectClass =
    aspect === "video" ? "aspect-video" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-square";

  const topic = label || alt || "FreeAI";
  const fallback = emojiPlaceholderDataUrl(topic, emojiForTopic(topic));

  useEffect(() => {
    setDisplaySrc(src);
    setAttempt(0);
  }, [src]);

  const handleError = () => {
    if (attempt === 0 && src?.includes("pollinations")) {
      setAttempt(1);
      setDisplaySrc(`${src}${src.includes("?") ? "&" : "?"}retry=1`);
      return;
    }
    setDisplaySrc(fallback);
  };

  const resolvedSrc = displaySrc || fallback;

  return (
    <div className={`relative overflow-hidden bg-white/5 ${aspectClass} ${className}`}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={handleError}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
