-- DoctorPedAI / MedScan — Supabase schema sketch for Lovable.
-- Draft. Apply only after physician/security review.
-- RLS: clinician vs parent views of the same encounter.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null default 'he' check (locale in ('he', 'en', 'ar')),
  dir text not null default 'rtl' check (dir in ('rtl', 'ltr')),
  sex text,
  birth_date date,
  weight_kg numeric,
  height_cm numeric
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id),
  created_at timestamptz not null default now(),
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

alter table public.patients enable row level security;
alter table public.encounters enable row level security;
alter table public.questionnaire_responses enable row level security;

-- Clinician: full row. Parent: only rls_role = 'parent' (no dosing JSON).
-- Replace auth.jwt() claims with the project's actual role claim.
-- create policy encounters_clinician on public.encounters
--   for all using (auth.jwt() ->> 'app_role' = 'clinician');
-- create policy encounters_parent on public.encounters
--   for select using (
--     auth.jwt() ->> 'app_role' = 'parent'
--     and rls_role = 'parent'
--   );
