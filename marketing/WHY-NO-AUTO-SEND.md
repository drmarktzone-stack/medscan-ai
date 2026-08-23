# למה אין בוט ששולח במקומך מהענן

מספר: **052-888-5800** · מייל: **drmarktzone@gmail.com**

## מה ביקשת
לשלוח מיילים / בוט WhatsApp במקומך מהמספר והמייל שלך.

## למה הסוכן לא יכול
| ערוץ | חסם |
|------|------|
| WhatsApp | אין גישה לטלפון שלך / אין Meta Business API token בענן |
| Gmail | אין App Password / OAuth — אסור (וגם לא כדאי) להדביק סיסמה בצ'אט |

## מה כן אפשר
1. **מרכז מכירות** `/bizboost/outreach` — לחיצה → WhatsApp נפתח **אצלך**
2. **סקריפט מייל** `scripts/bizboost-send-email.mjs` — רץ **על המחשב שלך** אחרי App Password ב-`.env.local`
3. **WhatsApp Business API** — אתה נרשם ב-Meta, שם token ב-env, רק אז אפשר אוטומציה

## איך להפעיל מייל (אתה, מקומית)
1. Google Account → אבטחה → אימות דו-שלבי → סיסמאות לאפליקציות
2. צור סיסמה ל-Mail
3. ב-`.env.local` (לא commit):
   ```
   GMAIL_USER=drmarktzone@gmail.com
   GMAIL_APP_PASSWORD=xxxx
   ```
4. `node scripts/bizboost-send-email.mjs --dry-run`
5. אחרי בדיקה: `--send --limit=5`

**אל תשלח את ה-App Password לצ'אט.**
