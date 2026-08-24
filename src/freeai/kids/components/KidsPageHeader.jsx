import React from "react";
import { pickL } from "../lib/locale.js";

export default function KidsPageHeader({ icon: Icon, title, subtitle, lang, children }) {
  return (
    <div className="kids-glass-card p-5 sm:p-6 text-center space-y-2 mb-2">
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/25 kids-pulse-soft mb-1">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-black drop-shadow-md">{pickL(title, lang)}</h1>
      {subtitle && <p className="text-sm sm:text-base opacity-90 font-semibold max-w-lg mx-auto">{pickL(subtitle, lang)}</p>}
      {children}
    </div>
  );
}
