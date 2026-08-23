import React, { useState } from "react";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { verifyVisionUnlockCode, getVisionSubscriptionDays } from "@/lib/clinic/paymentConfig";
import { grantVisionAccess } from "@/lib/clinic/visionSubscription";

export default function UnlockCodePanel({ onUnlocked, compact = false }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!verifyVisionUnlockCode(code)) {
      setError(t("sell.unlock_invalid"));
      return;
    }
    grantVisionAccess({ days: getVisionSubscriptionDays(), source: "unlock_code" });
    setDone(true);
    onUnlocked?.();
  };

  if (done) {
    return (
      <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <p>{t("sell.unlock_success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "clinic-panel border-violet-200/70 space-y-3"}>
      {!compact ? (
        <div className="flex items-start gap-2">
          <KeyRound className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t("sell.unlock_title")}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{t("sell.unlock_hint")}</p>
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("sell.unlock_placeholder")}
          className="h-11 rounded-xl dir-ltr text-center tracking-widest font-bold"
          autoComplete="off"
        />
        <Button type="submit" className="h-11 rounded-xl shrink-0 clinic-cta px-4">
          {t("sell.unlock_submit")}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
