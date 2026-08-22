/**
 * Shared safety contract for on-device vision tools.
 * Incomplete read ≠ normal. Never tell the clinician "no finding"
 * when pixels were not measured or a hosted perception pass did not run.
 */

export const INCOMPLETE_HEADLINE_HE = {
  ecg: "אין פענוח מלא מהתמונה — לא ניתן לשלול אוטם או איסכמיה",
  radiology: "אין פענוח מלא מהתמונה — לא ניתן לשלול ממצא בהדמיה",
  skin: "אין פענוח מלא מהתמונה — לא ניתן לשלול ממצא בעור",
};

export const INCOMPLETE_GUIDELINE_HE = {
  ecg: "חובה קריאה ידנית על ידי רופא. אין להסיק שקטע ST תקין בלי כיול ומורפולוגיה.",
  radiology: "חובה הערכת רופא/רדיולוג. מדידת פיקסלים אינה פענוח.",
  skin: "חובה הערכת רופא/ת עור. מדידת פיקסלים אינה אבחנת נגע.",
};

export function isOnDeviceDraft(result) {
  return Boolean(result?.on_device);
}

export function cannotCallNormalVision(result) {
  if (!result) return false;
  if (result.on_device) return true;
  if (result.incomplete_read) return true;
  if (result.structured?.interpretable === false) return true;
  return false;
}
