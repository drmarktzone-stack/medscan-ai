/**
 * DoctorPedAI — אנמנזה פעילה: שאלות הבהרה לפני מסקנה.
 * לא מאבחן. אם חסר מידע קריטי — מחזיר שאלות ולא כיוון.
 */

import { t } from '../i18n/localize.js';

const DRAFT = 'draft_needs_verification';

const CLUSTERS = Object.freeze([
  {
    id: 'fever',
    match: /fever|חום/,
    questions: [
      { id: 'fever.age_confirmed', i18n_key: 'q.fever.age', need: ['age'] },
      { id: 'fever.duration', i18n_key: 'q.fever.duration', need: ['duration'] },
      { id: 'fever.alertness', i18n_key: 'q.fever.alertness', need: ['alertness'] },
      { id: 'fever.rash_petechiae', i18n_key: 'q.fever.rash', need: ['rash'] },
    ],
  },
  {
    id: 'abdomen',
    match: /abdominal|כאב בטן|vomit|הקא/,
    questions: [
      { id: 'abd.blood', i18n_key: 'q.abd.blood', need: ['blood_stool'] },
      { id: 'abd.duration', i18n_key: 'q.abd.duration', need: ['duration'] },
      { id: 'abd.projectile', i18n_key: 'q.abd.projectile', need: ['projectile'] },
    ],
  },
  {
    id: 'neurodev',
    match: /adhd|asd|autism|קשב|אוטיזם/,
    questions: [
      { id: 'nd.settings', i18n_key: 'q.nd.settings', need: ['two_settings'] },
      { id: 'nd.questionnaires', i18n_key: 'q.nd.questionnaires', need: ['questionnaire'] },
      { id: 'nd.senses', i18n_key: 'q.nd.senses', need: ['vision_hearing'] },
    ],
  },
  {
    id: 'ingest',
    match: /ingest|battery|magnet|paracetamol|הרעל|סוללת/,
    questions: [
      { id: 'tox.what', i18n_key: 'q.tox.what', need: ['substance'] },
      { id: 'tox.when', i18n_key: 'q.tox.when', need: ['time'] },
      { id: 'tox.amount', i18n_key: 'q.tox.amount', need: ['amount'] },
    ],
  },
  {
    id: 'headache',
    match: /headache|כאב ראש|migraine/,
    questions: [
      { id: 'ha.morning', i18n_key: 'q.ha.morning', need: ['morning_vomiting'] },
      { id: 'ha.wakes', i18n_key: 'q.ha.wakes', need: ['wakes_from_sleep'] },
      { id: 'ha.focal', i18n_key: 'q.ha.focal', need: ['focal'] },
    ],
  },
]);

function firstNeed(need) {
  return Array.isArray(need) ? need[0] : need;
}

function answered(need, { patient = {}, features = {}, findings = [], answers = {} }) {
  const key = firstNeed(need);
  if (answers[key] != null && answers[key] !== '') return true;
  if (key === 'age') return Number.isFinite(Number(patient.age_days ?? patient.age_months ?? patient.age_years));
  if (key === 'duration') return features.duration_months != null || features.duration_hours != null || answers.duration != null;
  if (key === 'alertness') return features.alert === true || features.lethargy === true || /letharg|alert|אפתי|ערני/.test((findings ?? []).join(' '));
  if (key === 'rash') return features.rash === true || features.petechiae === true || /rash|petech|פריחה|פטכי/.test((findings ?? []).join(' '));
  if (key === 'blood_stool') return features.blood_in_stool === true || features.no_blood === true;
  if (key === 'projectile') return features.projectile_vomiting === true || features.not_projectile === true;
  if (key === 'two_settings') return (features.settings ?? []).length >= 2 || answers.two_settings === true;
  if (key === 'questionnaire') return features.mchat_total != null || features.vanderbilt || answers.questionnaire === true;
  if (key === 'vision_hearing') return features.vision_tested === true && features.hearing_tested === true;
  if (key === 'substance') return Boolean(features.ingestion_type || answers.substance);
  if (key === 'time') return answers.time != null || features.ingestion_time != null;
  if (key === 'amount') return answers.amount != null || features.ingested_mg != null;
  if (key === 'morning_vomiting') return features.morning_vomiting === true || features.no_morning_vomiting === true;
  if (key === 'wakes_from_sleep') return features.wakes_from_sleep === true || features.no_night_waking === true;
  if (key === 'focal') return features.focal_deficit === true || features.no_focal === true;
  return false;
}

export function buildAnamnesisQuestions({
  findings = [],
  presentation = '',
  patient = {},
  features = {},
  answers = {},
  locale = 'he',
} = {}) {
  const blob = `${(findings ?? []).join(' ')} ${presentation}`.toLowerCase();
  const open = [];
  const askedIds = new Set();
  for (const cluster of CLUSTERS) {
    if (!cluster.match.test(blob) && !features[cluster.id]) continue;
    for (const q of cluster.questions) {
      if (askedIds.has(q.id)) continue;
      askedIds.add(q.id);
      if (!answered(q.need, { patient, features, findings, answers })) {
        open.push({
          id: q.id,
          cluster: cluster.id,
          need: q.need,
          i18n_key: q.i18n_key,
          question_he: t(locale, q.i18n_key),
          verification_status: DRAFT,
        });
      }
    }
  }
  return {
    ok: true,
    complete: open.length === 0,
    questions: open,
    verification_status: DRAFT,
  };
}
