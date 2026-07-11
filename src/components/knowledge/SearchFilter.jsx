import React from "react";
import { Search, X, Filter, AlertCircle } from "lucide-react";

export default function SearchFilter({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  urgentOnly,
  onUrgentOnlyChange,
  urgentCount,
}) {
  const hasActiveFilters = query || category || urgentOnly;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="חיפוש לפי כותרת, אבחנה או מאפיינים..."
          className="w-full h-10 rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onUrgentOnlyChange && (
        <button
          onClick={() => onUrgentOnlyChange(!urgentOnly)}
          className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all w-full ${
            urgentOnly
              ? "bg-red-500 text-white shadow-sm"
              : "bg-white border border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          דחופים בלבד
          {urgentCount > 0 && <span className="opacity-80">({urgentCount})</span>}
        </button>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Filter className="w-3.5 h-3.5" />
        </div>
        <button
          onClick={() => onCategoryChange("")}
          className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
            !category
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white border border-slate-200 text-muted-foreground hover:border-primary/30"
          }`}
        >
          הכל
        </button>
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
              category === cat.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-white border border-slate-200 text-muted-foreground hover:border-primary/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onQueryChange("");
              onCategoryChange("");
              onUrgentOnlyChange?.(false);
            }}
            className="text-xs text-red-500 hover:text-red-600 shrink-0 mr-1"
          >
            נקה
          </button>
        )}
      </div>
    </div>
  );
}