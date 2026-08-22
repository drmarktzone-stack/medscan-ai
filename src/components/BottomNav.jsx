import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Clock, BookOpen, Target, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { loadAccount } from "@/lib/clinic/account";

export default function BottomNav() {
  const { t } = useI18n();
  const role = loadAccount().role;
  const tabs = role === "parent"
    ? [
        { to: "/parent", label: t("nav.parent"), icon: Heart, end: false },
        { to: "/history", label: t("nav.history"), icon: Clock, end: false },
      ]
    : [
        { to: "/", label: t("nav.tools"), icon: LayoutGrid, end: true },
        { to: "/history", label: t("nav.history"), icon: Clock, end: false },
        { to: "/knowledge-base", label: t("nav.kb"), icon: BookOpen, end: false },
        { to: "/evaluation", label: t("nav.evaluation"), icon: Target, end: false },
      ];

  return (
    <nav className="fixed bottom-4 inset-x-0 z-30 px-4 no-print safe-bottom select-none">
      <div className={`max-w-md mx-auto clinic-card grid p-1.5 rounded-full ${tabs.length === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 rounded-full transition-all ${
                isActive
                  ? "bg-primary text-white shadow-[0_8px_18px_-10px_hsl(var(--primary))]"
                  : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
