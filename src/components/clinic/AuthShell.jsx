import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Stethoscope, Eye, EyeOff, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export default function AuthShell({ children }) {
  const { t, dir } = useI18n();
  return (
    <div className="clinic-page auth-shell min-h-screen flex flex-col" dir={dir}>
      <div className="auth-shell-glow pointer-events-none" aria-hidden="true" />
      <div className="flex justify-end clinic-wrap pt-[calc(env(safe-area-inset-top)+1rem)] relative z-10">
        <div className="clinic-card px-3 py-1.5">
          <LanguageSwitcher />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-5 relative z-10">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center">
            <div className="clinic-icon w-[4.5rem] h-[4.5rem] mx-auto mb-4 shadow-lg">
              <Stethoscope className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("home.brand")}</h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">{t("login.tagline")}</p>
          </div>
          <div className="auth-card clinic-card p-6 sm:p-7 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthTabs() {
  const { t } = useI18n();
  const cls = ({ isActive }) =>
    `h-10 rounded-lg text-sm font-bold flex items-center justify-center transition ${
      isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
    }`;
  return (
    <nav className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100/90" aria-label={t("login.auth_nav")}>
      <NavLink to="/login" className={cls}>{t("login.title")}</NavLink>
      <NavLink to="/register" className={cls}>{t("register.title")}</NavLink>
    </nav>
  );
}

export function AuthField({
  icon: Icon,
  type = "text",
  value,
  onChange,
  label,
  autoComplete,
  required = true,
  minLength,
  maxLength,
  inputMode,
  dir,
}) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <label className="block space-y-1">
      <span className="clinic-label">{label}</span>
      <div className="relative">
        {Icon ? <Icon className="absolute start-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" /> : null}
        <Input
          type={isPass && show ? "text" : type}
          value={value}
          onChange={onChange}
          className={`h-11 rounded-xl ${Icon ? "ps-10" : ""} ${isPass ? "pe-10" : ""}`}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          dir={dir}
        />
        {isPass ? (
          <button
            type="button"
            className="absolute end-3 top-2.5 text-slate-400 hover:text-slate-700"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? t("login.hide_password") : t("login.show_password")}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

export function GoogleButton({ onClick, label }) {
  return (
    <Button variant="outline" type="button" onClick={onClick} className="w-full h-11 rounded-xl font-medium">
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {label}
    </Button>
  );
}

export function OrDivider() {
  const { t } = useI18n();
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
      <div className="relative flex justify-center text-xs">
        <span className="px-3 text-muted-foreground bg-white/80 rounded-full">{t("login.or")}</span>
      </div>
    </div>
  );
}

export function RolePicker({ value, onChange }) {
  const { t } = useI18n();
  const cards = [
    {
      role: "parent",
      title: t("register.role_parent"),
      body: t("register.role_parent_hint"),
      Icon: Heart,
      tone: "from-rose-400 to-orange-300",
    },
    {
      role: "clinician",
      title: t("register.role_clinician"),
      body: t("register.role_clinician_hint"),
      Icon: Stethoscope,
      tone: "from-sky-400 to-cyan-300",
    },
  ];
  return (
    <div className="grid gap-3">
      {cards.map((c) => {
        const on = value === c.role;
        return (
          <button
            key={c.role}
            type="button"
            onClick={() => onChange(c.role)}
            className={`text-start rounded-2xl border p-4 transition ${
              on ? "border-sky-400 bg-sky-50 shadow-sm" : "border-slate-200 bg-white/60 hover:bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${c.tone} flex items-center justify-center shrink-0`}>
                <c.Icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.body}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function GuestContinue({ onClick, label }) {
  const { t } = useI18n();
  return (
    <div className="text-center space-y-1 border-t border-slate-100 pt-4">
      <button type="button" onClick={onClick} className="text-sm text-primary hover:underline font-semibold">
        {label || t("login.guest")}
      </button>
      <p className="text-[11px] text-slate-500 leading-relaxed">{t("login.guest_hint")}</p>
    </div>
  );
}
