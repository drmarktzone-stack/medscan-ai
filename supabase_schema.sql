-- MedScan / Smart Pediatrician — Supabase schema
-- הרצה: SQL Editor ב-Supabase (או `supabase db query -f supabase_schema.sql`).
--
-- עקרונות:
--   · כל מסלול נכנס כ-draft_needs_verification עד אימות רופא.
--   · יומן הבקרה שומר את ה-FACT BLOCK והדגלים שחושבו בקוד — לא את ניסוח המודל בלבד.
--   · אין כאן מינונים או ספים קליניים. אלה חיים במסלול המאומת / במחשבון הדטרמיניסטי.

create extension if not exists pgcrypto;

do $$ begin
  create type public.pathway_category as enum ('acute', 'developmental', 'routine', 'regulatory');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_status as enum ('draft_needs_verification', 'verified', 'flagged');
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. pediatric_pathways — מילון מסלולי בירור לקהילה בישראל
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.pediatric_pathways (
  id uuid primary key default gen_random_uuid(),
  pathway_key text not null unique,
  title_he text not null,
  category public.pathway_category not null,
  source_anchor text not null,
  min_age_days integer,
  max_age_days integer,
  steps jsonb not null default '[]'::jsonb,
  aliases text[] not null default '{}',
  triggers_he text[] not null default '{}',
  entry_criteria_he text[] not null default '{}',
  local_protocol_ref text,
  verification_status public.verification_status not null
    default 'draft_needs_verification',
  verified_by text,
  verified_at timestamptz,
  review_note_he text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pediatric_pathways_age_window_chk
    check (
      min_age_days is null
      or max_age_days is null
      or min_age_days <= max_age_days
    ),
  constraint pediatric_pathways_steps_is_array_chk
    check (jsonb_typeof(steps) = 'array')
);

comment on table public.pediatric_pathways is
  'מסלולי בירור קליניים לרופא ילדים בקהילה. steps הוא מערך JSONB סדור באותה צורה כמו Protocol.steps (step_id, title_he, actions_he, branches, red_flags_he, deterministic_refs). רק verified רץ בפלט קליני.';

comment on column public.pediatric_pathways.steps is
  'מערך סדור של שלבי בירור. הניווט נעשה בקוד (protocolTree.resolveStep) — לא ב-LLM.';

comment on column public.pediatric_pathways.source_anchor is
  'עוגן מקור (חוזר משרד הבריאות / נלסון / פרוטוקול קופה). אסור למלא ערך מומצא.';

create index if not exists pediatric_pathways_category_idx
  on public.pediatric_pathways (category);

create index if not exists pediatric_pathways_age_idx
  on public.pediatric_pathways (min_age_days, max_age_days);

create index if not exists pediatric_pathways_status_idx
  on public.pediatric_pathways (verification_status);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. patient_encounters — פרופיל מפגש (לא תיק רפואי מלא)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.patient_encounters (
  id uuid primary key default gen_random_uuid(),
  patient_ref text,
  age_days integer not null,
  sex text,
  weight_kg numeric,
  height_cm numeric,
  vitals jsonb not null default '{}'::jsonb,
  chief_complaint_he text,
  findings_he text[] not null default '{}',
  immunization_status text,
  category public.pathway_category,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint patient_encounters_age_nonneg_chk check (age_days >= 0),
  constraint patient_encounters_weight_chk check (weight_kg is null or weight_kg > 0),
  constraint patient_encounters_height_chk check (height_cm is null or height_cm > 0),
  constraint patient_encounters_vitals_obj_chk check (jsonb_typeof(vitals) = 'object')
);

comment on table public.patient_encounters is
  'מפגש קהילה: גיל בימים, משקל, מדדים חיוניים, תלונות. patient_ref הוא מזהה פנימי — לא לשים כאן שם/ת.ז.';

comment on column public.patient_encounters.vitals is
  'מדדים חיוניים כ-JSON: { temp_c, hr, rr, spo2, sbp, dbp }. ערכים מספריים בלבד; אין כאן פרשנות.';

create index if not exists patient_encounters_age_idx
  on public.patient_encounters (age_days);

create index if not exists patient_encounters_created_at_idx
  on public.patient_encounters (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. clinical_audit_logs — עקיבות: מטופל · FactBlock · Red Flags · Pathway
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.clinical_audit_logs (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid references public.patient_encounters (id) on delete set null,
  engine text not null,
  mode text not null default 'clinical',
  output_status text,
  patient_snapshot jsonb not null default '{}'::jsonb,
  fact_block jsonb not null default '{}'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  matched_pathway_key text,
  matched_pathway jsonb,
  active_step_id text,
  draft_items_rejected integer not null default 0,
  reason_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint clinical_audit_logs_mode_chk
    check (mode in ('clinical', 'development')),
  constraint clinical_audit_logs_fact_block_obj_chk
    check (jsonb_typeof(fact_block) = 'object'),
  constraint clinical_audit_logs_red_flags_arr_chk
    check (jsonb_typeof(red_flags) = 'array')
);

comment on table public.clinical_audit_logs is
  'יומן בקרה לכל הרצת מנוע. שומר את נתוני המטופל שסופקו, את ה-FACT BLOCK שיוצר, את הדגלים האדומים שחושבו בקוד, ואת המסלול הציבורי/קליני שהותאם.';

create index if not exists clinical_audit_logs_encounter_idx
  on public.clinical_audit_logs (encounter_id);

create index if not exists clinical_audit_logs_pathway_idx
  on public.clinical_audit_logs (matched_pathway_key);

create index if not exists clinical_audit_logs_created_at_idx
  on public.clinical_audit_logs (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — קריאה/כתיבה לפי authenticated. מדיניות מדויקת לפי תפקיד — בקופה.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.pediatric_pathways enable row level security;
alter table public.patient_encounters enable row level security;
alter table public.clinical_audit_logs enable row level security;

drop policy if exists pediatric_pathways_read_authenticated on public.pediatric_pathways;
create policy pediatric_pathways_read_authenticated
  on public.pediatric_pathways for select
  to authenticated
  using (true);

drop policy if exists pediatric_pathways_write_authenticated on public.pediatric_pathways;
create policy pediatric_pathways_write_authenticated
  on public.pediatric_pathways for insert
  to authenticated
  with check (verification_status = 'draft_needs_verification');

drop policy if exists patient_encounters_owner_all on public.patient_encounters;
create policy patient_encounters_owner_all
  on public.patient_encounters for all
  to authenticated
  using (created_by is null or created_by = auth.uid())
  with check (created_by is null or created_by = auth.uid());

drop policy if exists clinical_audit_logs_owner_read on public.clinical_audit_logs;
create policy clinical_audit_logs_owner_read
  on public.clinical_audit_logs for select
  to authenticated
  using (
    encounter_id is null
    or exists (
      select 1 from public.patient_encounters e
      where e.id = clinical_audit_logs.encounter_id
        and (e.created_by is null or e.created_by = auth.uid())
    )
  );

drop policy if exists clinical_audit_logs_insert_authenticated on public.clinical_audit_logs;
create policy clinical_audit_logs_insert_authenticated
  on public.clinical_audit_logs for insert
  to authenticated
  with check (true);
