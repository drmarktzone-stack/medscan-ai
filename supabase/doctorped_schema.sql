-- DoctorPedAI live schema for Lovable / Supabase.
-- Apply in the Supabase SQL editor. Patient data lives here, not in git.

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
