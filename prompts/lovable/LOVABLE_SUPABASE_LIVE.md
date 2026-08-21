# Lovable — החלק שלך בלבד

הדביקו את **כל** הקובץ הזה כפרומפט ב-Lovable.

אל תכתבו מחדש מנועים קליניים. אל תשמרו מטופלים ב-GitHub.  
הקוד הקליני והמסכים כבר קיימים בפרויקט. **החלק של Lovable הוא להפוך את היישום לחי: Supabase + Auth + RLS + ליטוש מוצר.**

---

## מה כבר בנוי (אל תיגעו במוח)

DoctorPedAI — הרופא החכם. MedScan הוא המנוע בפנים.

כבר קיימים ופועלים במסכים:

- שולחן רופא `/doctorped` (אנמנזה פעילה, טריאז', דיפרנציאל, רכבת כלים)
- פורטל הורים `/parent` (תסמינים, שלוש רמות דחיפות, בלי מ״ג)
- כלים: `/ecg` `/skin` `/radiology` `/labs` `/patient-context` `/protocols` `/differential`
- כלים חדשים: `/tox` `/trauma` `/growth` `/nutrition` `/neurodev` `/chronic` `/syndromes` `/metabolic` `/genetics` `/csf` `/us` `/eeg` `/audio` `/referrals`
- שמירת מפגש: `persistDoctorPedEncounter` ב-`src/lib/supabase/encounters.js`
- עותק הורה מנוקה ממינון: `sanitizeParentEncounterRow`
- סכימה + RLS: `supabase/doctorped_schema.sql`

כל מספר קליני מגיע מהקוד (`runDoctorPedAI`, `runToxicologyEngine`, וכו'). Lovable **לא** ממציא מינונים, ספי מעבדה, לוח חיסונים, או אבחנות.

---

## מה אתם בונים עכשיו (רק זה)

### 1. פרויקט Supabase חי
צרו פרויקט Supabase ליישום. הריצו את SQL מ-`supabase/doctorped_schema.sql` כמו שהוא.

טבלאות: `patients`, `encounters`, `questionnaire_responses`, `dose_records`.

### 2. משתני סביבה (לא סודות בגיט)
ב-Lovable / `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

אחרי זה `persistDoctorPedEncounter` ו-`listEncounters` עוברים מ-localStorage ל-Supabase בלי לשנות מנועים.  
אם תרצו `@supabase/supabase-js` במקום REST ב-`src/lib/supabase/client.js` — מותר, כל עוד שמות הטבלאות וה-sanitize נשארים.

### 3. Auth לפי תפקיד
שני תפקידים ב-JWT claim `app_role`:

- `clinician` — רואה מפגשי רופא כולל דיפרנציאל מקצועי
- `parent` — רואה רק שורות `rls_role='parent'` (בלי מ״ג, בלי dosing)

מסך כניסה: בחירת «רופא» / «הורה» לפני או אחרי login.  
הורה שמנסה `/doctorped` → הפניה ל-`/parent`.  
רופא יכול את שניהם.

אל תשמרו מספרי מינון בעותק ההורה. הקוד כבר מסנן; RLS חייב לאכוף גם בשרת.

### 4. חיבור אמיתי למסכים הקיימים
אל תבנו דפי כלים חדשים במקום הקיימים. חברו:

- אחרי `runDoctorPedAI` מוצלח — ודאו שהמפגש נכתב ל-Supabase (הקריאה כבר בקוד; תתקנו רק אם חסר session user / JWT)
- היסטוריה `/history` — מפגשי DoctorPed מ-Supabase + ניתוחי ECG/עור/רדיולוגיה הקיימים
- שאלוני M-CHAT / Vanderbilt / Conners בפורטל הורה → `questionnaire_responses`
- `dose_records` עם `verification_status='verified'` בלבד מגיעים ל-`computeDose` בשולחן הרופא. הורה לא רואה את הטבלה הזו.

### 5. ליטוש מוצר (קליניקה, לא צעצוע)
- שולחן רופא: צפיפות גבוהה, דסקטופ/טאבלט, RTL
- פורטל הורה: מובייל, כפתורים גדולים, חירום אדום במסך מלא עד אישור
- מצב חדר המתנה: אותו `/parent` על טאבלט, `app_role=parent`
- באנר: «תמיכה בהחלטה, לא אבחנה» בכל מסך קליני
- עברית ברירת מחדל RTL; אנגלית LTR; ערבית RTL — `LanguageSwitcher` כבר קיים, אל תשברו אותו
- בלי ניצוצות AI שמרמזים אבחנה סופית
- בלי הסתברות מכוילת (אין 94%)

### 6. בדיקות קליק — לא סיימתם עד שכולן עוברות
1. חיבור env → מפגש נשמר בטבלת `encounters` (שתי שורות: clinician + parent, או שורת parent בלבד מפורטל הורה)
2. הורה ב-Supabase לא מצליח SELECT ל-`rls_role=clinician`
3. תינוק 40 יום + חום בפורטל → מיון, בלי מ״ג בשורה שנשמרה
4. סוללת כפתור → מיון, לא לגרום להקאה
5. ADHD בלי ראייה/שמיעה/שאלון → שער הפניה חסום
6. `/tox` `/trauma` `/nutrition` `/referrals` נטענים ומריצים את המנועים הקיימים
7. `/ecg` `/skin` `/labs` עדיין עובדים
8. החלפת שפה he/en/ar משנה כיוון מסמך

---

## מה אסור

- לא לכתוב מחדש את `src/lib/medscan/**`
- לא לקרוא ל-LLM ממסכי UI חדשים
- לא להמציא NAC, אנטיביוטיקה, לוח חיסונים, או טבלאות WHO
- לא להשתמש ב-Gemini
- לא לשמור PHI ב-GitHub / Issues / README
- GitHub הוא רק ניהול קוד מקור, אם בכלל. **כל רשומה חיה = Supabase**

---

## אמת מוצר

Lovable מדליק את המסד, ההתחברות והקליניקה החיה.  
MedScan נשאר מקור המספרים.  
Supabase נשאר מקור הרשומות.
