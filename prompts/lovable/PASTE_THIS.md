# הדביקו את כל הקובץ הזה ב-Lovable. זה כל מה שצריך לספק.

אל תלחצו על הכפתורים: «העבר ל-Lovable Cloud», «הוסף API של base44», «החלף InvokeLLM ל-Lovable AI», «ייבא נתוני Medscan לסופאבייס» כתנאי להמשך.

יש לכם מזהה יישום. אין מפתח API במאגר. המרפאה רצה בלי זה. המשימה שלכם: Supabase חי + מצב מקומי, בלי לגעת במנועים.

---

## א. Secrets / `.env.local` — שימו בדיוק את זה

```
VITE_BASE44_APP_ID=6a44d05c8195d3fd459fae15
VITE_LOCAL_CLINIC=true
```

אחרי שתיצרו פרויקט Supabase, הוסיפו (לא בגיט):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

אין `VITE_BASE44_API_KEY`. אל תמציאו אותו. אל תחסמו בנייה בגללו.

---

## ב. ארבעת הסעיפים שביקשתם — תשובה סגורה

### 1. Authentication / Users
מזהה היישום למעלה. אין אסימון במאגר.

אל תקראו ל-`base44.auth.me()` / `User.me` כתנאי לפתיחת `/doctorped` או `/parent`.
אם אין אסימון: `enableLocalClinic()` מ-`src/lib/clinic/localMode.js` (כבר מחובר ב-`Login.jsx` וב-`AuthContext.jsx`).
משתמש מקומי: `LOCAL_CLINIC_USER`. מפגשים ב-`localStorage` עד שיש Supabase.

### 2. LLM
שולחן רופא והורים = `runDoctorPedAI` בסנכרון. בלי רשת. בלי Lovable AI. בלי Gemini.

`InvokeLLM` רק לניתוח תמונה דרך `src/lib/medscan/llmAdapter.js`. בלי Base44 מחובר — כשל סגור. זה נכון.

מודלים רק אם הרופא מחובר ל-Base44 בדפדפן: `claude_opus_4_8` / `claude_sonnet_4_6`.

### 3. Entities / Data
סכימות הישויות כבר ב-`base44/entities/*.jsonc`. אין ייצוא מטופלים חיים במאגר. אל תמציאו PHI.

נתונים חיים = Supabase. הריצו את ה-SQL למטה כמו שהוא. הקוד כבר כותב ל-`src/lib/supabase/encounters.js`.

ישויות (קבצים במאגר, אל תשכתבו):
User, Analysis, AnalysisAudit, ECGCase, SkinCase, RadiologyCase, GoldStandardCase, Feedback, TestRun, KnowledgeTopic, ClinicalRule, LabPattern, RedFlag, Association, Protocol, DoseRecord, DrugInteraction, ReferenceRange, NelsonChapter.

### 4. React Router
`NavLink` עם `end` ב-`BottomNav.jsx` תקין. אל תהפכו ל-`<a>`.

---

## ג. SQL להרצה ב-Supabase (כמו שהוא)

```sql
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null default 'he' check (locale in ('he', 'en', 'ar')),
  dir text not null default 'rtl' check (dir in ('rtl', 'ltr')),
  sex text,
  birth_date date,
  weight_kg numeric,
  height_cm numeric,
  parent_user_id uuid,
  clinician_org_id text
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id),
  created_at timestamptz not null default now(),
  created_by uuid,
  locale text not null default 'he' check (locale in ('he', 'en', 'ar')),
  dir text not null default 'rtl' check (dir in ('rtl', 'ltr')),
  rls_role text not null check (rls_role in ('clinician', 'parent')),
  encounter_type text not null check (encounter_type in ('clinician', 'previsit')),
  triage_urgency text check (triage_urgency in ('emergency', 'hmo_visit', 'home_care')),
  engines_run jsonb not null default '[]'::jsonb,
  output_summary jsonb,
  verification_status text not null default 'draft_needs_verification'
);

create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id),
  encounter_id uuid references public.encounters (id),
  created_at timestamptz not null default now(),
  locale text not null default 'he' check (locale in ('he', 'en', 'ar')),
  dir text not null default 'rtl' check (dir in ('rtl', 'ltr')),
  rls_role text not null check (rls_role in ('clinician', 'parent')),
  instrument text not null check (instrument in ('mchat', 'vanderbilt', 'conners', 'symptom_checker')),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.dose_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  drug_key text not null,
  drug_name_he text,
  mg_per_kg_per_dose numeric,
  max_mg_per_dose numeric,
  max_mg_per_day numeric,
  doses_per_day numeric,
  min_age_days integer,
  verification_status text not null default 'draft_needs_verification',
  source text
);

alter table public.patients enable row level security;
alter table public.encounters enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.dose_records enable row level security;

drop policy if exists encounters_clinician_all on public.encounters;
create policy encounters_clinician_all on public.encounters
  for all
  using (coalesce(auth.jwt() ->> 'app_role', '') = 'clinician')
  with check (coalesce(auth.jwt() ->> 'app_role', '') = 'clinician');

drop policy if exists encounters_parent_select on public.encounters;
create policy encounters_parent_select on public.encounters
  for select
  using (
    coalesce(auth.jwt() ->> 'app_role', '') = 'parent'
    and rls_role = 'parent'
  );

drop policy if exists encounters_parent_insert on public.encounters;
create policy encounters_parent_insert on public.encounters
  for insert
  with check (
    coalesce(auth.jwt() ->> 'app_role', '') = 'parent'
    and rls_role = 'parent'
    and encounter_type = 'previsit'
  );

drop policy if exists patients_clinician_all on public.patients;
create policy patients_clinician_all on public.patients
  for all
  using (coalesce(auth.jwt() ->> 'app_role', '') = 'clinician');

drop policy if exists patients_parent_own on public.patients;
create policy patients_parent_own on public.patients
  for select
  using (
    coalesce(auth.jwt() ->> 'app_role', '') = 'parent'
    and parent_user_id = auth.uid()
  );

drop policy if exists q_clinician_all on public.questionnaire_responses;
create policy q_clinician_all on public.questionnaire_responses
  for all
  using (coalesce(auth.jwt() ->> 'app_role', '') = 'clinician');

drop policy if exists q_parent_own on public.questionnaire_responses;
create policy q_parent_own on public.questionnaire_responses
  for all
  using (
    coalesce(auth.jwt() ->> 'app_role', '') = 'parent'
    and rls_role = 'parent'
  );

drop policy if exists dose_clinician_select on public.dose_records;
create policy dose_clinician_select on public.dose_records
  for select
  using (coalesce(auth.jwt() ->> 'app_role', '') = 'clinician');
```

JWT claim: `app_role` = `clinician` או `parent`.
הורה שמנסה `/doctorped` → `/parent`. הורה לא רואה מ״ג.

---

## ד. מה לבנות עכשיו

1. Secrets כמו בסעיף א.
2. פרויקט Supabase + SQL למעלה.
3. מצב מקומי בלי אסימון Base44.
4. אחרי `runDoctorPedAI` — שמירה ל-Supabase (הקריאה כבר בקוד).
5. `/history` קורא מפגשים מ-Supabase כשיש env.
6. `npm test` ו-`npm run build`.

אל תכתבו מחדש `src/lib/medscan/**`. אל תמציאו מינונים. אל תשמרו מטופלים בגיטהאב.
