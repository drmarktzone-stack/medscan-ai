import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2, AlertTriangle, Loader2, User, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";

const languages = [
  { code: "he", label: "עברית" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

export default function AccountSettings({ open, onOpenChange }) {
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("main");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setStep("main");
      setError(null);
      setBusy(false);
      base44.auth.me().then(setUser).catch(() => {});
    }
  }, [open]);

  const handleLogout = () => base44.auth.logout("/");

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      if (user?.id) {
        await base44.entities.User.delete(user.id);
      }
      await base44.auth.logout("/login");
    } catch (err) {
      setError(t("settings.delete_error"));
      setBusy(false);
      setTimeout(() => base44.auth.logout("/login"), 2500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        {step === "main" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> {t("settings.title")}
              </DialogTitle>
              <DialogDescription>
                {user?.email ? t("settings.connected_as", { email: user.email }) : t("settings.default_desc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
              {/* Language */}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> {t("settings.language")}
                </p>
                <div className="flex gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                        l.code === lang
                          ? "bg-primary text-primary-foreground"
                          : "bg-white border border-slate-200 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl">
                <LogOut className="w-4 h-4" /> {t("settings.logout")}
              </Button>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">{t("settings.delete_desc")}</p>
                <Button onClick={() => setStep("confirm")} variant="destructive" className="w-full h-11 rounded-xl">
                  <Trash2 className="w-4 h-4" /> {t("settings.delete_btn")}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" /> {t("settings.confirm_title")}
              </DialogTitle>
              <DialogDescription>{t("settings.confirm_desc")}</DialogDescription>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{t("settings.confirm_warning")}</p>
            </div>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}

            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button onClick={() => setStep("main")} variant="outline" className="flex-1 h-11 rounded-xl" disabled={busy}>
                {t("settings.cancel")}
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="flex-1 h-11 rounded-xl" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {busy ? t("settings.deleting") : t("settings.delete_forever")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}