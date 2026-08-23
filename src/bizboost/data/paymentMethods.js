/**
 * BizBoost — אמצעי תשלום ללא עלות חודשית (Bit, העברה, PayPal אופציונלי)
 * עדכנו את הפרטים שלכם כאן או דרך env (ראו README ב-marketing).
 */

export const FREE_PAYMENT_CONFIG = {
  /** Bit — חינם, ללא עמלות לרוב המשתמשים */
  bit: {
    enabled: true,
    labelHe: 'Bit',
    phone: import.meta.env.VITE_BIZBOOST_BIT_PHONE || '052-888-5800',
    noteHe: 'שלחו Bit ל-052-888-5800 עם שם העסק + החבילה (למשל "BizBoost Growth").',
  },
  /** העברה בנקאית — ללא עלות */
  bank: {
    enabled: true,
    labelHe: 'העברה בנקאית',
    bankName: import.meta.env.VITE_BIZBOOST_BANK_NAME || 'בנק הפועלים',
    branch: import.meta.env.VITE_BIZBOOST_BANK_BRANCH || '666 (באקה)',
    account: import.meta.env.VITE_BIZBOOST_BANK_ACCOUNT || '422494',
    accountHolder: import.meta.env.VITE_BIZBOOST_ACCOUNT_HOLDER || 'אבו מוח סאמר',
    noteHe: 'בהערות: שם העסק + אימייל + החבילה (למשל BizBoost Growth).',
  },
  /** PayPal — אין דמי מנוי; עמלה רק כשמקבלים כסף (~3%) */
  paypal: {
    enabled: Boolean(import.meta.env.VITE_BIZBOOST_PAYPAL_ME),
    labelHe: 'PayPal',
    meUrl: import.meta.env.VITE_BIZBOOST_PAYPAL_ME || '',
    noteHe: 'מתאים ללקוחות מחו"ל. עמלה רק על סכום ששולם.',
  },
  /** WhatsApp — סגירת עסקה ידנית */
  whatsapp: {
    enabled: true,
    phone: import.meta.env.VITE_BIZBOOST_WHATSAPP || '972528885800',
    noteHe: 'אחרי טופס — נשלח הודעה עם סכום ואיך לשלם.',
  },
  trialDays: 14,
  /** אין Stripe / Tranzila — אפס עלות קבועה */
  noPaidGateway: true,
};

export function bitPhoneDigits() {
  return FREE_PAYMENT_CONFIG.bit.phone.replace(/\D/g, '');
}

export function whatsappPaymentMessage({ name, business, planLabel, amount }) {
  return encodeURIComponent(
    `שלום, אני ${name} מ-${business}. בחרתי ${planLabel}${amount ? ` (${amount})` : ''}. ` +
      `אשמח לפרטי תשלום — Bit ל-052-888-5800 או העברה.`,
  );
}

export function activePaymentMethods() {
  const c = FREE_PAYMENT_CONFIG;
  return [
    c.bit.enabled && { id: 'bit', ...c.bit },
    c.bank.enabled && { id: 'bank', ...c.bank },
    c.paypal.enabled && c.paypal.meUrl && { id: 'paypal', ...c.paypal },
    c.whatsapp.enabled && { id: 'whatsapp', ...c.whatsapp },
  ].filter(Boolean);
}
