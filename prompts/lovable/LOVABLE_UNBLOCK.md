# Lovable — תשובה ל«חסר מפתח / LLM / ישויות»

הדביקו את **כל** הקובץ הזה כהודעה ב-Lovable.

אל תבחרו: «העבר ל-Lovable Cloud», «החלף InvokeLLM ל-Lovable AI», או «הוסף API של base44» כתנאי להמשך.  
הקוד הקליני כבר רץ בלי אלה.

---

## 1. מזהה היישום (יש, ציבורי)

```
VITE_BASE44_APP_ID=6a44d05c8195d3fd459fae15
```

אין במאגר אסימון, מפתח API, או `access_token`. אל תחפשו אותם בגיטהאב. אל תמציאו אותם. אל תחסמו את הבנייה בגלל זה.

התחברות Base44 נעשית בדפדפן אצל הרופא (אימייל/גוגל). האסימון מגיע אחרי התחברות, לא מקובץ סביבה.

עד אז: מצב מרפאה מקומי כבר בקוד.

- כפתור: «כניסה למרפאה במחשב זה» ב-`src/pages/Login.jsx` → `enableLocalClinic()`
- לוגיקה: `src/lib/clinic/localMode.js`
- `AuthContext` מדלג על `User.me` במצב מקומי
- מפגשים נשמרים ב-`localStorage` עד שיש Supabase

**מה לבנות:** אל תקראו ל-`base44.auth.me()` כתנאי לפתיחת `/doctorped` או `/parent`. אם אין אסימון — היכנסו למצב מקומי.

**מה לא לבנות:** מסך שמחכה למפתח Base44.

---

## 2. LLM — לא חסר למסלול הקליני הראשי

שולחן הרופא ופורטל ההורים קוראים ל-`runDoctorPedAI` **בסנכרון, בלי רשת**.  
אין צורך ב-`InvokeLLM` כדי שטריאז', רעלים, טראומה, גדילה, תזונה, הפניות ומנועי MedScan יעבדו.

`base44.integrations.Core.InvokeLLM` משמש **רק** לניתוח תמונה (ECG / עור / רדיולוגיה / סריקת מעבדה) דרך `src/lib/medscan/llmAdapter.js`. בלי התחברות Base44 המסלולים האלה נכשלים סגור — וזה נכון.

כללים:

- אל תחליפו ל-Lovable AI
- אל תשתמשו ב-Gemini
- אם יש LLM: Claude בלבד, ורק דרך `llmAdapter.js`
- אל תקראו ל-LLM מדפי UI חדשים
- מספרים קליניים רק מהקוד הדטרמיניסטי

מודלים ב-Base44 (רק אחרי שהרופא מחובר שם):

```
DIAGNOSIS_MODEL=claude_opus_4_8
FAST_MODEL=claude_sonnet_4_6
```

בלי חיבור Base44: כלי התמונה מציגים כשל סגור. שולחן הרופא וההורים נשארים חיים.

---

## 3. ישויות ונתונים — הסכימה במאגר, הרשומות לא

ישויות Base44 **מוגדרות** ב-`base44/entities/*.jsonc`. אין במאגר ייצוא של מטופלים חיים, ואין לייצא PHI לגיטהאב.

| ישות | קובץ |
|---|---|
| User | `base44/entities/User.jsonc` |
| Analysis | `base44/entities/Analysis.jsonc` |
| AnalysisAudit | `base44/entities/AnalysisAudit.jsonc` |
| ECGCase | `base44/entities/ECGCase.jsonc` |
| SkinCase | `base44/entities/SkinCase.jsonc` |
| RadiologyCase | `base44/entities/RadiologyCase.jsonc` |
| GoldStandardCase | `base44/entities/GoldStandardCase.jsonc` |
| Feedback | `base44/entities/Feedback.jsonc` |
| TestRun | `base44/entities/TestRun.jsonc` |
| KnowledgeTopic | `base44/entities/KnowledgeTopic.jsonc` |
| ClinicalRule | `base44/entities/ClinicalRule.jsonc` |
| LabPattern | `base44/entities/LabPattern.jsonc` |
| RedFlag | `base44/entities/RedFlag.jsonc` |
| Association | `base44/entities/Association.jsonc` |
| Protocol | `base44/entities/Protocol.jsonc` |
| DoseRecord | `base44/entities/DoseRecord.jsonc` |
| DrugInteraction | `base44/entities/DrugInteraction.jsonc` |
| ReferenceRange | `base44/entities/ReferenceRange.jsonc` |
| NelsonChapter | `base44/entities/NelsonChapter.jsonc` |

נתונים חיים (מטופלים, מפגשים) = **Supabase**, לא Base44 ולא GitHub.

1. צרו פרויקט Supabase
2. הריצו כמו שהוא: `supabase/doctorped_schema.sql`
3. שימו ב-Lovable Secrets / `.env.local` (לא בגיט):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

הקוד כבר כותב מפגשים: `src/lib/supabase/encounters.js`. בלי env הוא נופל ל-`localStorage`.

ידע קליני מובנה במאגר (טיוטה עד אימות רופא):

- `knowledge/criteria/batch1_criteria_seed.json`
- מנועי `src/lib/medscan/`

אין «ייצוא MedScan מ-Base44» במחשב הזה. אל תמציאו רשומות מטופל. אל תמלאו טבלאות בדוגמאות PHI.

---

## 4. אזהרות React Router

`NavLink` עם `end` ו-`className` ב-`src/components/BottomNav.jsx` הוא תקין ב-React Router v6.  
אל תשנו את זה ל-`<a>`. אם מופיעה אזהרה על `end` על תג `<a>` — זה כי מישהו פיזר props של NavLink על עוגן. תקנו את הפיזור, לא את הניווט.

---

## משתני סביבה — זה כל מה שמותר לכתוב

ב-Lovable Secrets / `.env.local`:

```
VITE_BASE44_APP_ID=6a44d05c8195d3fd459fae15
VITE_LOCAL_CLINIC=true
```

אופציונלי, רק אם יש יישום Base44 מפורסם:

```
VITE_BASE44_APP_BASE_URL=https://YOUR-APP.base44.app
```

אופציונלי, אחרי יצירת Supabase:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

אין `VITE_BASE44_API_KEY` בפרויקט. אל תמציאו שם כזה.

---

## מה לעשות עכשיו (בסדר הזה)

1. לשמור על המסכים והמנועים הקיימים
2. להפעיל מצב מרפאה מקומי בלי אסימון Base44
3. לחבר Supabase לפי `LOVABLE_SUPABASE_LIVE.md` ו-`supabase/doctorped_schema.sql`
4. להשאיר ECG/עור/רדיולוגיה כפי שהם — נכשלים סגור בלי Base44 מחובר
5. `npm test` ו-`npm run build`

אסור: Gemini, Lovable AI כמנוע קליני, מינונים מהזיכרון, שמירת מטופלים בגיטהאב.
