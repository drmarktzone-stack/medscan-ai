/**
 * Orderable community referrals for the clinic chart.
 * These are documentation pick-lists (what the physician requests).
 * Engine recommended_tests stay separate and remain draft.
 */

export const ORDER_STATUS = 'draft_needs_verification';

export const LAB_ORDERS = Object.freeze([
  { id: 'cbc', he: 'ספירת דם' },
  { id: 'crp', he: 'CRP' },
  { id: 'chem', he: 'כימיה / אלקטרוליטים' },
  { id: 'urine', he: 'שתן כללית + תרבית לפי שיקול' },
  { id: 'strep', he: 'משטח גרון / סטרפ מהיר' },
  { id: 'cultures', he: 'תרביות (דם/שתן/צואה) לפי פרוטוקול' },
  { id: 'ttg', he: 'tTG-IgA + IgA כללי' },
  { id: 'tsh', he: 'TSH / תפקודי בלוטת תריס' },
  { id: 'ferritin', he: 'ברזל / פריטין' },
  { id: 'celiac_panel', he: 'פאנל צליאק לפי פרוטוקול מקומי' },
]);

export const IMAGING_ORDERS = Object.freeze([
  { id: 'cxr', he: 'צילום חזה' },
  { id: 'axr', he: 'צילום בטן' },
  { id: 'us_abd', he: 'אולטרסאונד בטן' },
  { id: 'us_hips', he: 'אולטרסאונד ירכיים' },
  { id: 'us_head', he: 'אולטרסאונד מוח (יילוד)' },
  { id: 'bone_age', he: 'צילום גיל עצם' },
  { id: 'ct_head', he: 'CT ראש — רק לפי PECARN / שיקול דחוף' },
]);

export const CONSULT_ORDERS = Object.freeze([
  { id: 'ed', he: 'מיון / רפואה דחופה' },
  { id: 'ent', he: 'אא״ג ילדים' },
  { id: 'derm', he: 'עור ילדים' },
  { id: 'gi', he: 'גסטרו ילדים' },
  { id: 'endo', he: 'אנדוקרינולוגית ילדים' },
  { id: 'neuro', he: 'נוירולוגית ילדים' },
  { id: 'cdu', he: 'התפתחות הילד' },
  { id: 'cardio', he: 'קרדיולוגית ילדים' },
  { id: 'allergy', he: 'אלרגיה / אימונולוגיה' },
  { id: 'ophtho', he: 'עיניים' },
  { id: 'ortho', he: 'אורתופדיה ילדים' },
]);

export function toggleOrder(list, id) {
  const cur = Array.isArray(list) ? list : [];
  return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
}

export function labelOrders(ids, catalog) {
  return (ids ?? []).map((id) => catalog.find((r) => r.id === id)?.he || id);
}
