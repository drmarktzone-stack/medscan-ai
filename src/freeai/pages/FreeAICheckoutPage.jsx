import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import {
  getAvailableMethods, getPaymentConfig,
  buildPaymentConfirmWhatsApp, getSetupInstructions,
  PAYMENT_METHODS, getBitOpenUrl, formatBitPhone,
} from "@/freeai/lib/paymentConfig.js";
import { activatePro } from "@/freeai/lib/subscription.js";
import { R } from "@/freeai/lib/routes.js";
import { useI18n } from "@/lib/i18n";
import {
  CreditCard, CheckCircle2, Crown, ArrowRight,
  MessageCircle, ExternalLink,
} from "lucide-react";

export default function FreeAICheckoutPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const [email, setEmail] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [step, setStep] = useState("choose");
  const [copied, setCopied] = useState(false);
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill?.includes("@")) setEmail(prefill);
  }, [searchParams]);

  const methods = getAvailableMethods();
  const cfg = getPaymentConfig();
  const setup = getSetupInstructions(locale);
  const cardMethods = methods.filter((m) => m.id === "stripe" || m.id === "paypal");

  React.useEffect(() => {
    if (searchParams.get("success") === "true" && email) {
      activatePro({ email, paymentRef: "stripe" });
      setStep("done");
    }
  }, [searchParams, email]);

  const handlePay = (method) => {
    if (!email.includes("@")) return;
    setSelectedMethod(method);

    if (method.id === "stripe" && method.url) {
      const url = method.url.includes("?")
        ? `${method.url}&prefilled_email=${encodeURIComponent(email)}`
        : `${method.url}?prefilled_email=${encodeURIComponent(email)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setStep("confirm");
      return;
    }

    if (method.id === "paypal" && method.url) {
      window.open(method.url, "_blank", "noopener,noreferrer");
      setStep("confirm");
    }
  };

  const handleConfirmPaid = () => {
    activatePro({ email, paymentRef: selectedMethod?.id || "bit" });
    setStep("done");
  };

  const copyBitPhone = () => {
    navigator.clipboard?.writeText(cfg.bitPhone || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsAppConfirm = () => {
    setSelectedMethod(PAYMENT_METHODS.whatsapp);
    const wa = buildPaymentConfirmWhatsApp(email);
    if (wa) {
      window.open(wa, "_blank", "noopener,noreferrer");
      setStep("confirm");
    }
  };

  return (
    <FreeAILayout>
      <div className="max-w-lg mx-auto py-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {locale === "he" ? "שדרוג ל-Pro" : "Upgrade to Pro"}
          </h1>
          <div className="text-4xl font-black text-violet-400 mt-2">
            ₪20<span className="text-lg text-white/50">/{locale === "he" ? "חודש" : "mo"}</span>
          </div>
        </div>

        {step === "done" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-emerald-300 mb-2">
              {locale === "he" ? "Pro הופעל!" : "Pro activated!"}
            </h2>
            <p className="text-emerald-400/80 text-sm mb-4">
              {locale === "he" ? "יש לך גישה מלאה לכל היכולות" : "You have full access"}
            </p>
            <Link to={R.create} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold">
              {locale === "he" ? "התחל ליצור" : "Start creating"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {step !== "done" && (
          <>
            <div className="mb-6">
              <label className="text-sm text-white/60 mb-2 block">
                {locale === "he" ? "מייל (לאישור Pro)" : "Email (for Pro activation)"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl bg-black/40 border border-white/15 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                dir="ltr"
              />
            </div>

            {step === "choose" && (
              <>
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-4 mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    🟣 {locale === "he" ? "תשלום ב-Bit — ₪20" : "Pay with Bit — ₪20"}
                  </h3>
                  <ol className="space-y-3 text-sm text-white/70">
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold">1.</span>
                      {locale === "he" ? "פתח Bit ושלח ₪20 ל:" : "Open Bit and send ₪20 to:"}
                    </li>
                    <li className="flex items-center justify-center gap-3 py-1">
                      <code className="text-2xl font-black text-violet-300 tracking-wide" dir="ltr">
                        {cfg.bitPhoneFormatted || formatBitPhone(cfg.bitPhone)}
                      </code>
                      <button type="button" onClick={copyBitPhone} className="text-xs text-violet-400 px-2 py-1 rounded border border-violet-500/30">
                        {copied ? "✓" : "Copy"}
                      </button>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-violet-400 font-bold">2.</span>
                      {locale === "he" ? "שלח אישור ב-WhatsApp — נפעיל Pro תוך שעה" : "Confirm via WhatsApp — Pro within 1 hour"}
                    </li>
                  </ol>
                  <a
                    href={getBitOpenUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-center"
                  >
                    {locale === "he" ? "פתח Bit" : "Open Bit"}
                  </a>
                  <button
                    type="button"
                    disabled={!email.includes("@")}
                    onClick={openWhatsAppConfirm}
                    className="w-full py-3 rounded-xl bg-green-600 text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {locale === "he" ? "שלחתי ב-Bit — שלח אישור ב-WhatsApp" : "I paid — confirm via WhatsApp"}
                  </button>
                </div>

                {cardMethods.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-white/60">
                      {locale === "he" ? "או בחר אמצעי תשלום אחר:" : "Or choose another method:"}
                    </p>
                    {cardMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        disabled={!email.includes("@")}
                        onClick={() => handlePay(method)}
                        className={`w-full text-right rounded-2xl border p-4 transition-all disabled:opacity-40 hover:border-violet-500/40 ${
                          method.recommended ? "border-violet-500/30 bg-violet-500/5" : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{locale === "he" ? method.nameHe : method.nameEn}</span>
                              {method.recommended && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600 text-white">
                                  {locale === "he" ? "מומלץ" : "Recommended"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 mt-0.5">{locale === "he" ? method.descHe : method.descEn}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-white/30" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <summary className="text-sm font-bold text-white/60 cursor-pointer">
                    {locale === "he" ? "🔧 הוספת Stripe (אופציונלי)" : "🔧 Add Stripe (optional)"}
                  </summary>
                  <ol className="mt-3 space-y-2">
                    {setup.steps.map((s) => (
                      <li key={s.n} className="text-xs text-white/50">
                        <span className="text-violet-400 font-bold">{s.n}.</span> {s.text}
                      </li>
                    ))}
                  </ol>
                </details>

                <p className="text-center text-xs text-white/30 mt-4">
                  <Link to={R.create} className="text-violet-400 hover:text-violet-300">
                    {locale === "he" ? "← המשך בחינם" : "← Continue free"}
                  </Link>
                </p>
              </>
            )}

            {step === "confirm" && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
                <CreditCard className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-2">
                  {locale === "he" ? "קיבלנו את הבקשה!" : "Request received!"}
                </h3>
                <p className="text-sm text-white/60 mb-4">
                  {locale === "he"
                    ? "אחרי אישור התשלום ב-WhatsApp — Pro יופעל. אפשר גם ללחוץ למטה אם כבר אישרנו."
                    : "After WhatsApp confirmation — Pro will activate. Or click below if already confirmed."}
                </p>
                <p className="text-xs text-white/40 mb-4" dir="ltr">{email}</p>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold mb-2"
                >
                  {locale === "he" ? "✓ שילמתי — הפעל Pro" : "✓ I paid — activate Pro"}
                </button>
                <button type="button" onClick={() => setStep("choose")} className="text-xs text-white/40 hover:text-white/60">
                  {locale === "he" ? "← חזור" : "← Back"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </FreeAILayout>
  );
}
