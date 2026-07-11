import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Stethoscope, ShieldCheck, Activity, Settings, ScanLine } from "lucide-react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AccountSettings from "@/components/AccountSettings";

const tools = [
  {
    title: "פענוח ECG",
    description: "העלה תמונת אק\"ג וקבל ניתוח מפורט של הקצב, המרווחים והממצאים",
    icon: Activity,
    path: "/ecg",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
  },
  {
    title: "אבחון עור",
    description: "העלה תמונה של נגע או פריחה בעור וקבל הערכה ראשונית והמלצות",
    icon: Stethoscope,
    path: "/skin",
    gradient: "from-teal-500 to-emerald-400",
    bg: "bg-teal-50",
  },
  {
    title: "אבחון רדיולוגי",
    description: "העלה צילום רנטגן, CT, MRI או אולטראסאונד וקבל ניתוח רדיולוגי מפורט",
    icon: ScanLine,
    path: "/radiology",
    gradient: "from-indigo-500 to-violet-400",
    bg: "bg-indigo-50",
  },
];

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Top actions */}
      <div className="flex items-center justify-end px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <Settings className="w-4 h-4" />
          הגדרות חשבון
        </button>
      </div>

      {/* Header */}
      <header className="pt-6 pb-8 px-6 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          MedScan AI
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm leading-relaxed">
          ניתוח רפואי חכם מבוסס בינה מלאכותית — העלה צילום רפואי (ECG, עור, רדיולוגיה) וקבל הערכה מיידית
        </p>
      </header>

      {/* Tools */}
      <main className="max-w-lg mx-auto px-5 pb-10 space-y-4">
        {tools.map((tool) => (
          <Link
            key={tool.path}
            to={tool.path}
            className="block group"
          >
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 select-none">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center shrink-0`}>
                  <tool.icon className={`w-6 h-6 bg-gradient-to-br ${tool.gradient} bg-clip-text`} style={{ color: tool.gradient.includes('blue') ? '#3b82f6' : tool.gradient.includes('teal') ? '#14b8a6' : '#6366f1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="text-muted-foreground/40 group-hover:text-primary transition-colors mt-1">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { icon: ShieldCheck, label: "פרטיות מלאה" },
            { icon: Activity, label: "ניתוח מיידי" },
            { icon: Heart, label: "AI מתקדם" },
          ].map((feat) => (
            <div key={feat.label} className="text-center p-3 rounded-xl bg-white/60 border border-slate-100 select-none">
              <feat.icon className="w-5 h-5 mx-auto text-primary/60 mb-1.5" />
              <p className="text-[11px] font-medium text-muted-foreground">{feat.label}</p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <DisclaimerBanner />
        </div>
      </main>

      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}