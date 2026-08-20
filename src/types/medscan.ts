/**
 * MedScan TypeScript contracts for Lovable / Supabase payloads.
 * locale + dir must travel with every clinical encounter and engine result.
 */

export type MedscanLocale = 'he' | 'en' | 'ar';
export type MedscanDir = 'rtl' | 'ltr';

export interface MedscanLocaleFields {
  locale: MedscanLocale;
  dir: MedscanDir;
}

export interface MedscanEnginePayload extends MedscanLocaleFields {
  patient?: Record<string, unknown>;
  mode?: 'clinical' | 'development';
}

export interface MedscanEngineResult extends MedscanLocaleFields {
  ok?: boolean;
  engine?: string;
  verification_status?: string;
  emergency?: boolean;
}

export interface MedscanEncounter extends MedscanLocaleFields {
  encounter_id?: string;
  patient_id?: string;
  created_at?: string;
}

export interface MedscanLabPayload extends MedscanEnginePayload {
  labs?: Array<Record<string, unknown>>;
  findings?: string[];
}

export interface MedscanSkinPayload extends MedscanEnginePayload {
  fileUrl?: string;
}

export interface MedscanRadiologyPayload extends MedscanEnginePayload {
  fileUrl?: string;
}

export interface MedscanAudioPayload extends MedscanEnginePayload {
  samples?: ArrayLike<number>;
  sampleRate?: number;
}

export interface MedscanEcgPayload extends MedscanEnginePayload {
  fileUrl?: string;
  sex?: string;
}

export interface MedscanNelsonPathwayPayload extends MedscanEnginePayload {
  query?: string;
  age_days?: number;
  category?: 'acute' | 'developmental' | 'routine' | 'regulatory';
}

export interface MedscanNutritionPayload extends MedscanEnginePayload {
  weight_kg?: number;
  feeds_per_day?: number;
  findings?: string[];
  can_do?: string[];
}

export interface MedscanTraumaPayload extends MedscanEnginePayload {
  gcs?: number;
  burn_regions?: Record<string, number>;
}

export interface MedscanToxicologyPayload extends MedscanEnginePayload {
  vitals?: Record<string, unknown>;
  findings?: string[];
}

export interface MedscanLabResult extends MedscanEngineResult {
  normalized?: unknown[];
}

export interface MedscanSkinResult extends MedscanEngineResult {
  summary?: string;
  analysis?: string;
}

export interface MedscanRadiologyResult extends MedscanEngineResult {
  summary?: string;
  analysis?: string;
}

export interface MedscanAudioResult extends MedscanEngineResult {
  bands?: Record<string, unknown>;
  note_he?: string;
}

export interface MedscanEcgResult extends MedscanEngineResult {
  summary?: string;
  analysis?: string;
}

export interface MedscanNelsonPathwayResult extends MedscanEngineResult {
  matched?: unknown;
  error_he?: string | null;
}

export interface MedscanNutritionResult extends MedscanEngineResult {
  formula?: string;
  volume?: { daily_ml?: number; per_feed_ml?: number } | null;
}

export interface MedscanTraumaResult extends MedscanEngineResult {
  pecarn?: { pecarn_action?: string } | null;
  burn?: { tbsa_pct?: number } | null;
}

export interface MedscanToxicologyResult extends MedscanEngineResult {
  toxidrome_flags?: string[];
}
