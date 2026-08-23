import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { CLINICIAN_SHELVES } from "@/lib/clinic/journey";

function ToolTile({ item }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`clinic-card p-4 hover:bg-white/70 transition-all group ${
        item.featured ? "border-2 border-sky-200/70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="clinic-icon">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold group-hover:text-primary">{t(item.titleKey)}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(item.descKey)}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ClinicianToolShelves() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {CLINICIAN_SHELVES.map((shelf) => (
        <section key={shelf.id}>
          <div className="mb-3">
            <h2 className="text-sm font-extrabold text-slate-800">{t(shelf.titleKey)}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t(shelf.descKey)}</p>
          </div>
          <div className={`grid gap-3 ${shelf.id === "workbench" ? "md:grid-cols-2" : "sm:grid-cols-2"}`}>
            {shelf.items.map((item) => (
              <ToolTile key={item.path} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
