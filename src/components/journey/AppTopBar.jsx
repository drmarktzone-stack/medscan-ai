import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, LogIn, UserPlus } from "lucide-react";
import AccountSettings from "@/components/AccountSettings";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";

/** Shared top bar for hub pages — language, account, settings. */
export default function AppTopBar() {
  const { t } = useI18n();
  const { user, isLocalClinic } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showAuthLinks = isLocalClinic || !user?.email;

  return (
    <>
      <div className="clinic-wrap flex items-center justify-between gap-2 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="clinic-card px-3 py-1.5">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-2">
          {showAuthLinks ? (
            <>
              <Link
                to="/login"
                className="clinic-card text-xs text-slate-600 hover:text-foreground flex items-center gap-1.5 px-3 py-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t("login.title")}</span>
              </Link>
              <Link
                to="/register"
                className="clinic-card text-xs font-bold text-primary hover:text-sky-800 flex items-center gap-1.5 px-3 py-2"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("register.title")}</span>
              </Link>
            </>
          ) : (
            <span className="clinic-card text-xs text-slate-600 px-3 py-2 truncate max-w-[160px]">
              {user.email}
            </span>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="clinic-card text-xs text-slate-600 hover:text-foreground flex items-center gap-1.5 px-3 py-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t("home.settings")}</span>
          </button>
        </div>
      </div>
      <AccountSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
