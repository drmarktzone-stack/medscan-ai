import React from "react";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import AIWorkspace from "@/freeai/components/AIWorkspace";
import { useI18n } from "../lib/i18n.jsx";

export default function FreeAIWorkspacePage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";

  return (
    <FreeAILayout>
      <AIWorkspace locale={locale} />
    </FreeAILayout>
  );
}
