/**
 * Map raw JS / network failures to a Hebrew fail-closed message.
 * The radiology page was showing "runRadiologyFastAnalysis is not defined"
 * to the physician — that is a loader bug, not a clinical result.
 */

const JS_INTERNALS = /is not defined|is not a function|Cannot access .+ before initialization|ReferenceError|TypeError|SyntaxError|undefined is not|Cannot read propert/i;
const NETWORK = /Failed to fetch|NetworkError|Load failed|Invalid URL|ERR_NETWORK|Failed to load|dynamically imported module/i;

export function humanizeAnalysisError(err, fallback) {
  const raw = String(err?.message || err || "").trim();
  const heFallback = fallback || "אירעה שגיאה במהלך הניתוח. נסה שנית.";

  if (!raw) return heFallback;

  if (JS_INTERNALS.test(raw) || /run(Radiology|Ecg|Skin)FastAnalysis/i.test(raw)) {
    return "כלי פענוח הצילום לא נטען. רענן את העמוד. אק״ג, עור וצילום אמורים לרוץ כטיוטה במכשיר גם בלי Base44.";
  }
  if (NETWORK.test(raw)) {
    return "אין חיבור לשרת הפענוח. בדקו את החיבור ליישום Base44 ונסו שוב.";
  }
  if (/[\u0590-\u05FF]/.test(raw)) return raw;
  if (raw.length < 160 && /at |Error:|exception/i.test(raw)) return heFallback;
  return raw || heFallback;
}
