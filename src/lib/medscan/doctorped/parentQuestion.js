/**
 * Understand the parent's free-text question with keywords only.
 * Routes emphasis. Does not diagnose.
 */

export function classifyParentQuestion(text = '') {
  const q = String(text || '').toLowerCase();
  if (!q.trim()) return { intent: 'general', i18n_key: 'parent.q.general' };
  if (/מיון|emergency|ed |urgent|طوارئ|דחוף|עכשיו/.test(q)) return { intent: 'urgency', i18n_key: 'parent.q.urgency' };
  if (/תרופה|מינון|כדור|סירופ|אקמול|nurofen|dose|mg|دواء|جرعة/.test(q)) return { intent: 'medicine', i18n_key: 'parent.q.medicine' };
  if (/מה זה|אבחנ|יש לו|האם זה|what is it|diagnosis|ما هذا/.test(q)) return { intent: 'picture', i18n_key: 'parent.q.picture' };
  if (/מה לעשות|איך לטפל|what (should|to) do|ماذا نفعل|טיפול/.test(q)) return { intent: 'plan', i18n_key: 'parent.q.plan' };
  if (/קופה|רופא|ביקור|doctor|clinic|طبيب/.test(q)) return { intent: 'visit', i18n_key: 'parent.q.visit' };
  if (/התפתח|קשב|אוטיזם|adhd|asd|تطور/.test(q)) return { intent: 'development', i18n_key: 'parent.q.dev' };
  return { intent: 'general', i18n_key: 'parent.q.general' };
}

export const YES_NO_NEEDS = Object.freeze([
  'alertness', 'rash', 'blood_stool', 'projectile', 'two_settings',
  'questionnaire', 'vision_hearing', 'morning_vomiting', 'wakes_from_sleep', 'focal',
]);

export function isYesNoNeed(need) {
  return YES_NO_NEEDS.includes(need);
}

/** Free-text anamnesis (ingestion what/when/amount) — never parsed as milligrams here. */
export function applyTextAnswer(need, text, { findings = [], features = {} } = {}) {
  const note = String(text || '').trim();
  const nextFeatures = { ...features };
  if (need === 'substance') nextFeatures.ingestion_type = note;
  if (need === 'time') nextFeatures.ingestion_time = note;
  if (need === 'amount') nextFeatures.ingested_amount_note = note;
  return { findings: [...findings], features: nextFeatures };
}

/** Yes/no answers → features the existing anamnesis/triage already read. */
export function applyYesNoAnswer(need, value, { findings = [], features = {} } = {}) {
  const nextFindings = [...findings];
  const nextFeatures = { ...features };
  const push = (tok) => {
    if (!nextFindings.includes(tok)) nextFindings.push(tok);
  };
  if (value === true) {
    if (need === 'alertness') { push('lethargy'); nextFeatures.lethargy = true; }
    if (need === 'rash') { push('rash'); nextFeatures.rash = true; }
    if (need === 'blood_stool') nextFeatures.blood_in_stool = true;
    if (need === 'projectile') nextFeatures.projectile_vomiting = true;
    if (need === 'two_settings') nextFeatures.two_settings = true;
    if (need === 'questionnaire') nextFeatures.questionnaire = true;
    if (need === 'vision_hearing') {
      nextFeatures.vision_tested = true;
      nextFeatures.hearing_tested = true;
    }
    if (need === 'morning_vomiting') nextFeatures.morning_vomiting = true;
    if (need === 'wakes_from_sleep') nextFeatures.wakes_from_sleep = true;
    if (need === 'focal') { push('focal deficit'); nextFeatures.focal_deficit = true; }
  } else if (value === false) {
    if (need === 'alertness') nextFeatures.alert = true;
    if (need === 'rash') nextFeatures.no_rash = true;
    if (need === 'blood_stool') nextFeatures.no_blood = true;
    if (need === 'projectile') nextFeatures.not_projectile = true;
    if (need === 'morning_vomiting') nextFeatures.no_morning_vomiting = true;
    if (need === 'wakes_from_sleep') nextFeatures.no_night_waking = true;
    if (need === 'focal') nextFeatures.no_focal = true;
  }
  return { findings: nextFindings, features: nextFeatures };
}
