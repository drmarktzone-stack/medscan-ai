/**
 * Parent-facing helper pack from existing engine output.
 * Never a diagnosis. Never milligrams. Never professional DDx names.
 */

import { t } from '../i18n/localize.js';
import { URGENCY } from './triage.js';
import { classifyParentQuestion } from './parentQuestion.js';

const MG = /mg\/kg|\bmg\b|NAC|nac |מינון/;

function clean(text) {
  const s = String(text || '').trim();
  if (!s || MG.test(s)) return null;
  return s;
}

export function buildParentHelp({
  result,
  question = '',
  complaints_he = [],
  locale = 'he',
} = {}) {
  const intent = classifyParentQuestion(question);
  const urgency = result?.triage?.urgency;
  const emergency = Boolean(result?.emergency) || urgency === URGENCY.emergency;
  const pathwayTitle = result?.community_pathway?.title_he;
  const picture = emergency
    ? t(locale, 'parent.picture.emergency')
    : pathwayTitle
      ? `${t(locale, 'parent.picture.fits')} ${pathwayTitle}`
      : urgency === URGENCY.home_care
        ? t(locale, 'parent.picture.home')
        : t(locale, 'parent.picture.hmo');

  const askDoctor = [
    t(locale, 'parent.ask.show_this'),
    complaints_he.length ? `${t(locale, 'parent.ask.complaints')}: ${complaints_he.join(', ')}` : null,
    question ? `${t(locale, 'parent.ask.question')}: ${question}` : null,
    intent.intent === 'medicine' ? t(locale, 'parent.meds.ask_clinician') : null,
    result?.community_pathway?.title_he
      ? `${t(locale, 'parent.ask.pathway')}: ${result.community_pathway.title_he}`
      : null,
  ].map(clean).filter(Boolean);

  const missing = Object.values(result?.referral_gate ?? {})
    .flatMap((g) => g?.missing ?? [])
    .map((m) => m.i18n_key ? t(locale, m.i18n_key) : null)
    .filter(Boolean);
  if (missing.length) {
    askDoctor.push(`${t(locale, 'parent.ask.request')}: ${missing.join(', ')}`);
  }

  const recommendDo = [];
  if (emergency) {
    recommendDo.push(t(locale, 'emergency.ed'));
  } else if (urgency === URGENCY.home_care) {
    recommendDo.push(t(locale, 'parent.do.observe'));
    recommendDo.push(t(locale, 'parent.do.red_flag_return'));
  } else {
    recommendDo.push(t(locale, 'parent.do.hmo'));
    recommendDo.push(t(locale, 'parent.do.bring_answers'));
  }

  const referrals = [];
  if (emergency) referrals.push(t(locale, 'parent.ref.ed'));
  else referrals.push(t(locale, 'parent.ref.pediatrician'));

  return {
    ok: true,
    not_a_diagnosis: true,
    intent: intent.intent,
    intent_he: t(locale, intent.i18n_key),
    picture_he: picture,
    ask_doctor_he: askDoctor,
    recommend_do_he: recommendDo.filter(Boolean),
    referrals_he: referrals,
    verification_status: 'draft_needs_verification',
  };
}

export function parentSafeResult(result, help) {
  if (!result || result.persona !== 'parent') return result;
  const copy = { ...result, parent_help: help };
  delete copy.differential;
  delete copy.diagnostic_trees;
  delete copy.dosing;
  delete copy.dose;
  delete copy.calculators;
  delete copy.recommended_tests;
  delete copy.toolbox;
  delete copy.kbItems;
  return copy;
}
