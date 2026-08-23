# BizBoost — תשלום בלי שירותי סליקה בתשלום

## עלות בשבילכם: ₪0 קבוע

| אמצעי | עלות לכם | עלות ללקוח | הערות |
|--------|----------|------------|--------|
| **Bit** | 0 | 0 | הכי נוח בישראל |
| **העברה בנקאית** | 0 | 0 | לחוזים / B2B |
| **WhatsApp + ידני** | 0 | 0 | LeadBot שולח הודעה עם סכום |
| **PayPal** | 0 מנוי | ~3% מהעסקה | רק כשמקבלים כסף; ללקוחות חו"ל |
| Stripe / Tranzila | 0 מנוי* | ~2–3% | *אין דמי חודש — רק אחוז; לא חובה |

## זרימה מומלצת

1. לקוח ממלא טופס → **14 יום ניסיון**
2. LeadBot / WhatsApp → "אחרי הניסיון: Bit ל-XXX או העברה"
3. אתם מקבלים כסף **ישירות** — בלי אמצעי
4. מפעילים גישה ידנית (אימייל / לינק)

## עדכון פרטי Bit / בנק

בקובץ `.env.local` (לא commit):

```
VITE_BIZBOOST_BIT_PHONE=050-1234567
VITE_BIZBOOST_BANK_NAME=לאומי
VITE_BIZBOOST_BANK_BRANCH=123
VITE_BIZBOOST_BANK_ACCOUNT=1234567
VITE_BIZBOOST_ACCOUNT_HOLDER=שם מלא
VITE_BIZBOOST_WHATSAPP=972501234567
```

או ערכו `src/bizboost/data/paymentMethods.js` ישירות.
