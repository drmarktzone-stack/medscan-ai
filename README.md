# MedScan / DoctorPedAI

יישום תמיכה בהחלטות לקהילת ילדים. **אין אבחנה סופית.** Claude בלבד אם יש מנוע ראייה. מספרים קליניים מגיעים מהקוד הדטרמיניסטי.

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
