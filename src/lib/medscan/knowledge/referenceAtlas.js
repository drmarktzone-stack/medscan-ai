/**
 * Reference atlas — text descriptors for side-by-side comparison.
 *
 * These are NOT diagnoses and NOT the tool's output. They are the reference
 * pattern a clinician compares the case against, so the comparison panel works
 * even when the hosted knowledge base is empty (standalone / GitHub Pages).
 *
 * Images are intentionally absent: an atlas image only enters through
 * `validateAtlasRecord` with an explicit source and license.
 */

const DRAFT = "draft_needs_verification";

function entry(rec) {
  return {
    ...rec,
    image_url: "",
    image_source: "",
    license: "",
    verification_status: DRAFT,
    atlas_seed: true,
  };
}

export const ECG_ATLAS = [
  entry({
    key: "stemi",
    category: "ecg",
    title: "דפוס STEMI — עליית ST טריטוריאלית",
    diagnosis: "STEMI pattern",
    tags: ["st_elevation", "territorial", "emergency"],
    key_features: "ST elevation in ≥2 contiguous leads; reciprocal depression",
    diagnostic_criteria: "≥1mm limb / ≥2mm V2-V3 in ≥2 contiguous leads (4th Universal Definition of MI)",
    urgent: true,
  }),
  entry({
    key: "stemi_in_lbbb_sgarbossa",
    category: "ecg",
    title: "עליית ST בנוכחות LBBB — Sgarbossa",
    diagnosis: "Sgarbossa criteria in LBBB",
    tags: ["lbbb", "st_elevation", "discordance"],
    key_features: "Concordant ST elevation ≥1mm, concordant depression V1-V3, or discordant elevation ≥5mm",
    diagnostic_criteria: "Sgarbossa / modified Smith criteria — ordinary STEMI thresholds do not apply",
    urgent: true,
  }),
  entry({
    key: "ischemia_st_depression",
    category: "ecg",
    title: "שקיעת ST — איסכמיה",
    diagnosis: "ST depression / ischemia",
    tags: ["st_depression", "ischemia"],
    key_features: "Horizontal or downsloping ST depression; consider posterior mirror in V1-V3",
    diagnostic_criteria: "ST depression ≥0.5mm in ≥2 contiguous leads",
    urgent: true,
  }),
  entry({
    key: "long_qt",
    category: "ecg",
    title: "QT מאורך",
    diagnosis: "Long QT",
    tags: ["qtc", "repolarization"],
    key_features: "QTc above the sex-specific upper limit",
    diagnostic_criteria: "QTc(Bazett) >450ms male / >460ms female",
    urgent: true,
  }),
  entry({
    key: "lbbb",
    category: "ecg",
    title: "חסם צרור שמאלי (LBBB)",
    diagnosis: "LBBB complete",
    tags: ["conduction", "wide_qrs"],
    key_features: "QRS ≥120ms, broad notched R in I/V6, dominant S in V1",
    diagnostic_criteria: "QRS ≥120ms with LBBB morphology",
  }),
  entry({
    key: "rbbb",
    category: "ecg",
    title: "חסם צרור ימני (RBBB)",
    diagnosis: "RBBB complete",
    tags: ["conduction", "wide_qrs"],
    key_features: "QRS ≥120ms, rsR' in V1, wide S in I/V6",
    diagnostic_criteria: "QRS ≥120ms with RBBB morphology",
  }),
  entry({
    key: "atrial_fibrillation",
    category: "ecg",
    title: "פרפור עליות",
    diagnosis: "Atrial fibrillation",
    tags: ["rhythm", "irregular", "no_p"],
    key_features: "Irregularly irregular R–R, no discrete P waves",
    diagnostic_criteria: "Absent P waves with irregularly irregular ventricular response",
  }),
  entry({
    key: "pericarditis_pattern",
    category: "ecg",
    title: "דפוס פריקרדיטיס",
    diagnosis: "Pericarditis pattern",
    tags: ["st_elevation", "diffuse", "pr_depression"],
    key_features: "Diffuse concave ST elevation with PR depression, no single territory",
    diagnostic_criteria: "Diffuse concave STE + PR depression, no reciprocal territory",
  }),
  entry({
    key: "hyperkalemia",
    category: "ecg",
    title: "היפרקלמיה",
    diagnosis: "Hyperkalemia pattern",
    tags: ["peaked_t", "wide_qrs", "electrolyte"],
    key_features: "Peaked symmetric T waves, flattened P, widening QRS",
    diagnostic_criteria: "ECG pattern only — confirm with serum potassium",
    urgent: true,
  }),
  entry({
    key: "st_change_screen",
    category: "ecg",
    title: "חשד לשינוי ST בסריקת פיקסלים",
    diagnosis: "Uncalibrated ST-segment change on image",
    tags: ["st_elevation", "screen", "uncalibrated"],
    key_features: "Relative deviation after R peaks on an uncalibrated photo",
    diagnostic_criteria: "Screening marker only — requires manual reading",
    urgent: true,
  }),
];

export const SKIN_ATLAS = [
  entry({
    key: "melanoma",
    category: "skin",
    title: "מלנומה — סימני אזהרה",
    diagnosis: "Melanoma warning pattern",
    tags: ["pigmented", "asymmetry", "irregular_border", "multicolour"],
    key_features: "Asymmetry, irregular border, ≥3 colours, diameter growth, evolution",
    diagnostic_criteria: "ABCDE / 7-point checklist — dermoscopy and biopsy decide",
    urgent: true,
  }),
  entry({
    key: "basal_cell_carcinoma",
    category: "skin",
    title: "קרצינומה של תאי בסיס",
    diagnosis: "Basal cell carcinoma",
    tags: ["pearly", "telangiectasia", "ulcer"],
    key_features: "Pearly papule, arborizing vessels, rolled border, central ulcer",
    diagnostic_criteria: "Dermoscopic vessel pattern — biopsy confirms",
  }),
  entry({
    key: "benign_nevus",
    category: "skin",
    title: "נבוס שפיר",
    diagnosis: "Benign melanocytic nevus",
    tags: ["pigmented", "symmetric", "regular_border"],
    key_features: "Symmetric, uniform colour, regular network",
    diagnostic_criteria: "Symmetry and a single dermoscopic pattern",
  }),
  entry({
    key: "petechiae_purpura",
    category: "skin",
    title: "פטכיות / פורפורה",
    diagnosis: "Non-blanching petechiae or purpura",
    tags: ["non_blanching", "red_flag", "fever"],
    key_features: "Non-blanching red-purple macules; with fever it is an emergency pattern",
    diagnostic_criteria: "Non-blanching on pressure — urgent assessment with fever",
    urgent: true,
  }),
  entry({
    key: "atopic_dermatitis",
    category: "skin",
    title: "אטופיק דרמטיטיס",
    diagnosis: "Atopic dermatitis",
    tags: ["eczema", "flexural", "itch", "pediatric"],
    key_features: "Ill-defined erythematous scaly plaques, flexural in older children, facial in infants",
    diagnostic_criteria: "Clinical pattern with itch and chronic relapsing course",
  }),
  entry({
    key: "impetigo",
    category: "skin",
    title: "אימפטיגו",
    diagnosis: "Impetigo",
    tags: ["crust", "honey_coloured", "infection", "pediatric"],
    key_features: "Honey-coloured crusted erosions, often perioral",
    diagnostic_criteria: "Clinical morphology; swab when atypical",
  }),
  entry({
    key: "urticaria",
    category: "skin",
    title: "אורטיקריה",
    diagnosis: "Urticaria",
    tags: ["wheal", "transient", "blanching"],
    key_features: "Transient blanching wheals, individual lesions resolve within 24h",
    diagnostic_criteria: "Migratory wheals — check for angioedema and anaphylaxis",
  }),
];

export const RADIOLOGY_ATLAS = [
  entry({
    key: "pneumothorax",
    category: "radiology",
    title: "חזה אוויר",
    diagnosis: "Pneumothorax",
    tags: ["chest", "pleural_line", "emergency"],
    key_features: "Visible visceral pleural line with absent lung markings peripherally",
    diagnostic_criteria: "Pleural line on upright film; tension is a clinical diagnosis",
    urgent: true,
  }),
  entry({
    key: "lobar_pneumonia",
    category: "radiology",
    title: "תסנין לובארי",
    diagnosis: "Lobar consolidation",
    tags: ["chest", "consolidation", "air_bronchogram"],
    key_features: "Homogeneous opacity with air bronchograms confined to a lobe",
    diagnostic_criteria: "Consolidation with clinical correlation",
  }),
  entry({
    key: "pleural_effusion",
    category: "radiology",
    title: "תפליט פלאורלי",
    diagnosis: "Pleural effusion",
    tags: ["chest", "blunted_angle", "meniscus"],
    key_features: "Blunted costophrenic angle, meniscus sign, layering on decubitus",
    diagnostic_criteria: "Dependent opacity with meniscus",
  }),
  entry({
    key: "supracondylar_fracture",
    category: "radiology",
    title: "שבר סופרה-קונדילרי",
    diagnosis: "Supracondylar humerus fracture",
    tags: ["bone", "elbow", "fat_pad", "pediatric"],
    key_features: "Posterior fat pad sign, disrupted anterior humeral line",
    diagnostic_criteria: "Lateral elbow view — fat pad and anterior humeral line",
    urgent: true,
  }),
  entry({
    key: "bowel_obstruction",
    category: "radiology",
    title: "חסימת מעי",
    diagnosis: "Bowel obstruction",
    tags: ["abdomen", "air_fluid_levels", "dilated_loops"],
    key_features: "Dilated loops with air-fluid levels, paucity of distal gas",
    diagnostic_criteria: "Upright/decubitus abdominal film with clinical correlation",
    urgent: true,
  }),
  entry({
    key: "free_air",
    category: "radiology",
    title: "אוויר חופשי",
    diagnosis: "Pneumoperitoneum",
    tags: ["abdomen", "free_air", "emergency"],
    key_features: "Free subdiaphragmatic air on an upright film",
    diagnostic_criteria: "Upright chest/abdomen — surgical emergency pattern",
    urgent: true,
  }),
];

const BY_MODALITY = { ecg: ECG_ATLAS, skin: SKIN_ATLAS, radiology: RADIOLOGY_ATLAS };

export function atlasFor(modality) {
  return BY_MODALITY[modality] || [];
}

/** Exact key lookup — used when our own engine already named the pattern. */
export function atlasByKey(modality, key) {
  if (!key) return null;
  return atlasFor(modality).find((e) => e.key === key) || null;
}

/**
 * Merge the hosted knowledge base with the seed atlas.
 * Hosted cases come first: a real licensed image beats a text descriptor.
 */
export function withAtlasFallback(modality, cases) {
  const hosted = Array.isArray(cases) ? cases.filter(Boolean) : [];
  return [...hosted, ...atlasFor(modality)];
}
