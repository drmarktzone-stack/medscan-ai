import React, { useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Loader2, BadgeCheck, Building2, Phone, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { disableLocalClinic, enableLocalClinic } from "@/lib/clinic/localMode";
import { absoluteAppPath } from "@/lib/clinic/standalone";
import {
  CLINICIAN_SPECIALTIES,
  clinicianBlockingFields,
  isAccountReady,
  loadAccount,
  postAuthPath,
} from "@/lib/clinic/account";
import { useClinicProfile } from "@/lib/clinic/profileContext";
import AuthShell, {
  AuthTabs, AuthField, GoogleButton, OrDivider, GuestContinue, RolePicker,
} from "@/components/clinic/AuthShell";

const emptyForm = () => ({
  role: "",
  fullName: "",
  email: "",
  password: "",
  confirm: "",
  phone: "",
  nationalId: "",
  licenseNumber: "",
    specialty: "",
  clinicName: "",
  workplaceCity: "",
});

export default function Register() {
  const { t } = useI18n();
  const { isAuthenticated, isLocalClinic, enterLocalClinic } = useAuth();
  const { updateAccount } = useClinicProfile();
  const [params] = useSearchParams();
  const existing = loadAccount();
  const [form, setForm] = useState(() => ({
    ...emptyForm(),
    ...existing,
    role: params.get("role") === "clinician" || params.get("role") === "parent"
      ? params.get("role")
      : existing.role || "",
    password: "",
    confirm: "",
  }));
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const patch = (partial) => setForm((s) => ({ ...s, ...partial }));

  const skipHostedSignup = isLocalClinic || (isAuthenticated && !isLocalClinic);
  const missingDoctor = useMemo(
    () => (form.role === "clinician" ? clinicianBlockingFields(form) : []),
    [form],
  );

  if (isAuthenticated && isAccountReady(existing)) {
    return <Navigate to={postAuthPath(existing)} replace />;
  }

  const persist = () => updateAccount({
    role: form.role,
    fullName: form.fullName,
    email: form.email,
    phone: form.phone,
    nationalId: form.nationalId,
    licenseNumber: form.licenseNumber,
    specialty: form.specialty,
    clinicName: form.clinicName,
    workplaceCity: form.workplaceCity,
  });

  const finish = (local) => {
    persist();
    if (local) {
      enableLocalClinic();
      enterLocalClinic(true);
    } else {
      disableLocalClinic();
    }
    window.location.href = absoluteAppPath(postAuthPath({ ...form, role: form.role }));
  };

  const validate = () => {
    if (!form.role) return t("register.pick_role");
    if (!form.fullName.trim()) return t("register.need_name");
    if (form.role === "clinician" && missingDoctor.length) return t("register.need_license");
    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    if (form.password !== form.confirm) { setError(t("register.mismatch")); return; }
    if (form.password.length < 8) { setError(t("register.short")); return; }
    setLoading(true);
    setError("");
    try {
      persist();
      await base44.auth.register({ email: form.email, password: form.password });
      setStep("otp");
    } catch {
      setError(t("register.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode: otp });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      else await base44.auth.loginViaEmailPassword(form.email, form.password);
      finish(false);
    } catch {
      setError(t("register.otp_bad"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await base44.auth.resendOtp(form.email);
      setResent(true);
    } catch {
      setError(t("register.error"));
    }
  };

  const enterLocal = () => {
    const problem = validate();
    if (problem) { setError(problem); return; }
    finish(true);
  };

  const saveIfAlreadySignedIn = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    finish(isLocalClinic);
  };

  return (
    <AuthShell>
      <AuthTabs />
      {step === "form" ? (
        <>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold">{t("register.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("register.subtitle")}</p>
          </div>

          <RolePicker value={form.role} onChange={(role) => patch({ role })} />

          {form.role ? (
            <form onSubmit={skipHostedSignup ? saveIfAlreadySignedIn : handleRegister} className="space-y-3">
              <AuthField
                icon={User}
                type="text"
                label={form.role === "clinician" ? t("register.physician_name") : t("register.name")}
                value={form.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                autoComplete="name"
              />

              {form.role === "clinician" ? (
                <>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{t("register.clinician_note")}</p>
                  <AuthField
                    type="text"
                    label={t("register.national_id")}
                    value={form.nationalId}
                    onChange={(e) => patch({ nationalId: e.target.value })}
                    inputMode="numeric"
                    maxLength={9}
                    dir="ltr"
                    required={false}
                  />
                  <AuthField
                    icon={BadgeCheck}
                    type="text"
                    label={t("register.license")}
                    value={form.licenseNumber}
                    onChange={(e) => patch({ licenseNumber: e.target.value })}
                    inputMode="numeric"
                    maxLength={9}
                    dir="ltr"
                  />
                  <label className="block space-y-1">
                    <span className="clinic-label">{t("register.specialty")}</span>
                    <select
                      className="h-11 w-full rounded-xl border border-input bg-white/50 px-3 text-sm"
                      value={form.specialty}
                      onChange={(e) => patch({ specialty: e.target.value })}
                      required
                    >
                      <option value="">{t("register.pick_specialty")}</option>
                      {CLINICIAN_SPECIALTIES.map((s) => (
                        <option key={s} value={s}>{t(`register.spec.${s}`)}</option>
                      ))}
                    </select>
                  </label>
                  <AuthField
                    icon={Building2}
                    type="text"
                    label={t("register.clinic")}
                    value={form.clinicName}
                    onChange={(e) => patch({ clinicName: e.target.value })}
                    autoComplete="organization"
                    required={false}
                  />
                  <AuthField
                    icon={MapPin}
                    type="text"
                    label={t("register.city")}
                    value={form.workplaceCity}
                    onChange={(e) => patch({ workplaceCity: e.target.value })}
                    required={false}
                    autoComplete="address-level2"
                  />
                  <AuthField
                    icon={Phone}
                    type="tel"
                    label={t("register.phone")}
                    value={form.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    inputMode="tel"
                    dir="ltr"
                    autoComplete="tel"
                    required={false}
                  />
                </>
              ) : null}

              {!skipHostedSignup ? (
                <>
                  <AuthField
                    icon={Mail}
                    type="email"
                    label={t("login.email")}
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    autoComplete="email"
                  />
                  <AuthField
                    icon={Lock}
                    type="password"
                    label={t("login.password")}
                    value={form.password}
                    onChange={(e) => patch({ password: e.target.value })}
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <AuthField
                    icon={Lock}
                    type="password"
                    label={t("register.confirm")}
                    value={form.confirm}
                    onChange={(e) => patch({ confirm: e.target.value })}
                    autoComplete="new-password"
                    minLength={8}
                  />
                </>
              ) : null}

              {error ? <p className="text-xs text-red-600 text-center leading-relaxed">{error}</p> : null}
              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (skipHostedSignup ? t("register.save_and_enter") : t("register.submit"))}
              </Button>
            </form>
          ) : null}

          {form.role && !skipHostedSignup ? (
            <>
              <OrDivider />
              <GoogleButton
                onClick={() => {
                  const problem = validate();
                  if (problem) { setError(problem); return; }
                  persist();
                  disableLocalClinic();
                  base44.auth.loginWithProvider("google", postAuthPath(form));
                }}
                label={t("register.google")}
              />
              <GuestContinue
                onClick={enterLocal}
                label={form.role === "parent" ? t("register.guest_parent") : t("register.guest_clinician")}
              />
            </>
          ) : null}
        </>
      ) : (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold">{t("register.otp_title")}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("register.otp_body", { email: form.email })}</p>
          </div>
          <div className="flex justify-center" dir="ltr">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
          {resent ? <p className="text-xs text-emerald-700 text-center">{t("register.otp_sent")}</p> : null}
          <Button onClick={handleVerify} className="w-full h-12 rounded-xl font-bold" disabled={loading || otp.length < 6}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("register.verify")}
          </Button>
          <button type="button" onClick={handleResend} className="text-xs text-primary hover:underline block mx-auto">
            {t("register.resend")}
          </button>
        </div>
      )}
    </AuthShell>
  );
}
