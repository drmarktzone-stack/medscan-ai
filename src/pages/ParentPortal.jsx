import React, { useState } from "react";
import { Heart, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { runDoctorPedAI } from "@/lib/medscan/doctorped/index.js";

const CHIPS = [
  { he: "חום", en: "fever", ar: "حمى" },
  { he: "שיעול", en: "cough", ar: "سعال" },
  { he: "פריחה", en: "rash", ar: "طفح" },
  { he: "הקאות", en: "vomiting", ar: "قيء" },
  { he: "כאב אוזן", en: "ear pain", ar: "ألم أذن" },
  { he: "ישנוניות", en: "lethargy", ar: "خمول" },
  { he: "סוללת כפתור", en: "button battery", ar: "بطارية زر" },
];

export default function ParentPortal() {
  const { t, lang } = useI18n();
  const [ageMonths, setAgeMonths] = useState("");
  const [selected, setSelected] = useState([]);
  const [mchat, setMchat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const chipLabel = (c) => (lang === "en" ? c.en : lang === "ar" ? c.ar : c.he);
  const toggle = (c) => {
    const key = c.en;
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  };

  const handleRun = () => {
    setLoading(true);
    try {
      setResult(runDoctorPedAI({
        persona: "parent",
        integrationMode: "unified",
        patient: { age_months: ageMonths ? Number(ageMonths) : undefined },
        findings: selected,
        presentation: selected.join(", "),
        proceed: true,
        questionnaires: mchat !== "" ? { mchat_total: Number(mchat) } : {},
        locale: lang,
        mode: "development",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <BackButton />
          <Heart className="w-5 h-5 text-rose-600" />
          <h1 className="font-bold text-base flex-1">{t("dp.parent_title")}</h1>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <p className="text-sm text-slate-700 leading-relaxed">{t("dp.parent_intro")}</p>
        <Input type="number" placeholder={t("dp.age_months")} value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.en}
              type="button"
              onClick={() => toggle(c)}
              className={`text-xs px-3 py-1.5 rounded-full border ${selected.includes(c.en) ? "bg-rose-600 text-white border-rose-600" : "bg-white"}`}
            >
              {chipLabel(c)}
            </button>
          ))}
        </div>
        <Input type="number" placeholder={t("dp.mchat")} value={mchat} onChange={(e) => setMchat(e.target.value)} />
        <Button className="w-full" disabled={loading || selected.length === 0} onClick={handleRun}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("dp.parent_run")}
        </Button>

        {result?.emergency && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {t("dp.parent_ed")}
            </p>
            <p className="text-sm mt-1">{result.parent_plan_he}</p>
          </div>
        )}

        {result && !result.emergency && (
          <div className="bg-white border rounded-xl p-4 space-y-2">
            <p className="font-semibold text-sm">{result.parent_plan_he}</p>
            <p className="text-xs text-slate-600">{result.parent_note_he}</p>
            {result.medication_guide?.message_he && (
              <p className="text-xs">{result.medication_guide.message_he}</p>
            )}
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}
