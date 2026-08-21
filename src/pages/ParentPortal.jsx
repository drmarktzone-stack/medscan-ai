import React, { useState } from "react";
import { Heart, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import BackButton from "@/components/BackButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { runDoctorPedAI } from "@/lib/medscan/doctorped/index.js";
import { persistDoctorPedEncounter } from "@/lib/supabase/encounters.js";

const CHIPS = [
  { he: "חום", en: "fever", ar: "حمى" },
  { he: "שיעול", en: "cough", ar: "سعال" },
  { he: "צינון", en: "cold", ar: "زكام" },
  { he: "פריחה", en: "rash", ar: "طفح" },
  { he: "פריחה שאינה מלבינה", en: "non-blanching rash", ar: "طفح لا يبيض" },
  { he: "הקאות", en: "vomiting", ar: "قيء" },
  { he: "שלשול", en: "diarrhea", ar: "إسهال" },
  { he: "כאב אוזן", en: "ear pain", ar: "ألم أذن" },
  { he: "כאב בטן", en: "abdominal pain", ar: "ألم بطن" },
  { he: "ישנוניות", en: "lethargy", ar: "خمول" },
  { he: "קושי בנשימה", en: "difficulty breathing", ar: "صعوبة تنفس" },
  { he: "פרכוס", en: "seizure", ar: "نوبة" },
  { he: "חבלת ראש", en: "head trauma", ar: "رض رأس" },
  { he: "סוללת כפתור", en: "button battery", ar: "بطارية زر" },
];

export default function ParentPortal() {
  const { t, lang } = useI18n();
  const [ageMonths, setAgeMonths] = useState("");
  const [selected, setSelected] = useState([]);
  const [mchat, setMchat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [acked, setAcked] = useState(false);

  const chipLabel = (c) => (lang === "en" ? c.en : lang === "ar" ? c.ar : c.he);
  const toggle = (c) => {
    const key = c.en;
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  };

  const handleRun = () => {
    setLoading(true);
    setAcked(false);
    try {
      const next = runDoctorPedAI({
        persona: "parent",
        integrationMode: "unified",
        patient: { age_months: ageMonths ? Number(ageMonths) : undefined },
        findings: selected,
        presentation: selected.join(", "),
        proceed: true,
        questionnaires: mchat !== "" ? { mchat_total: Number(mchat) } : {},
        locale: lang,
        mode: "development",
      });
      setResult(next);
      persistDoctorPedEncounter({ result: next, locale: lang }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const urgency = result?.triage?.urgency;
  const emergency = Boolean(result?.emergency);

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
              className={`text-sm px-3 py-2 rounded-full border ${selected.includes(c.en) ? "bg-rose-600 text-white border-rose-600" : "bg-white"}`}
            >
              {chipLabel(c)}
            </button>
          ))}
        </div>
        <Input type="number" placeholder={t("dp.mchat")} value={mchat} onChange={(e) => setMchat(e.target.value)} />
        <Button className="w-full h-12 text-base" disabled={loading || selected.length === 0} onClick={handleRun}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("dp.parent_run")}
        </Button>

        {emergency && (
          <div className="bg-red-600 text-white rounded-2xl p-5 space-y-3">
            <p className="font-extrabold text-xl flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> {t("dp.parent_ed")}
            </p>
            <p className="text-sm">{result.parent_plan_he}</p>
            {!acked && (
              <Button className="w-full bg-white text-red-700 hover:bg-red-50" onClick={() => setAcked(true)}>
                {t("dp.ack_emergency")}
              </Button>
            )}
          </div>
        )}

        {result && !emergency && (
          <div className={`border rounded-xl p-4 space-y-2 ${urgency === "home_care" ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
            <p className="font-semibold text-sm">
              {urgency === "home_care" ? t("dp.parent_home") : t("dp.parent_hmo")}
            </p>
            <p className="text-sm">{result.parent_plan_he}</p>
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
