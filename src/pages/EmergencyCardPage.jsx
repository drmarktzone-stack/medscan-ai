import React, { useState } from "react";
import { Phone, AlertTriangle, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import AppTopBar from "@/components/journey/AppTopBar";
import PageHero from "@/components/journey/PageHero";
import { useI18n } from "@/lib/i18n";
import { usePatientSession } from "@/lib/doctorped/patientSession";
import {
  loadEmergencyProfile,
  saveEmergencyProfile,
  buildEmergencyScript,
  mergeFromPatientSession,
} from "@/lib/medscan/journey/emergencyProfile";
import { loadCareProfile } from "@/lib/medscan/journey/careProfile";

export default function EmergencyCardPage() {
  const { t, lang } = useI18n();
  const { session } = usePatientSession();
  const [profile, setProfile] = useState(() => {
    const p = loadEmergencyProfile();
    if (!p.childName && session.patientName) return mergeFromPatientSession(session, p);
    return p;
  });
  const [situation, setSituation] = useState("");
  const [copied, setCopied] = useState(false);

  const script = buildEmergencyScript({
    profile,
    careProfile: loadCareProfile(),
    currentSituation: situation,
    lang,
  });

  function save(e) {
    e.preventDefault();
    setProfile(saveEmergencyProfile(profile));
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback ignored */
    }
  }

  return (
    <div className="clinic-page">
      <AppTopBar />
      <PageHero
        icon={AlertTriangle}
        tone="rose"
        badgeKey="life.badge"
        titleKey="life.emergency_title"
        subtitleKey="life.emergency_subtitle"
        noteKey="life.emergency_note"
      />
      <main className="clinic-wrap pb-10 max-w-lg mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <a href="tel:101" className="clinic-panel !border-red-300 !bg-red-50 flex flex-col items-center py-4 gap-1">
            <Phone className="w-6 h-6 text-red-700" />
            <span className="text-lg font-black text-red-900">101</span>
            <span className="text-[11px] text-red-800">{t("life.call_mda")}</span>
          </a>
          <a href="tel:100" className="clinic-panel flex flex-col items-center py-4 gap-1">
            <Phone className="w-6 h-6 text-slate-700" />
            <span className="text-lg font-black">100</span>
            <span className="text-[11px] text-slate-600">{t("life.call_er")}</span>
          </a>
        </div>

        <form onSubmit={save} className="clinic-panel space-y-3">
          <p className="text-sm font-extrabold">{t("life.profile_form")}</p>
          <Input value={profile.childName} onChange={(e) => setProfile({ ...profile, childName: e.target.value })} placeholder={t("life.child_name")} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} />
            <Input value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: e.target.value })} placeholder={t("life.weight_kg")} />
          </div>
          <Input value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} placeholder={t("life.allergies")} />
          <Input value={profile.chronicConditions} onChange={(e) => setProfile({ ...profile, chronicConditions: e.target.value })} placeholder={t("life.conditions")} />
          <Input value={profile.regularMeds} onChange={(e) => setProfile({ ...profile, regularMeds: e.target.value })} placeholder={t("life.meds")} />
          <Input value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })} placeholder={t("life.emergency_contact")} />
          <button type="submit" className="clinic-cta w-full !h-11 !text-sm">{t("life.save_profile")}</button>
        </form>

        <div className="clinic-panel space-y-3">
          <p className="text-sm font-extrabold">{t("life.situation_now")}</p>
          <Textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={3} placeholder={t("life.situation_ph")} />
          <pre className="text-xs whitespace-pre-wrap bg-slate-50 border rounded-xl p-3 leading-relaxed text-slate-800 font-sans">
            {script.script}
          </pre>
          <button type="button" onClick={copyScript} className="clinic-cta w-full !h-11 !text-sm flex items-center justify-center gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t("life.copied") : t("life.copy_script")}
          </button>
        </div>
        <DisclaimerBanner />
      </main>
    </div>
  );
}
