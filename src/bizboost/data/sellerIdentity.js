/**
 * פרטי מוכר BizBoost — סאמר
 * שליחה אוטומטית דורשת מפתחות (לא נשלחים מהצ'אט).
 */

function env(key, fallback) {
  try {
    const v = import.meta?.env?.[key];
    if (v) return v;
  } catch {
    /* node */
  }
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  return fallback;
}

export const SELLER = {
  nameHe: env('VITE_BIZBOOST_SELLER_NAME', 'סאמר אבו מוח'),
  phoneDisplay: env('VITE_BIZBOOST_BIT_PHONE', '052-888-5800'),
  phoneDigits: '0528885800',
  whatsappIntl: env('VITE_BIZBOOST_WHATSAPP', '972528885800'),
  email: env('VITE_BIZBOOST_SELLER_EMAIL', 'drmarktzone@gmail.com'),
  bank: {
    bankName: 'בנק הפועלים',
    branch: '666 (באקה)',
    account: '422494',
    accountHolder: 'אבו מוח סאמר',
  },
};

/**
 * למה אין "בוט שולח במקומך" בלי הגדרה:
 * - WhatsApp: צריך WhatsApp Business Cloud API + Meta token (או Evolution/Baileys על הטלפון שלך)
 * - Gmail: צריך App Password / OAuth — לא את הסיסמה הרגילה בצ'אט
 */
export const AUTO_SEND_REQUIREMENTS = {
  gmail: [
    'הפעלת אימות דו-שלבי ב-Google',
    'יצירת App Password ל-"Mail"',
    'הגדרה ב-.env: GMAIL_USER=drmarktzone@gmail.com GMAIL_APP_PASSWORD=xxxx',
    'הרצה: node scripts/bizboost-send-email.mjs --dry-run ואז בלי dry-run',
  ],
  whatsapp: [
    'חשבון Meta Business + WhatsApp Business API',
    'או התקנת שרת על המחשב שלך שמחובר לטלפון (לא מהענן של Cursor)',
    'Token ב-.env — לא נשלח אוטומטית מהסוכן',
  ],
};
