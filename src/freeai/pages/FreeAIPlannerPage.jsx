import React from "react";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import ProjectPlanner from "@/freeai/components/ProjectPlanner";
import { useI18n } from "../lib/i18n.jsx";

export default function FreeAIPlannerPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";

  return (
    <FreeAILayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-2">
          {locale === "he" ? "מתכנן פרויקט חכם" : "Smart project planner"}
        </h1>
        <p className="text-white/60 text-sm">
          {locale === "he"
            ? "הכלי מנתח את הפרויקט, מחשב כמה קרדיטים נדרשים, ומחלק אותם בין כל הספקים החינמיים — Google Labs קודם."
            : "Analyzes your project, calculates required credits, and distributes them across all free providers — Google Labs first."}
        </p>
      </div>
      <ProjectPlanner locale={locale} />
    </FreeAILayout>
  );
}
