import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CLINICIAN_SHELVES } from "@/lib/clinic/journey";

function ToolTile({ item }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`clinic-panel !p-3.5 block transition-all hover:bg-white/90 hover:-translate-y-0.5 group ${
        item.featured ? "ring-1 ring-sky-300/70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="clinic-icon w-9 h-9">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary">{t(item.titleKey)}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {t(item.descKey)}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Grouped, collapsible tool shelves with a filter. Collapsing keeps the
 * long community-pediatrics list from burying everything else.
 */
export default function ClinicianToolShelves() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(() => ({ community: true, knowledge: true }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return CLINICIAN_SHELVES.map((shelf) => ({
      ...shelf,
      items: shelf.items.filter((item) =>
        `${t(item.titleKey)} ${t(item.descKey)}`.toLowerCase().includes(q),
      ),
    })).filter((shelf) => shelf.items.length);
  }, [query, t]);

  const shelves = filtered ?? CLINICIAN_SHELVES;
  const searching = filtered !== null;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("journey.tool_search")}
          className="w-full h-11 ps-9 pe-9 text-sm border"
          aria-label={t("journey.tool_search")}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-700"
            aria-label={t("journey.tool_search_clear")}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {searching && !shelves.length ? (
        <p className="clinic-panel text-center text-sm text-slate-500">{t("journey.tool_search_empty")}</p>
      ) : null}

      {shelves.map((shelf) => {
        const isCollapsed = !searching && collapsed[shelf.id];
        return (
          <section key={shelf.id}>
            <button
              type="button"
              onClick={() => setCollapsed((cur) => ({ ...cur, [shelf.id]: !cur[shelf.id] }))}
              disabled={searching}
              className="w-full flex items-center gap-2 text-start mb-3 group disabled:cursor-default"
            >
              <div className="min-w-0 flex-1">
                <h2 className="clinic-h2 text-sm flex items-center gap-2">
                  {t(shelf.titleKey)}
                  <span className="text-[10px] font-bold text-slate-500 bg-white/70 rounded-full px-2 py-0.5">
                    {shelf.items.length}
                  </span>
                </h2>
                <p className="clinic-sub text-[11px] mt-0.5">{t(shelf.descKey)}</p>
              </div>
              {!searching ? (
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                />
              ) : null}
            </button>
            {!isCollapsed ? (
              <div className={`grid gap-2.5 ${shelf.id === "workbench" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {shelf.items.map((item) => (
                  <ToolTile key={item.path} item={item} />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
