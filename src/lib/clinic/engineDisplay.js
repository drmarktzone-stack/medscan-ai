/**
 * Hebrew display helpers for deterministic engine output.
 * Does not invent clinical content — only maps known reason codes and field names.
 */

export const ENGINE_REASON_HE = Object.freeze({
  age_required: "יש למלא גיל — שנים וחודשים יחד.",
  weight_required: "יש למלא משקל בקילוגרמים.",
  no_genetics_input: "יש לסמן לפחות תו דיסמורפי אחד.",
  no_input: "אין מספיק נתונים להרצה.",
  missing_alpha: "יש למלא זווית גראף (אלפא).",
  unknown_analyte: "מדד לא מזוהה.",
  no_band: "אין טווח ייחוס לגיל הזה.",
  missing_blood_counts: "חסרות ספירות דם להשוואה.",
  rbc_blood_zero: "ספירת כדוריות אדומות בדם היא אפס — לא ניתן לחשב.",
  invalid_mchat: "ציון M-CHAT אינו בטווח 0–20.",
  feeds_out_of_range: "מספר האכלות ליום חייב בין 1 ל-12.",
  instrument_async_or_ui: "הכלי הזה נפתח במסך ייעודי.",
  skipped: "המנוע דולג — חסר קלט.",
  hidden_from_parent: "שדה זה אינו מוצג בממשק הורה.",
  lms_bad: "טבלת LMS אינה תקינה.",
});

export function reasonHe(reason, fallback = "") {
  if (!reason) return fallback;
  return ENGINE_REASON_HE[reason] || fallback || String(reason);
}

export function asArray(value) {
  if (value == null || value === false) return [];
  return Array.isArray(value) ? value : [value];
}

export function displayText(value) {
  if (value == null || value === false) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayText).filter(Boolean).join(" · ");
  }
  if (typeof value === "object") {
    return (
      value.action_he
      || value.label_he
      || value.title_he
      || value.diagnosis_direction_he
      || value.test_he
      || value.message_he
      || value.question_he
      || value.summary_he
      || value.direction_he
      || value.clinical_reasoning_he
      || value.note_he
      || value.pattern_key
      || value.flag_key
      || ""
    );
  }
  return "";
}

export function joinHe(value) {
  const list = asArray(value).map(displayText).filter(Boolean);
  return list.join(" ");
}
