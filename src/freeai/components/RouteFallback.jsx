import React from "react";

/** Lightweight route-level loading screen shown while a page chunk downloads. */
export default function RouteFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
      </div>
      <div className="h-1 w-40 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-[loadingBar_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
