import React, { useState } from "react";

/**
 * Renders the analyzed image with bounding-box overlays marking the
 * specific regions where abnormal findings were detected.
 * Coordinates are normalized percentages (0-100) relative to the image.
 */
export default function AnnotatedImage({ imageUrl, findings }) {
  const [loaded, setLoaded] = useState(false);

  if (!imageUrl || !findings || findings.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3">תמונה עם סימון אזורי ממצא</h4>
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
        <div className="relative">
          <img
            src={imageUrl}
            alt="תמונה לניתוח עם סימון ממצאים"
            onLoad={() => setLoaded(true)}
            className="w-full h-auto block"
          />
          {loaded &&
            findings.map((f, i) => {
              const labelAbove = f.y >= 8;
              return (
                <div
                  key={i}
                  className="absolute border-2 border-red-500 rounded pointer-events-none"
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    width: `${f.width}%`,
                    height: `${f.height}%`,
                  }}
                >
                  <span
                    className={`absolute right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                      labelAbove ? "top-0 -translate-y-full" : "top-0.5"
                    }`}
                  >
                    {f.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {findings.length} אזורי ממצא מסומנים על גבי התמונה
      </p>
    </div>
  );
}