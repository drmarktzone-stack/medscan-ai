import React, { useState, useCallback } from "react";
import { Key, CheckCircle2, AlertTriangle, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { SETUP_PROVIDERS, verifyAndSaveKey, aiReadiness } from "../lib/aiSetup.js";
import { preloadPuter } from "../lib/chatEngine.js";
import { pickL } from "../kids/lib/locale.js";

const COPY = {
  title: {
    he: "הפעלת ה-AI — פעם אחת, שתי דקות",
    en: "Turn on the AI — once, two minutes",
    ar: "تشغيل الذكاء الاصطناعي",
  },
  why: {
    he: "בלי מפתח, הצ'אט והשיעורים מציגים תוכן מקומי בלבד. עם מפתח חינמי הכול עובד באמת.",
    en: "Without a key, chat and lessons show local content only. A free key makes everything work for real.",
    ar: "بدون مفتاح، يعرض التطبيق محتوى محليًا فقط.",
  },
  step1: { he: "פתח/י את הקישור וצור/י מפתח", en: "Open the link and create a key", ar: "أنشئ مفتاحًا" },
  step2: { he: "העתק/י והדבק/י כאן", en: "Copy it and paste it here", ar: "الصقه هنا" },
  save: { he: "בדוק ושמור", en: "Check & save", ar: "تحقق واحفظ" },
  checking: { he: "בודק מול השרת...", en: "Checking with the provider...", ar: "جارٍ التحقق..." },
  connected: { he: "מחובר — ה-AI פעיל", en: "Connected — AI is live", ar: "متصل" },
  stored: {
    he: "המפתח נשמר בדפדפן הזה בלבד ולא נשלח לשום מקום מלבד הספק.",
    en: "The key is stored in this browser only and goes nowhere but the provider.",
    ar: "يُحفظ المفتاح في هذا المتصفح فقط.",
  },
  puterTitle: { he: "או: התחברות חינמית ל-Puter", en: "Or: free Puter sign-in", ar: "أو Puter" },
  puterBody: {
    he: "בלי מפתח — נפתח חלון התחברות חינמי בפעם הראשונה שתשאל/י שאלה.",
    en: "No key needed — a free sign-in window opens the first time you ask something.",
    ar: "بدون مفتاح.",
  },
};

const ERRORS = {
  empty: { he: "לא הודבק מפתח", en: "No key pasted", ar: "لا يوجد مفتاح" },
  bad_key: { he: "המפתח נדחה — בדוק/י שהעתקת אותו במלואו", en: "Key rejected — check you copied all of it", ar: "مفتاح مرفوض" },
  rate_limited: { he: "המפתח תקין אך חרג ממכסה כרגע — נסה/י שוב מאוחר יותר", en: "Key is valid but rate limited — try again later", ar: "تجاوز الحصة" },
  timeout: { he: "אין תגובה מהספק — בדוק/י חיבור לאינטרנט", en: "No response from the provider — check your connection", ar: "لا استجابة" },
  unreachable: { he: "לא ניתן להגיע לספק מהרשת הזו", en: "Cannot reach the provider from this network", ar: "تعذر الوصول" },
  provider_error: { he: "הספק החזיר שגיאה", en: "The provider returned an error", ar: "خطأ من المزود" },
};

/**
 * One place to make the AI answer for real.
 *
 * Keys are verified against the live API before being saved, so "saved" always
 * means "working" — a revoked or mistyped key never looks connected.
 */
export default function AISetupPanel({ lang = "he", tone = "dark", onConnected }) {
  const [readiness, setReadiness] = useState(() => aiReadiness());
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState(null);

  const submit = useCallback(async (providerId) => {
    setBusyId(providerId);
    setResult(null);
    const outcome = await verifyAndSaveKey(providerId, drafts[providerId] || "");
    setBusyId(null);
    setResult({ providerId, ...outcome });
    if (outcome.ok) {
      setDrafts((d) => ({ ...d, [providerId]: "" }));
      const next = aiReadiness();
      setReadiness(next);
      onConnected?.(next);
    }
  }, [drafts, onConnected]);

  const cardClass = tone === "kids"
    ? "kids-glass-card p-5 space-y-4"
    : "fa-surface-raised p-5 space-y-4";

  if (readiness.mode === "key") {
    return (
      <div className={cardClass}>
        <p className="flex items-center gap-2 font-bold text-emerald-300">
          <CheckCircle2 className="w-5 h-5" />
          {pickL(COPY.connected, lang)}
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
        <div>
          <h2 className="font-black text-lg leading-tight">{pickL(COPY.title, lang)}</h2>
          <p className="text-sm opacity-80 mt-1">{pickL(COPY.why, lang)}</p>
        </div>
      </div>

      {SETUP_PROVIDERS.map((provider) => {
        const busy = busyId === provider.id;
        const failed = result && result.providerId === provider.id && !result.ok;

        return (
          <div key={provider.id} className="rounded-xl bg-black/20 border border-white/10 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold">{pickL(provider.name, lang)}</p>
                <p className="text-xs opacity-70">{pickL(provider.blurb, lang)}</p>
              </div>
              <a
                href={provider.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-bold underline text-amber-200 shrink-0"
              >
                {pickL(COPY.step1, lang)} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={drafts[provider.id] || ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [provider.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") submit(provider.id); }}
                placeholder={`${provider.prefix}…`}
                aria-label={`${pickL(provider.name, lang)} API key`}
                className="flex-1 min-w-0 rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => submit(provider.id)}
                disabled={busy || !(drafts[provider.id] || "").trim()}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold disabled:opacity-40"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {busy ? pickL(COPY.checking, lang) : pickL(COPY.save, lang)}
              </button>
            </div>

            {failed && (
              <p className="flex items-start gap-1.5 text-sm text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {pickL(ERRORS[result.reason] || ERRORS.provider_error, lang)}
                {result.status ? ` (${result.status})` : ""}
              </p>
            )}
          </div>
        );
      })}

      <p className="text-xs opacity-60">{pickL(COPY.stored, lang)}</p>

      <div className="rounded-xl bg-black/20 border border-white/10 p-4 space-y-2">
        <p className="font-bold text-sm">{pickL(COPY.puterTitle, lang)}</p>
        <p className="text-xs opacity-70">{pickL(COPY.puterBody, lang)}</p>
        <button
          type="button"
          onClick={() => preloadPuter().then(() => setReadiness(aiReadiness()))}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-bold"
        >
          Puter
        </button>
      </div>
    </div>
  );
}
