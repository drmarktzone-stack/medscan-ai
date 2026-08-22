import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import AuthShell, { AuthField } from "@/components/clinic/AuthShell";

export default function ResetPassword() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("register.mismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("register.short"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      window.location.href = "/login";
    } catch {
      setError(t("reset.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold">{t("reset.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("reset.subtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthField
          icon={Lock}
          type="password"
          label={t("reset.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
        />
        <AuthField
          icon={Lock}
          type="password"
          label={t("register.confirm")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
        />
        {error ? <p className="text-xs text-red-600 text-center leading-relaxed">{error}</p> : null}
        <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading || !token}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("reset.submit")}
        </Button>
        <Link to="/login" className="text-xs text-primary hover:underline block text-center">{t("forgot.back")}</Link>
      </form>
    </AuthShell>
  );
}
