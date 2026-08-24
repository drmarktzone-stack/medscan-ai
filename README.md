# MedScan / DoctorPedAI

יישום תמיכה בהחלטות לקהילת ילדים. **אין אבחנה סופית.** Claude בלבד אם יש מנוע ראייה. מספרים קליניים מגיעים מהקוד הדטרמיניסטי.

> **WeiChat** (מessenger super-app) הוא פרויקט **נפרד** בתיקייה [`wechat-app/`](wechat-app/README.md) — לא חלק מ-MedScan.

## הפעלה בלי Base44 (מומלץ — בלי קרדיט)

האתר ב-Base44 תלוי בקרדיט לאירוח ולקריאות Claude. המסלול העצמאי הוא אתר סטטי:

- כלי הטקסט (רעלים, טראומה, גדילה, תזונה, שולחן רופא, הורים) רצים **בחינם במכשיר**.
- נתוני מטופל נשמרים ב-`localStorage` במחשב זה.
- פענוח צילום (רנטגן / ECG / עור) **נכשל סגור** בלי מנוע ראייה בתשלום — לא ממציאים פענוח.

### בנייה מקומית

```bash
npm install
npm run build:standalone
npm run preview:standalone
```

### אירוח חינמי

1. **GitHub Pages** — אחרי מיזוג ל-`main`, הפעילו Pages: Settings → Pages → GitHub Actions. הכתובת תהיה:
   `https://<user>.github.io/medscan-ai/`
2. **Netlify** — New site from Git, build `npm run build:standalone`, publish `dist`. יש `_redirects` ל-SPA.
3. **Cloudflare Pages / Vercel** — אותה פקודת בנייה. ב-Vercel יש `vercel.json`.

דומיין מותאם (למשל `medscan.example.com`) מחובר אצל הספק החינמי, לא אצל Base44.

## חנות גוגל (Play)

האתר באוויר זה לא אפליקציה בחנות.

**מדריך מלא באפליקציה:** `/launch` (גם `/privacy`, `/pricing`).

### אימייל וסיסמה (standalone)

1. צרו פרויקט חינמי ב-[Supabase](https://supabase.com).
2. העתיקו `env.standalone.example` → `.env.standalone` והוסיפו `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY`.
3. ב-Supabase Auth → URL Configuration: הוסיפו `https://your-domain/.../reset-password`.
4. `npm run build:standalone` — התחברות/הרשמה עם אימייל פועלים בלי Base44.

בלי Supabase — אפשר להמשיך כאורח במחשב (localStorage).

### TWA / Play Store

היום בטלפון אנדרואיד:

1. פתחו כרום.
2. היכנסו לאתר החי.
3. תפריט → הוספה למסך הבית.

לחנות פליי עצמה צריך חשבון מפתח שלכם (תשלום חד־פעמי לגוגל), מדיניות פרטיות בכתובת ציבורית, דירוג תוכן רפואי, ואז עטיפת האתר כקובץ אנדרואיד ב־[PWABuilder](https://www.pwabuilder.com/). ההעלאה היא ידנית בקונסולת פליי. אי אפשר להעלות מהצ'אט.

לעטיפת TWA נדרש גם קובץ אימות בכתובת האתר. ב־GitHub Pages של פרויקט זה עדיף דומיין מותאם, כי גוגל מחפש את קובץ האימות בשורש הדומיין.

## Base44 (אופציונלי, בתשלום)

רק אם יש קרדיט ורוצים פענוח תמונה דרך Claude של Base44:

```bash
npm install
base44 dev
```

או frontend מול השרת המארח:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
npm run dev
```

פרסום חזרה ל-Base44: `base44 dashboard open`.
