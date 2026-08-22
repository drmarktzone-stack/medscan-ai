/**
 * Community-pediatrics coding list for the clinic chart.
 * The physician picks a code for documentation. The engine never assigns ICD.
 * This is a working subset (ICD-10 + common ICD-9), not the full WHO volumes.
 * Status stays draft until a clinic verifies its local codebook.
 */

export const ICD_CATALOG_STATUS = 'draft_needs_verification';

export const ICD_CATALOG = Object.freeze([
  { icd10: 'R50.9', icd9: '780.60', he: 'חום, לא מפורט', en: 'Fever, unspecified', group: 'general' },
  { icd10: 'R05.9', icd9: '786.2', he: 'שיעול', en: 'Cough', group: 'respiratory' },
  { icd10: 'J00', icd9: '460', he: 'נזלת חדה / הצטננות', en: 'Acute nasopharyngitis', group: 'respiratory' },
  { icd10: 'J06.9', icd9: '465.9', he: 'זיהום דרכי נשימה עליונות', en: 'URI, unspecified', group: 'respiratory' },
  { icd10: 'J02.9', icd9: '462', he: 'דלקת לוע חדה', en: 'Acute pharyngitis', group: 'respiratory' },
  { icd10: 'J03.90', icd9: '463', he: 'דלקת שקדים חדה', en: 'Acute tonsillitis', group: 'respiratory' },
  { icd10: 'J20.9', icd9: '466.0', he: 'ברונכיטיס חדה', en: 'Acute bronchitis', group: 'respiratory' },
  { icd10: 'J21.9', icd9: '466.19', he: 'ברונכיוליטיס', en: 'Acute bronchiolitis', group: 'respiratory' },
  { icd10: 'J18.9', icd9: '486', he: 'דלקת ריאות, לא מפורטת', en: 'Pneumonia, unspecified', group: 'respiratory' },
  { icd10: 'J45.909', icd9: '493.90', he: 'אסתמה, לא מפורטת', en: 'Asthma, unspecified', group: 'respiratory' },
  { icd10: 'R06.02', icd9: '786.05', he: 'קוצר נשימה', en: 'Shortness of breath', group: 'respiratory' },
  { icd10: 'H66.90', icd9: '382.9', he: 'דלקת אוזן תיכונה', en: 'Otitis media, unspecified', group: 'ent' },
  { icd10: 'H10.9', icd9: '372.30', he: 'דלקת לחמית', en: 'Conjunctivitis', group: 'ent' },
  { icd10: 'H65.90', icd9: '381.00', he: 'דלקת אוזן תיכונה סרוטית', en: 'Nonsuppurative otitis media', group: 'ent' },
  { icd10: 'R11.10', icd9: '787.03', he: 'הקאה', en: 'Vomiting', group: 'gi' },
  { icd10: 'R19.7', icd9: '787.91', he: 'שלשול', en: 'Diarrhea', group: 'gi' },
  { icd10: 'A09', icd9: '009.0', he: 'גסטרואנטריטיס זיהומית', en: 'Infectious gastroenteritis', group: 'gi' },
  { icd10: 'K59.00', icd9: '564.00', he: 'עצירות', en: 'Constipation', group: 'gi' },
  { icd10: 'R10.9', icd9: '789.00', he: 'כאב בטן', en: 'Abdominal pain', group: 'gi' },
  { icd10: 'K21.9', icd9: '530.81', he: 'רפלוקס קיבה־ושט', en: 'GERD', group: 'gi' },
  { icd10: 'B37.0', icd9: '112.0', he: 'קיכלי בפה', en: 'Oral candidiasis', group: 'gi' },
  { icd10: 'L08.9', icd9: '686.9', he: 'זיהום עור מקומי', en: 'Local skin infection', group: 'skin' },
  { icd10: 'L20.9', icd9: '691.8', he: 'אטופיק דרמטיטיס', en: 'Atopic dermatitis', group: 'skin' },
  { icd10: 'L30.9', icd9: '692.9', he: 'דרמטיטיס, לא מפורטת', en: 'Dermatitis, unspecified', group: 'skin' },
  { icd10: 'B00.9', icd9: '054.9', he: 'הרפס סימפלקס', en: 'Herpesviral infection', group: 'skin' },
  { icd10: 'B01.9', icd9: '052.9', he: 'אבעבועות רוח', en: 'Varicella', group: 'skin' },
  { icd10: 'B02.9', icd9: '053.9', he: 'שלבקת חוגרת', en: 'Zoster', group: 'skin' },
  { icd10: 'B08.4', icd9: '078.10', he: 'יבלות ויראליות', en: 'Viral warts', group: 'skin' },
  { icd10: 'R21', icd9: '782.1', he: 'פריחה לא מפורטת', en: 'Rash and other nonspecific eruption', group: 'skin' },
  { icd10: 'N39.0', icd9: '599.0', he: 'זיהום בדרכי השתן', en: 'UTI', group: 'gu' },
  { icd10: 'N13.30', icd9: '591', he: 'הידרונפרוזיס', en: 'Hydronephrosis', group: 'gu' },
  { icd10: 'R30.0', icd9: '788.1', he: 'צריבה במתן שתן', en: 'Dysuria', group: 'gu' },
  { icd10: 'R51.9', icd9: '784.0', he: 'כאב ראש', en: 'Headache', group: 'neuro' },
  { icd10: 'G40.909', icd9: '345.90', he: 'אפילפסיה, לא מפורטת', en: 'Epilepsy, unspecified', group: 'neuro' },
  { icd10: 'R56.9', icd9: '780.39', he: 'פרכוס, לא מפורט', en: 'Unspecified convulsions', group: 'neuro' },
  { icd10: 'G43.909', icd9: '346.90', he: 'מיגרנה, לא מפורטת', en: 'Migraine, unspecified', group: 'neuro' },
  { icd10: 'F90.9', icd9: '314.01', he: 'הפרעת קשב וריכוז', en: 'ADHD, unspecified', group: 'neurodev' },
  { icd10: 'F84.0', icd9: '299.00', he: 'אוטיזם', en: 'Autistic disorder', group: 'neurodev' },
  { icd10: 'R62.50', icd9: '783.40', he: 'עיכוב התפתחותי לא מפורט', en: 'Unspecified lack of expected development', group: 'neurodev' },
  { icd10: 'F80.9', icd9: '315.39', he: 'הפרעת דיבור/שפה', en: 'Developmental disorder of speech', group: 'neurodev' },
  { icd10: 'E66.9', icd9: '278.00', he: 'השמנה', en: 'Obesity, unspecified', group: 'growth' },
  { icd10: 'E44.1', icd9: '263.1', he: 'תת־תזונה קלה', en: 'Mild protein-calorie malnutrition', group: 'growth' },
  { icd10: 'R62.51', icd9: '783.41', he: 'כשל בשגשוג', en: 'Failure to thrive', group: 'growth' },
  { icd10: 'E34.3', icd9: '783.43', he: 'קומה נמוכה', en: 'Short stature', group: 'growth' },
  { icd10: 'E03.9', icd9: '244.9', he: 'היפותירואידיזם', en: 'Hypothyroidism', group: 'endo' },
  { icd10: 'E10.9', icd9: '250.01', he: 'סוכרת סוג 1 ללא סיבוך', en: 'Type 1 diabetes without complications', group: 'endo' },
  { icd10: 'D64.9', icd9: '285.9', he: 'אנמיה, לא מפורטת', en: 'Anemia, unspecified', group: 'heme' },
  { icd10: 'D50.9', icd9: '280.9', he: 'אנמיית חסר ברזל', en: 'Iron deficiency anemia', group: 'heme' },
  { icd10: 'R53.83', icd9: '780.79', he: 'עייפות / חולשה', en: 'Other fatigue', group: 'general' },
  { icd10: 'R09.81', icd9: '784.91', he: 'גודש באף', en: 'Nasal congestion', group: 'respiratory' },
  { icd10: 'S09.90XA', icd9: '959.01', he: 'חבלה בראש, מגע ראשון', en: 'Unspecified injury of head, initial', group: 'trauma' },
  { icd10: 'T14.90XA', icd9: '959.9', he: 'חבלה לא מפורטת', en: 'Unspecified injury', group: 'trauma' },
  { icd10: 'T18.1XXA', icd9: '935.1', he: 'גוף זר בוושט', en: 'Foreign body in esophagus', group: 'tox' },
  { icd10: 'T50.901A', icd9: '977.9', he: 'הרעלה / בליעת חומר, לא מפורט', en: 'Poisoning, unspecified, initial', group: 'tox' },
  { icd10: 'Z00.129', icd9: 'V20.2', he: 'ביקור שגרה לילד בריא', en: 'Routine child health examination', group: 'preventive' },
  { icd10: 'Z23', icd9: 'V03.9', he: 'מפגש לחיסון', en: 'Encounter for immunization', group: 'preventive' },
  { icd10: 'Z71.3', icd9: 'V65.3', he: 'ייעוץ תזונתי', en: 'Dietary counseling', group: 'preventive' },
  { icd10: 'Z13.4', icd9: 'V79.3', he: 'סקר התפתחות', en: 'Encounter for developmental screening', group: 'preventive' },
  { icd10: 'Z02.0', icd9: 'V70.3', he: 'בדיקה למסגרת חינוכית', en: 'Examination for administrative purposes', group: 'preventive' },
  { icd10: 'J45.20', icd9: '493.00', he: 'אסתמה קלה, לסירוגין', en: 'Mild intermittent asthma', group: 'respiratory' },
  { icd10: 'B34.9', icd9: '079.99', he: 'זיהום ויראלי לא מפורט', en: 'Viral infection, unspecified', group: 'general' },
  { icd10: 'A38.9', icd9: '034.1', he: 'קדחת השנית', en: 'Scarlet fever', group: 'id' },
  { icd10: 'A37.90', icd9: '033.9', he: 'שעלת, לא מפורטת', en: 'Whooping cough, unspecified', group: 'id' },
  { icd10: 'B26.9', icd9: '072.9', he: 'חזרת', en: 'Mumps', group: 'id' },
  { icd10: 'B05.9', icd9: '055.9', he: 'חצבת', en: 'Measles', group: 'id' },
  { icd10: 'B06.9', icd9: '056.9', he: 'אדמת', en: 'Rubella', group: 'id' },
  { icd10: 'A69.20', icd9: '088.81', he: 'מחלת ליים', en: 'Lyme disease, unspecified', group: 'id' },
  { icd10: 'M79.1', icd9: '729.1', he: 'מיאלגיה', en: 'Myalgia', group: 'ms' },
  { icd10: 'M25.50', icd9: '719.40', he: 'כאב מפרק', en: 'Pain in unspecified joint', group: 'ms' },
  { icd10: 'R42', icd9: '780.4', he: 'סחרחורת', en: 'Dizziness', group: 'neuro' },
  { icd10: 'H93.90', icd9: '388.70', he: 'הפרעת אוזן לא מפורטת', en: 'Unspecified ear disorder', group: 'ent' },
  { icd10: 'K52.9', icd9: '558.9', he: 'גסטרואנטריטיס לא־זיהומית', en: 'Noninfective gastroenteritis', group: 'gi' },
  { icd10: 'L50.9', icd9: '708.9', he: 'אורטיקריה', en: 'Urticaria', group: 'skin' },
  { icd10: 'T78.40XA', icd9: '995.3', he: 'אלרגיה לא מפורטת', en: 'Allergy, unspecified, initial', group: 'allergy' },
  { icd10: 'T78.2XXA', icd9: '995.0', he: 'הלם אנפילקטי, לא מפורט', en: 'Anaphylactic shock, initial', group: 'allergy' },
  { icd10: 'J30.9', icd9: '477.9', he: 'נזלת אלרגית', en: 'Allergic rhinitis', group: 'allergy' },
  { icd10: 'L50.0', icd9: '708.0', he: 'אורטיקריה אלרגית', en: 'Allergic urticaria', group: 'allergy' },
  { icd10: 'Z87.892', icd9: 'V15.06', he: 'היסטוריה של אלרגיה', en: 'Personal history of anaphylaxis', group: 'allergy' },
  { icd10: 'P07.30', icd9: '765.10', he: 'פג, לא מפורט', en: 'Preterm newborn, unspecified', group: 'neonate' },
  { icd10: 'P59.9', icd9: '774.6', he: 'צהבת יילוד', en: 'Neonatal jaundice, unspecified', group: 'neonate' },
  { icd10: 'Q21.0', icd9: '745.4', he: 'VSD', en: 'Ventricular septal defect', group: 'cardiac' },
  { icd10: 'Q21.1', icd9: '745.5', he: 'ASD', en: 'Atrial septal defect', group: 'cardiac' },
  { icd10: 'I10', icd9: '401.9', he: 'יתר לחץ דם', en: 'Essential hypertension', group: 'cardiac' },
  { icd10: 'R00.0', icd9: '785.0', he: 'טכיקרדיה', en: 'Tachycardia, unspecified', group: 'cardiac' },
  { icd10: 'R00.1', icd9: '427.89', he: 'ברדיקרדיה', en: 'Bradycardia, unspecified', group: 'cardiac' },
  { icd10: 'F41.9', icd9: '300.00', he: 'חרדה, לא מפורטת', en: 'Anxiety, unspecified', group: 'psych' },
  { icd10: 'F32.9', icd9: '296.20', he: 'דיכאון, לא מפורט', en: 'Depressive episode, unspecified', group: 'psych' },
  { icd10: 'G47.00', icd9: '780.52', he: 'נדודי שינה', en: 'Insomnia', group: 'psych' },
  { icd10: 'Z76.2', icd9: 'V68.9', he: 'ליווי / אישור רפואי', en: 'Encounter for health supervision', group: 'admin' },
]);

function norm(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
}

export function searchIcd(query, { limit = 20, catalog = ICD_CATALOG } = {}) {
  const q = norm(query);
  if (!q) return catalog.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const row of catalog) {
    const blob = norm(`${row.icd10} ${row.icd9} ${row.he} ${row.en} ${row.group}`);
    if (tokens.every((t) => blob.includes(t) || row.icd10.toLowerCase().startsWith(t) || String(row.icd9).startsWith(t))) {
      scored.push(row);
    }
  }
  return scored.slice(0, limit);
}

export function findIcd(code, catalog = ICD_CATALOG) {
  const c = String(code || '').trim().toLowerCase();
  if (!c) return null;
  return catalog.find((r) => r.icd10.toLowerCase() === c || String(r.icd9).toLowerCase() === c) ?? null;
}

/** Physician-entered code that is not in the subset. Still documentation, never an engine diagnosis. */
export function manualIcdEntry({ icd10 = '', icd9 = '', label_he = '' } = {}) {
  const ten = String(icd10 || '').trim().toUpperCase();
  const nine = String(icd9 || '').trim();
  const he = String(label_he || '').trim();
  if (!ten && !nine) return { ok: false, reason: 'code_required' };
  return {
    ok: true,
    row: {
      icd10: ten || null,
      icd9: nine || null,
      he: he || ten || nine,
      en: he || ten || nine,
      group: 'manual',
      source: 'physician_manual',
      verification_status: ICD_CATALOG_STATUS,
    },
  };
}

export function toChartDiagnosis(row, { source = 'physician' } = {}) {
  if (!row) return null;
  return {
    icd10: row.icd10 ?? null,
    icd9: row.icd9 ?? null,
    label_he: row.he,
    label_en: row.en,
    group: row.group ?? null,
    source,
    verification_status: ICD_CATALOG_STATUS,
    engine_assigned: false,
  };
}
