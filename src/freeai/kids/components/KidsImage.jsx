import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { emojiPlaceholderDataUrl, emojiForTopic } from "../../lib/visualFallback.js";

export default function KidsImage({
  src,
  alt = "",
  className = "",
  aspect = "video",
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

  const onError = () => {
    setDisplaySrc(emojiPlaceholderDataUrl(alt || "Kids", emojiForTopic(alt)));
    setLoaded(true);
  };

  React.useEffect(() => {
    setDisplaySrc(src);
    setLoaded(false);
  }, [src]);

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
