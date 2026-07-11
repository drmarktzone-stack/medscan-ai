import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Clock, BookOpen, Target } from "lucide-react";

const tabs = [
  { to: "/", label: "כלים", icon: LayoutGrid, end: true },
  { to: "/history", label: "היסטוריה", icon: Clock, end: false },
  { to: "/knowledge-base", label: "מאגר", icon: BookOpen, end: false },
  { to: "/evaluation", label: "הערכה", icon: Target, end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 safe-bottom select-none">
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}