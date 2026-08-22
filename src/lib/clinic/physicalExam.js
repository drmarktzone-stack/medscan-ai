/**
 * Structured physical-exam answers for the clinic chart.
 * Options are documentation pick-lists. Tokens feed existing MedScan engines.
 * This is not a scored exam and not a diagnosis.
 */

export const EXAM_SYSTEMS = Object.freeze([
  Object.freeze({
    id: 'general',
    title_he: 'כללי / מראה',
    options: [
      { id: 'general.well', label_he: 'נראה טוב, ערני, משחק', tokens: [], features: { alert: true } },
      { id: 'general.irritable', label_he: 'עצבני / לא נח', tokens: ['irritable'], features: {} },
      { id: 'general.lethargy', label_he: 'ישנוני / אפתי / לא מגיב', tokens: ['lethargy'], features: { lethargy: true } },
      { id: 'general.toxic', label_he: 'מראה טוקסי / חולה מאוד', tokens: ['toxic appearance'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'heent',
    title_he: 'ראש / עיניים / אוזניים / לוע',
    options: [
      { id: 'heent.normal', label_he: 'אוזניים, לוע ועיניים ללא ממצא', tokens: [], features: {} },
      { id: 'heent.om', label_he: 'עור תוף אדום / בלט — חשד לדלקת אוזן', tokens: ['ear pain'], features: {} },
      { id: 'heent.pharynx', label_he: 'לוע אדום / שקדים מוגדלים', tokens: ['pharyngitis'], features: {} },
      { id: 'heent.conj', label_he: 'הזרקת לחמית / הפרשה', tokens: ['conjunctivitis'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'neck',
    title_he: 'צוואר',
    options: [
      { id: 'neck.normal', label_he: 'צוואר רך, ללא קשריות בולטות', tokens: [], features: {} },
      { id: 'neck.nodes', label_he: 'לימפאדנופתיה צווארית', tokens: ['cervical lymphadenopathy'], features: {} },
      { id: 'neck.stiff', label_he: 'נוקשות עורף', tokens: ['neck stiffness'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'lungs',
    title_he: 'ריאות',
    options: [
      { id: 'lungs.normal', label_he: 'כניסת אוויר טובה דו־צדדית, ללא חרחורים', tokens: [], features: {} },
      { id: 'lungs.wheeze', label_he: 'צפצופים', tokens: ['wheeze'], features: {} },
      { id: 'lungs.crackles', label_he: 'חרחורים', tokens: ['crackle'], features: {} },
      { id: 'lungs.distress', label_he: 'מצוקה נשימתית / רתיעות / סטרידור', tokens: ['difficulty breathing', 'stridor'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'heart',
    title_he: 'לב',
    options: [
      { id: 'heart.normal', label_he: 'קולות לב תקינים, ללא אוושה', tokens: [], features: {} },
      { id: 'heart.murmur', label_he: 'אוושה', tokens: ['murmur'], features: {} },
      { id: 'heart.tachy', label_he: 'טכיקרדיה לא תואמת חום', tokens: ['tachycardia'], features: { hr_flag: 'high' } },
    ],
  }),
  Object.freeze({
    id: 'abdomen',
    title_he: 'בטן',
    options: [
      { id: 'abdomen.normal', label_he: 'בטן רכה, ללא רגישות, ללא הגדלת איברים', tokens: [], features: {} },
      { id: 'abdomen.tender', label_he: 'רגישות בטנית', tokens: ['abdominal pain'], features: {} },
      { id: 'abdomen.periton', label_he: 'בטן חדה / סימני גירוי צפקי', tokens: ['acute abdomen'], features: {} },
      { id: 'abdomen.hepato', label_he: 'הפטוספלנומגליה', tokens: ['hepatosplenomegaly'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'skin',
    title_he: 'עור',
    options: [
      { id: 'skin.normal', label_he: 'ללא פריחה', tokens: [], features: {} },
      { id: 'skin.rash', label_he: 'פריחה מלבינה', tokens: ['rash'], features: { rash: true } },
      { id: 'skin.petechiae', label_he: 'פטכיות / פורפורה / אינה מלבינה', tokens: ['non-blanching rash', 'petechiae'], features: { petechiae: true, rash: true } },
      { id: 'skin.urticaria', label_he: 'אורטיקריה', tokens: ['urticaria'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'neuro',
    title_he: 'עצבים',
    options: [
      { id: 'neuro.normal', label_he: 'ערני, ללא סימן מוקדי, הליכה תקינה לגיל', tokens: [], features: { no_focal: true } },
      { id: 'neuro.focal', label_he: 'חסר מוקדי / חולשה / ראייה כפולה', tokens: ['focal deficit'], features: { focal_deficit: true } },
      { id: 'neuro.seizure', label_he: 'פרכוס בזמן הבדיקה / לאחר פרכוס', tokens: ['seizure'], features: {} },
      { id: 'neuro.meningeal', label_he: 'סימנים מנינגיאליים', tokens: ['meningism'], features: {} },
    ],
  }),
  Object.freeze({
    id: 'ms',
    title_he: 'שלד־שריר / הליכה',
    options: [
      { id: 'ms.normal', label_he: 'טווח תנועה מלא, ללא צליעה', tokens: [], features: {} },
      { id: 'ms.limp', label_he: 'צליעה / סירוב לדרוך', tokens: ['limp'], features: {} },
      { id: 'ms.joint', label_he: 'מפרק נפוח / חם', tokens: ['arthritis'], features: {} },
    ],
  }),
]);

export function getExamOption(systemId, optionId) {
  const sys = EXAM_SYSTEMS.find((s) => s.id === systemId);
  return sys?.options.find((o) => o.id === optionId) ?? null;
}

export function examToSignals(exam = {}) {
  const tokens = [];
  const features = {};
  for (const sys of EXAM_SYSTEMS) {
    const chosen = exam[sys.id];
    const opt = getExamOption(sys.id, chosen);
    if (!opt) continue;
    tokens.push(...(opt.tokens ?? []));
    Object.assign(features, opt.features ?? {});
  }
  return { tokens: [...new Set(tokens)], features };
}

/** Recorded vitals → tokens the existing triage already understands. Not a diagnosis. */
export function vitalsToSignals(vitals = {}) {
  const tokens = [];
  const features = {};
  const temp = Number(vitals.temp);
  if (Number.isFinite(temp) && temp >= 38) {
    tokens.push('fever');
    features.fever = true;
  }
  const spo2 = Number(vitals.spo2);
  if (Number.isFinite(spo2) && spo2 > 0 && spo2 < 92) {
    tokens.push('difficulty breathing');
    features.hypoxia = true;
  }
  const gcs = Number(vitals.gcs);
  if (Number.isFinite(gcs) && gcs > 0 && gcs <= 14) {
    features.low_gcs = true;
  }
  return { tokens, features };
}

export function mergeChartFindings({ findings = [], exam = {}, vitals = {} } = {}) {
  const fromExam = examToSignals(exam);
  const fromVitals = vitalsToSignals(vitals);
  return {
    findings: [...new Set([...(findings ?? []), ...fromExam.tokens, ...fromVitals.tokens])],
    features: { ...fromExam.features, ...fromVitals.features },
  };
}
