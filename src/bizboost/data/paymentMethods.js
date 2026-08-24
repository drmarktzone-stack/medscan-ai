/**
 * BizBoost — אמצעי תשלום ללא עלות חודשית (Bit, העברה, PayPal אופציונלי)
 */

function env(key, fallback) {
  try {
    const v = import.meta?.env?.[key];
    if (v) return v;
  } catch {
    /* node / no vite */
  }
  return fallback;
}

export const FREE_PAYMENT_CONFIG = {
  bit: {
    enabled: true,
    labelHe: 'Bit',
    phone: env('VITE_BIZBOOST_BIT_PHONE', '052-888-5800'),
    noteHe: 'שלחו Bit ל-052-888-5800 עם שם העסק + החבילה (למשל "BizBoost Growth").',
  },
  bank: {
    enabled: true,
    labelHe: 'העברה בנקאית',
    bankName: env('VITE_BIZBOOST_BANK_NAME', 'בנק הפועלים'),
    branch: env('VITE_BIZBOOST_BANK_BRANCH', '666 (באקה)'),
    account: env('VITE_BIZBOOST_BANK_ACCOUNT', '422494'),
    accountHolder: env('VITE_BIZBOOST_ACCOUNT_HOLDER', 'אבו מוח סאמר'),
    noteHe: 'בהערות: שם העסק + אימייל + החבילה (למשל BizBoost Growth).',
  },
  paypal: {
    enabled: Boolean(env('VITE_BIZBOOST_PAYPAL_ME', '')),
    labelHe: 'PayPal',
    meUrl: env('VITE_BIZBOOST_PAYPAL_ME', ''),
    noteHe: 'מתאים ללקוחות מחו"ל. עמלה רק על סכום ששולם.',
  },
  whatsapp: {
    enabled: true,
    phone: env('VITE_BIZBOOST_WHATSAPP', '972528885800'),
    noteHe: 'אחרי טופס — נשלח הודעה עם סכום ואיך לשלם.',
  },
  trialDays: 14,
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
