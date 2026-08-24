import React, { useState } from "react";

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
  const [failed, setFailed] = useState(false);

  const aspectClass =
    aspect === "video" ? "aspect-video" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-square";

  const topic = label || alt || "FreeAI";
  const fallbackModule = () => import("../lib/visualFallback.js");

  const handleError = async () => {
    if (attempt === 0 && src?.includes("pollinations")) {
      setAttempt(1);
      return;
    }
    if (!failed) {
      setFailed(true);
      const { emojiPlaceholderDataUrl, emojiForTopic } = await fallbackModule();
      setFailed(true);
      // force re-render with data url via state below
      setLocalFallback(emojiPlaceholderDataUrl(topic, emojiForTopic(topic)));
    }
  };

  const [localFallback, setLocalFallback] = useState(null);

  const displaySrc = localFallback || (attempt === 1 && src
    ? `${src}${src.includes("?") ? "&" : "?"}retry=1`
    : src);

  return (
    <div className={`relative overflow-hidden bg-white/5 ${aspectClass} ${className}`}>
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleError}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
      )}
    </div>
  );
}
