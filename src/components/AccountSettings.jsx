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
import { LogOut, Trash2, AlertTriangle, Loader2, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AccountSettings({ open, onOpenChange }) {
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
      setError("לא ניתן היה למחוק את החשבון ישירות. התנתקנו מהחשבון — למחיקת הנתונים לצמיתות יש לפנות לתמיכת Base44.");
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
                <User className="w-4 h-4 text-primary" /> הגדרות חשבון
              </DialogTitle>
              <DialogDescription>
                {user?.email ? `מחובר כ-${user.email}` : "ניהול החשבון והפרטיות שלך"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-1">
              <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl">
                <LogOut className="w-4 h-4" /> התנתק מהחשבון
              </Button>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  מחיקת החשבון תסיר לצמיתות את כל הנתונים שלך ואת כל הניתוחים שבוצעו. פעולה זו אינה הפיכה.
                </p>
                <Button
                  onClick={() => setStep("confirm")}
                  variant="destructive"
                  className="w-full h-11 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" /> מחק חשבון
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" /> אישור מחיקת חשבון
              </DialogTitle>
              <DialogDescription>
                פעולה זו תמחק את חשבונך ואת כל הנתונים המשויכים אליו לצמיתות. לא ניתן לשחזר.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">
                ודא שברצונך למחוק את החשבון. כל הניתוחים, ההיסטוריה וההגדרות יימחקו לצמיתות.
              </p>
            </div>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}

            <DialogFooter className="flex-row gap-2 sm:space-x-0">
              <Button
                onClick={() => setStep("main")}
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                disabled={busy}
              >
                ביטול
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 h-11 rounded-xl"
                disabled={busy}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {busy ? "מוחק..." : "מחק לצמיתות"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}