import React from "react";
import { Loader2 } from "lucide-react";

export default function KidsImage({
  src,
  alt = "",
  className = "",
  aspect = "video",
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [err, setErr] = React.useState(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/10 kids-illustration-frame ${aspectClass} ${className}`}>
      {!loaded && !err && (
        <div className="absolute inset-0 kids-shimmer flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      )}
      {err ? (
        <div className="absolute inset-0 flex items-center justify-center text-4xl bg-white/10">🎨</div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
