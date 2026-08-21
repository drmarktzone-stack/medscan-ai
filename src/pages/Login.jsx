import React, { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { disableLocalClinic } from "@/lib/clinic/localMode";
import { hasChosenRole, loadAccount, postAuthPath } from "@/lib/clinic/account";
import AuthShell, { AuthTabs, AuthField, GoogleButton, GuestContinue, OrDivider } from "@/components/clinic/AuthShell";

export default function Login() {
  const { t } = useI18n();
  const { isAuthenticated, isLocalClinic } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const account = loadAccount();

  if (isAuthenticated && !isLocalClinic && hasChosenRole(account)) {
    return <Navigate to={postAuthPath(account)} replace />;
  }
  if (isAuthenticated && !isLocalClinic && !hasChosenRole(account)) {
    return <Navigate to="/register" replace />;
  }

  const afterAuth = () => {
    disableLocalClinic();
    window.location.href = postAuthPath(loadAccount());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      afterAuth();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      setError(status === 401 || status === 403 ? t("login.bad_credentials") : t("login.unavailable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthTabs />
      <div className="text-center space-y-1">
        <h2 className="text-lg font-extrabold">{t("login.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthField
          icon={Mail}
          type="email"
          label={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <AuthField
          icon={Lock}
          type="password"
          label={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <div className="text-end">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t("login.forgot")}</Link>
        </div>
        {error ? <p className="text-xs text-red-600 text-center leading-relaxed">{error}</p> : null}
        <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("login.submit")}
        </Button>
      </form>

      <OrDivider />
      <GoogleButton
        onClick={() => {
          disableLocalClinic();
          base44.auth.loginWithProvider("google", postAuthPath(loadAccount()));
        }}
        label={t("login.google")}
      />
      <GuestContinue
        onClick={() => navigate("/register")}
        label={t("login.guest")}
      />
      <p className="text-xs text-center text-slate-500 leading-relaxed">
        {t("login.no_account")}{" "}
        <Link to="/register" className="text-primary font-semibold hover:underline">{t("login.register")}</Link>
      </p>
    </AuthShell>
  );
}
