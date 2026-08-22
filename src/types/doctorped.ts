/**
 * DoctorPedAI TypeScript contracts for Lovable / Supabase.
 * Every interface carries locale + dir. RLS role separates clinician vs parent.
 */

import type { MedscanDir, MedscanLocale, MedscanLocaleFields } from './medscan';

export type DoctorPedPersona = 'clinician' | 'parent';
export type DoctorPedIntegrationMode = 'standalone' | 'unified';
export type DoctorPedUrgency = 'emergency' | 'hmo_visit' | 'home_care';
export type DoctorPedRlsRole = 'clinician' | 'parent';

export interface DoctorPedLocaleFields extends MedscanLocaleFields {
  locale: MedscanLocale;
  dir: MedscanDir;
  rls_role: DoctorPedRlsRole;
}

export interface DoctorPedPatientProfile extends DoctorPedLocaleFields {
  patient_id?: string;
  age_days?: number;
  sex?: string;
  weight_kg?: number;
  height_cm?: number;
}

export interface DoctorPedEncounter extends DoctorPedLocaleFields {
  encounter_id?: string;
  patient_id?: string;
  encounter_type: 'clinician' | 'previsit';
  persona: DoctorPedPersona;
  triage_urgency?: DoctorPedUrgency | null;
  engines_run?: Array<{ id: string; ok?: boolean }>;
  questionnaire_json?: Record<string, unknown>;
  created_at?: string;
}

export interface DoctorPedQuestionnaireResponse extends DoctorPedLocaleFields {
  response_id?: string;
  patient_id?: string;
  instrument: 'mchat' | 'vanderbilt' | 'conners' | 'symptom_checker';
  payload: Record<string, unknown>;
}

export interface DoctorPedWorkbenchPayload extends DoctorPedLocaleFields {
  persona: 'clinician';
  integrationMode: DoctorPedIntegrationMode;
  moduleId?: string;
  findings?: string[];
  presentation?: string;
  proceed?: boolean;
}

export interface DoctorPedParentPayload extends DoctorPedLocaleFields {
  persona: 'parent';
  integrationMode: 'unified';
  findings?: string[];
  presentation?: string;
}

export interface DoctorPedReferralGate extends DoctorPedLocaleFields {
  pathway: 'asd_adhd' | 'celiac' | 'short_stature';
  ready: boolean;
  missing: Array<{ item: string }>;
}

export interface DoctorPedWorkbenchResult extends DoctorPedLocaleFields {
  persona: 'clinician';
  voice: 'professional';
  triage?: { urgency?: DoctorPedUrgency };
  differential?: unknown[];
  dosing?: unknown[];
}

export interface DoctorPedParentResult extends DoctorPedLocaleFields {
  persona: 'parent';
  voice: 'accessible';
  hides_mg: true;
  parent_plan_he?: string;
}
