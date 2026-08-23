import React from 'react';
import { FREE_PAYMENT_CONFIG, activePaymentMethods, whatsappPaymentMessage } from '@/bizboost/data/paymentMethods';
import { Smartphone, Building2, MessageCircle } from 'lucide-react';

export default function PaymentInstructions({ planLabel, amount, customerName, businessName, compact }) {
  const methods = activePaymentMethods();
  const waMsg = whatsappPaymentMessage({
    name: customerName || 'לקוח',
    business: businessName || 'העסק',
    planLabel: planLabel || 'BizBoost',
    amount: amount ? `₪${amount}/חודש` : '',
  });
  const waPhone = FREE_PAYMENT_CONFIG.whatsapp.phone.replace(/\D/g, '');

  if (compact) {
    return (
      <div className="text-sm text-white/70 space-y-2">
        <p className="font-medium text-white">תשלום — ללא דמי מנוי לשירותי סליקה:</p>
        <ul className="list-disc list-inside space-y-1">
          {FREE_PAYMENT_CONFIG.bit.enabled && <li>Bit ל-{FREE_PAYMENT_CONFIG.bit.phone}</li>}
          {FREE_PAYMENT_CONFIG.bank.enabled && <li>העברה בנקאית (פרטים אחרי הרשמה)</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right">
      <p className="text-emerald-400 font-medium">
        ✓ {FREE_PAYMENT_CONFIG.trialDays} יום ניסיון חינם — אחר כך תשלום בדרכים הבאות (בחינם בשבילכם):
      </p>

      {FREE_PAYMENT_CONFIG.bit.enabled && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex gap-3">
          <Smartphone className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Bit</div>
            <div className="text-lg font-mono my-1" dir="ltr">{FREE_PAYMENT_CONFIG.bit.phone}</div>
            <p className="text-xs text-white/60">{FREE_PAYMENT_CONFIG.bit.noteHe}</p>
            {planLabel && amount && (
              <p className="text-sm mt-2 text-violet-300">סכום: ₪{amount}/חודש · {planLabel}</p>
            )}
          </div>
        </div>
      )}

      {FREE_PAYMENT_CONFIG.bank.enabled && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex gap-3">
          <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <div className="font-bold">העברה בנקאית</div>
            <div>{FREE_PAYMENT_CONFIG.bank.bankName} · סניף {FREE_PAYMENT_CONFIG.bank.branch}</div>
            <div className="font-mono" dir="ltr">ח-ן {FREE_PAYMENT_CONFIG.bank.account}</div>
            <div>בעל החשבון: {FREE_PAYMENT_CONFIG.bank.accountHolder}</div>
            <p className="text-xs text-white/60 pt-1">{FREE_PAYMENT_CONFIG.bank.noteHe}</p>
          </div>
        </div>
      )}

      {methods.find((m) => m.id === 'paypal') && (
        <a
          href={FREE_PAYMENT_CONFIG.paypal.meUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-white/10 bg-white/5 p-4 text-sm hover:bg-white/10"
        >
          PayPal — {FREE_PAYMENT_CONFIG.paypal.noteHe}
        </a>
      )}

      {FREE_PAYMENT_CONFIG.whatsapp.enabled && (
        <a
          href={`https://wa.me/${waPhone}?text=${waMsg}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 font-semibold"
        >
          <MessageCircle className="w-5 h-5" />
          שלחו WhatsApp — נאשר ונשלח פרטי תשלום
        </a>
      )}

      <p className="text-xs text-white/50 text-center">
        אין Stripe / Tranzila — אפס עלות קבועה. אתם מקבלים כסף ישירות ל-Bit או לבנק.
      </p>
    </div>
  );
}
