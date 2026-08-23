/**
 * Pediatric family rights wizard — eligibility hints, not legal advice.
 * Returns i18n keys; pages resolve with useI18n.
 */

const DRAFT = 'draft_needs_verification';

export const RIGHTS_PROFILE_FIELDS = Object.freeze([
  'childAgeYears',
  'city',
  'isOleh',
  'isReservist',
  'specialNeeds',
  'inDaycare',
  'siblingsInDaycare',
]);

function ageNum(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function card(id, titleKey, summaryKey, actionKey, deadlineKey, params = {}) {
  return {
    id,
    titleKey,
    summaryKey,
    actionKey,
    deadlineKey,
    params,
    verification_status: DRAFT,
  };
}

/** @param {object} profile @returns {object[]} rights cards with i18n keys */
export function evaluateFamilyRights(profile = {}) {
  const cards = [];
  const age = ageNum(profile.childAgeYears);
  const city = String(profile.city || '').trim();

  if (profile.inDaycare || (age != null && age >= 0 && age <= 6)) {
    cards.push(card(
      'daycare_subsidy',
      'journey.rights_daycare_title',
      'journey.rights_daycare_summary',
      'journey.rights_daycare_action',
      'journey.rights_daycare_deadline',
    ));
  }

  if (profile.isOleh) {
    cards.push(card(
      'arnona_oleh',
      'journey.rights_arnona_title',
      'journey.rights_arnona_summary',
      'journey.rights_arnona_action',
      'journey.rights_arnona_deadline',
    ));
  }

  if (profile.isReservist) {
    cards.push(card(
      'reservist_benefits',
      'journey.rights_reservist_title',
      'journey.rights_reservist_summary',
      'journey.rights_reservist_action',
      'journey.rights_reservist_deadline',
    ));
  }

  if (profile.specialNeeds) {
    cards.push(card(
      'special_needs',
      'journey.rights_special_title',
      'journey.rights_special_summary',
      'journey.rights_special_action',
      'journey.rights_special_deadline',
    ));
  }

  if (profile.siblingsInDaycare && age != null && age <= 6) {
    cards.push(card(
      'sibling_daycare',
      'journey.rights_sibling_title',
      'journey.rights_sibling_summary',
      'journey.rights_sibling_action',
      'journey.rights_sibling_deadline',
    ));
  }

  if (city) {
    cards.push(card(
      'municipal_discounts',
      'journey.rights_municipal_title',
      'journey.rights_municipal_summary',
      'journey.rights_municipal_action',
      'journey.rights_municipal_deadline',
      { city },
    ));
  }

  if (!cards.length) {
    cards.push(card(
      'general_check',
      'journey.rights_general_title',
      'journey.rights_general_summary',
      'journey.rights_general_action',
      '',
    ));
  }

  return cards;
}
