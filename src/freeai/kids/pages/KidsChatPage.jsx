import React from "react";
import { useI18n } from "@/lib/i18n";
import KidsLayout from "../components/KidsLayout.jsx";
import KidsMagicBackground from "../components/KidsMagicBackground.jsx";
import KidsImage from "../components/KidsImage.jsx";
import KidsChatPanel from "../components/KidsChatPanel.jsx";
import { pickL } from "../lib/locale.js";
import { chatMascotIllustration } from "../lib/illustrations.js";
import { logActivity } from "../lib/activityLog.js";

const COPY = {
  title: { he: "שאל את FreeAI", en: "Ask FreeAI", ar: "اسأل FreeAI" },
  subtitle: {
    he: "AI חכם שיודע הכל — שאל/י כל שאלה!",
    en: "Smart AI that knows everything — ask anything!",
    ar: "AI ذكي يعرف كل شيء — اسأل أي شيء!",
  },
};

export default function KidsChatPage() {
  const { lang } = useI18n();
  React.useEffect(() => { logActivity("page_chat"); }, []);

  return (
    <KidsLayout>
      <KidsMagicBackground />
      <div className="relative z-10 space-y-4">
        <div className="text-center space-y-3">
          <KidsImage
            src={chatMascotIllustration()}
            alt="FreeAI mascot"
            aspect="square"
            className="w-28 h-28 mx-auto border-4 border-white/40 kids-float kids-glow"
          />
          <h1 className="text-2xl font-black drop-shadow-lg">{pickL(COPY.title, lang)}</h1>
          <p className="text-sm opacity-90">{pickL(COPY.subtitle, lang)}</p>
        </div>
        <KidsChatPanel lang={lang} autoSpeak />
      </div>
    </KidsLayout>
  );
}
