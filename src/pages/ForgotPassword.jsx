import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import AuthShell, { AuthField } from "@/components/clinic/AuthShell";

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      /* always show the same sent screen so emails are not enumerated */
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <AuthShell>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold">{t("forgot.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("forgot.subtitle")}</p>
      </div>

      {sent ? (
        <div className="text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm text-muted-foreground leading-relaxed">{t("forgot.sent")}</p>
          <Link to="/login" className="text-xs text-primary hover:underline block">{t("forgot.back")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            icon={Mail}
            type="email"
            label={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("forgot.submit")}
          </Button>
          <Link to="/login" className="text-xs text-primary hover:underline block text-center">{t("forgot.back")}</Link>
        </form>
      )}
    </AuthShell>
  );
}
