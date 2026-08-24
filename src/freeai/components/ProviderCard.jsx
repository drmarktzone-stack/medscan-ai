import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ExternalLink } from "lucide-react";
import { CAPABILITY_META } from "../data/providers.js";
import { R } from "../lib/routes.js";

const QUALITY_COLORS = {
  high: "bg-emerald-500/20 text-emerald-300",
  medium: "bg-amber-500/20 text-amber-300",
  good: "bg-sky-500/20 text-sky-300",
};

export default function ProviderCard({ provider, onToggle, onReset, onEditCredits, locale = "he" }) {
  const name = locale === "he" ? provider.nameHe : provider.name;
  const pct = provider.defaultCredits > 0
    ? Math.round((provider.remaining / provider.defaultCredits) * 100)
    : 100;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${provider.enabled ? "border-white/15 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-50"}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-bold text-white truncate">{name}</h3>
          <p className="text-xs text-white/50 mt-0.5">
            {locale === "he" ? provider.notesHe : provider.notesEn}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${QUALITY_COLORS[provider.quality] || QUALITY_COLORS.good}`}>
          {provider.quality}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {provider.capabilities.map((cap) => (
          <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">
            {CAPABILITY_META[cap]?.icon} {locale === "he" ? CAPABILITY_META[cap]?.labelHe : CAPABILITY_META[cap]?.labelEn}
          </span>
        ))}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-white/60">{locale === "he" ? "קרדיטים" : "Credits"}</span>
          <button
            type="button"
            onClick={() => onEditCredits?.(provider.id, provider.remaining)}
            className="font-bold text-violet-300 hover:text-violet-200"
          >
            {provider.remaining} / {provider.defaultCredits}
          </button>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer">
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) => onToggle?.(provider.id, e.target.checked)}
            className="rounded"
          />
          {locale === "he" ? "פעיל" : "Active"}
        </label>
        <button
          type="button"
          onClick={() => onReset?.(provider.id)}
          className="text-[10px] text-white/40 hover:text-white/70"
        >
          {locale === "he" ? "איפוס" : "Reset"}
        </button>
        <a
          href={provider.generateUrl || provider.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-auto flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
        >
          <ExternalLink className="w-3 h-3" />
          {locale === "he" ? "פתח" : "Open"}
        </a>
      </div>

      {provider.hasApi && provider.needsKey && (
        <div className="mt-2 text-[10px] text-amber-400/80 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {locale === "he" ? "דורש API key" : "Requires API key"}
        </div>
      )}
    </div>
  );
}

export function ProviderCardCompact({ provider, locale = "he" }) {
  const name = locale === "he" ? provider.nameHe : provider.name;
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{name}</div>
        <div className="text-xs text-white/50">{provider.remaining} {locale === "he" ? "קרדיטים" : "credits"}</div>
      </div>
      <Link
        to={`${R.providers}#${provider.id}`}
        className="text-xs text-violet-400"
      >
        →
      </Link>
    </div>
  );
}
