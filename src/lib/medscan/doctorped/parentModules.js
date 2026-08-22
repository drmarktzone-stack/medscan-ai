/**
 * Parent-facing use of the same pediatric engines.
 * Same code as the clinician tools. Different voice: helper, not a diagnosis.
 * No milligrams. No professional DDx names. No invented vaccine intervals.
 */

import { t } from '../i18n/localize.js';
import { toAgeDays } from '../deterministic/labNormalize.js';
import { classifyUrgency, URGENCY } from './triage.js';
import { evaluateAsdAdhdReferral } from './referralChecklists.js';
import { matchMilestones, MILESTONE_GATES, correctedAgeDays } from '../engines/infantNutritionAndDevelopment.js';
import { runGrowthImmunizationEngine, runTraumaEngine } from '../engines/expertModules.js';
import { runNeurodevelopmentalEngine } from '../engines/neurodevelopmentalEngine.js';

const DRAFT = 'draft_needs_verification';
const MG = /mg\/kg|\bmg\b|NAC|nac |מינון/;

function clean(text) {
  const s = String(text || '').trim();
  if (!s || MG.test(s)) return null;
  return s;
}

function pack({ picture, ask = [], doList = [], referrals = [], extra = {} }) {
  return {
    ok: true,
    not_a_diagnosis: true,
    hides_mg: true,
    picture_he: picture,
    ask_doctor_he: ask.map(clean).filter(Boolean),
    recommend_do_he: doList.map(clean).filter(Boolean),
    referrals_he: referrals.map(clean).filter(Boolean),
    verification_status: DRAFT,
    ...extra,
  };
}

export const PARENT_MILESTONE_CHIPS = Object.freeze([
  { id: 'social_smile', he: 'חיוך חברתי', en: 'Social smile', ar: 'ابتسامة اجتماعية' },
  { id: 'head_control', he: 'שליטת ראש', en: 'Head control', ar: 'سيطرة على الرأس' },
  { id: 'sits', he: 'ישיבה', en: 'Sits', ar: 'جلوس' },
  { id: 'stands_or_pulls', he: 'עמידה / משיכה לעמידה', en: 'Stands / pulls to stand', ar: 'وقوف / سحب للوقوف' },
  { id: 'pincer_or_grasp', he: 'צביטה / אחיזה', en: 'Pincer / grasp', ar: 'قبضة / ملقط' },
  { id: 'babble_or_mama', he: 'מלמול / אמא אבא', en: 'Babble / mama', ar: 'ثرثرة / ماما' },
  { id: 'walks', he: 'הליכה', en: 'Walks', ar: 'مشي' },
  { id: 'words', he: 'מילים', en: 'Words', ar: 'كلمات' },
  { id: 'two_word', he: 'צירוף שתי מילים', en: 'Two-word phrase', ar: 'كلمتان' },
]);

export const PARENT_ADHD_CHIPS = Object.freeze([
  { id: 'does not listen', he: 'לא מקשיב', en: 'Does not listen', ar: 'لا يصغي' },
  { id: 'fidgets', he: 'קופצני / מתנועע', en: 'Fidgets', ar: 'تململ' },
  { id: 'interrupts', he: 'מפריע לאחרים', en: 'Interrupts', ar: 'يقاطع' },
  { id: 'talks excessively', he: 'מדבר הרבה', en: 'Talks a lot', ar: 'يتحدث كثيراً' },
  { id: 'loses things', he: 'מאבד חפצים', en: 'Loses things', ar: 'يضيع أغراضه' },
  { id: 'no eye contact', he: 'מעט קשר עין', en: 'Little eye contact', ar: 'تواصل بصري قليل' },
  { id: 'hand flapping', he: 'נפנוף ידיים', en: 'Hand flapping', ar: 'رفرفة اليدين' },
]);

export const PARENT_BURN_CHIPS = Object.freeze([
  { id: 'head', he: 'ראש / פנים', en: 'Head / face', ar: 'رأس / وجه', special: true },
  { id: 'hand', he: 'כף יד', en: 'Hand', ar: 'يد', special: true },
  { id: 'genitalia', he: 'אזור חיתול', en: 'Diaper area', ar: 'منطقة الحفاض', special: true },
  { id: 'anterior_trunk', he: 'חזה / בטן', en: 'Chest / belly', ar: 'صدر / بطن' },
  { id: 'posterior_trunk', he: 'גב', en: 'Back', ar: 'ظهر' },
  { id: 'thigh', he: 'ירך', en: 'Thigh', ar: 'فخذ' },
  { id: 'leg', he: 'שוק', en: 'Lower leg', ar: 'ساق' },
  { id: 'foot', he: 'כף רגל', en: 'Foot', ar: 'قدم' },
  { id: 'upper_arm', he: 'זרוע', en: 'Upper arm', ar: 'عضد' },
  { id: 'forearm', he: 'אמה', en: 'Forearm', ar: 'ساعد' },
]);

export function chipLabel(row, lang = 'he') {
  if (!row) return '';
  if (lang === 'en') return row.en;
  if (lang === 'ar') return row.ar;
  return row.he;
}

export function buildParentMilestones({ patient = {}, can_do = [], ga_weeks = null, locale = 'he' } = {}) {
  const ageDays = toAgeDays(patient);
  if (!Number.isFinite(ageDays)) {
    return { ok: false, reason: 'age_required', message_he: t(locale, 'parent.need_age') };
  }
  const gaRaw = ga_weeks ?? patient.ga_weeks;
  const ga = Number(gaRaw);
  const gaOk = gaRaw != null && gaRaw !== '' && Number.isFinite(ga) && ga > 0;
  const age = correctedAgeDays({ ageDays, ga_weeks: gaOk ? ga : null });
  const ms = matchMilestones({
    correctedDays: age.ok ? age.corrected_days : ageDays,
    can_do,
  });
  const delayed = Boolean(ms.delayed);
  const missingHe = (ms.missing || []).map((m) => {
    const chip = PARENT_MILESTONE_CHIPS.find((c) => c.id === m.key);
    const name = chipLabel(chip, locale) || m.key;
    const domain = t(locale, m.i18n_domain);
    return `${name} (${domain})`;
  });
  const ask = [
    t(locale, 'parent.ask.show_this'),
    delayed ? t(locale, 'parent.ms.ask_list') : t(locale, 'parent.ms.ask_ok'),
  ];
  if (missingHe.length) ask.push(`${t(locale, 'parent.ms.missing')}: ${missingHe.join(', ')}`);
  const doList = delayed
    ? [t(locale, 'parent.ms.do_review'), t(locale, 'parent.do.bring_answers')]
    : [t(locale, 'parent.ms.do_keep'), t(locale, 'parent.do.hmo')];
  const referrals = delayed
    ? [t(locale, 'parent.ms.ref_cdu'), t(locale, 'parent.ref.pediatrician')]
    : [t(locale, 'parent.ref.pediatrician')];
  return pack({
    picture: delayed ? t(locale, 'parent.ms.fits_review') : t(locale, 'parent.ms.fits_age'),
    ask,
    doList,
    referrals,
    extra: {
      delayed,
      missing_keys: (ms.missing || []).map((m) => m.key),
      gates_used: MILESTONE_GATES.length,
      volume: null,
    },
  });
}

export function buildParentVaccines({ patient = {}, immunization = {}, locale = 'he' } = {}) {
  const raw = runGrowthImmunizationEngine({
    patient,
    immunization,
    locale,
    mode: 'development',
  });
  if (!raw?.ok) {
    return { ok: false, reason: raw?.reason, message_he: raw?.message_he || t(locale, 'parent.vax.need') };
  }
  const delayed = immunization.delayed === true || immunization.missed_doses === true;
  const contra = (raw.red_flags || []).some((f) => f.flag_key === 'vax.contraindication');
  const picture = contra
    ? t(locale, 'parent.vax.fits_stop')
    : delayed
      ? t(locale, 'parent.vax.fits_catchup')
      : t(locale, 'parent.vax.fits_ask');
  return pack({
    picture,
    ask: [
      t(locale, 'parent.ask.show_this'),
      t(locale, 'parent.vax.ask_book'),
      contra ? t(locale, 'parent.vax.ask_allergy') : null,
    ],
    doList: [
      contra ? t(locale, 'parent.vax.do_not_guess') : t(locale, 'parent.vax.do_clinic'),
      t(locale, 'parent.vax.no_schedule'),
    ],
    referrals: [t(locale, 'parent.ref.pediatrician')],
    extra: { delayed, contraindication: contra, z_score: null },
  });
}

export function buildParentAdhd({
  patient = {},
  findings = [],
  settings = [],
  mchat_total = null,
  vision_tested = false,
  hearing_tested = false,
  locale = 'he',
} = {}) {
  const raw = runNeurodevelopmentalEngine({
    patient,
    findings,
    settings,
    mchat_total,
    features: { vision_tested, hearing_tested },
    locale,
    mode: 'development',
  });
  if (!raw?.ok) {
    return { ok: false, reason: raw?.reason, message_he: raw?.message_he || t(locale, 'parent.adhd.need') };
  }
  const gate = evaluateAsdAdhdReferral({
    features: { vision_tested, hearing_tested },
    questionnaires: Number.isFinite(Number(mchat_total)) ? { mchat_total: Number(mchat_total) } : {},
  });
  const positive = (raw.matched_patterns || []).length > 0;
  const picture = positive ? t(locale, 'parent.adhd.fits_workup') : t(locale, 'parent.adhd.fits_talk');
  const ask = [
    t(locale, 'parent.ask.show_this'),
    t(locale, 'parent.adhd.ask_not_dx'),
  ];
  const missing = (gate.missing ?? [])
    .map((m) => (m.i18n_key ? t(locale, m.i18n_key) : null))
    .filter(Boolean);
  if (missing.length) ask.push(`${t(locale, 'parent.ask.request')}: ${missing.join(', ')}`);
  const blob = JSON.stringify(raw);
  return pack({
    picture,
    ask,
    doList: [
      t(locale, 'parent.adhd.do_two_settings'),
      t(locale, 'parent.do.hmo'),
    ],
    referrals: [t(locale, 'parent.ref.pediatrician')],
    extra: {
      screen_positive: positive,
      hides_dsm_diagnosis: !/האבחנה היא/.test(blob),
    },
  });
}

function burnRegionsFromIds(ids = []) {
  const regions = {};
  for (const id of ids) regions[id] = true;
  return regions;
}

export function buildParentTrauma({
  patient = {},
  head = false,
  features = {},
  findings = [],
  burnIds = [],
  locale = 'he',
} = {}) {
  const burn_regions = burnIds.length ? burnRegionsFromIds(burnIds) : null;
  if (!head && !burn_regions) {
    return { ok: false, reason: 'no_trauma_input', message_he: t(locale, 'parent.trauma.need') };
  }
  const headFindings = head ? ['head trauma', ...findings] : findings;
  const raw = runTraumaEngine({
    patient,
    findings: headFindings,
    features: { ...features, head_trauma: head || features.head_trauma },
    burn_regions,
    locale,
    mode: 'development',
  });
  if (!raw?.ok) {
    return { ok: false, reason: raw?.reason, message_he: raw?.message_he || t(locale, 'parent.trauma.need') };
  }

  const specialBurn = burnIds.some((id) => PARENT_BURN_CHIPS.find((c) => c.id === id)?.special);
  const pecarn = raw.pecarn;
  const high = pecarn?.pecarn_action === 'ct' || pecarn?.risk === 'high';
  const mid = pecarn?.pecarn_action === 'observe_vs_ct';
  const burnHot = Boolean(raw.emergency) || specialBurn || (raw.burn?.ok && Number(raw.burn.tbsa_pct) >= 10);
  const emergency = high || burnHot || features.seizure === true;

  let picture = t(locale, 'parent.picture.hmo');
  if (emergency) picture = t(locale, 'parent.picture.emergency');
  else if (mid) picture = t(locale, 'parent.trauma.fits_now');
  else if (head || burnIds.length) picture = t(locale, 'parent.trauma.fits_clinic');

  const ask = [
    t(locale, 'parent.ask.show_this'),
    t(locale, 'parent.trauma.ask_imaging'),
  ];
  const doList = emergency
    ? [t(locale, 'emergency.ed')]
    : mid
      ? [t(locale, 'parent.trauma.do_now'), t(locale, 'parent.do.red_flag_return')]
      : [t(locale, 'parent.do.hmo'), t(locale, 'parent.do.red_flag_return')];
  const referrals = emergency
    ? [t(locale, 'parent.ref.ed')]
    : [t(locale, 'parent.ref.pediatrician')];

  return pack({
    picture,
    ask,
    doList,
    referrals,
    extra: {
      emergency,
      pecarn_action: pecarn?.pecarn_action || null,
      mentions_ct: false,
      special_burn: specialBurn,
    },
  });
}

export function buildParentSkin({
  patient = {},
  findings = [],
  features = {},
  photoReady = false,
  onDevice = false,
  locale = 'he',
} = {}) {
  const hasRash = (findings || []).some((f) => /rash|פריחה/.test(String(f))) || features.rash === true;
  const triage = classifyUrgency({
    patient,
    findings: hasRash ? findings : [...findings, 'rash'],
    features,
  });
  const emergency = triage.urgency === URGENCY.emergency;
  const picture = emergency
    ? t(locale, 'parent.picture.emergency')
    : t(locale, 'parent.skin.fits_photo');
  return pack({
    picture,
    ask: [
      t(locale, 'parent.skin.ask_show_photo'),
      t(locale, 'parent.ask.show_this'),
    ],
    doList: emergency
      ? [t(locale, 'emergency.ed')]
      : [t(locale, 'parent.skin.do_clinic'), t(locale, 'parent.do.red_flag_return')],
    referrals: emergency ? [t(locale, 'parent.ref.ed')] : [t(locale, 'parent.ref.pediatrician')],
    extra: {
      emergency,
      photo_ready: photoReady,
      on_device: onDevice,
      hides_ddx: true,
      differential: undefined,
    },
  });
}
