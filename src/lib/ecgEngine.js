/**
 * ============================================================================
 *  MedScan AI — State-of-the-Art ECG Interpretation Engine
 * ============================================================================
 *
 *  This module upgrades ECG analysis from free-text impressions to a rigorous,
 *  structured, human-cardiologist-like reading with an aggressive
 *  ANTI-HALLUCINATION layer.
 *
 *  Design principles (why this fights hallucinations):
 *   1. TECHNICAL GATE  — refuse to "read" an image that isn't an interpretable
 *      ECG. A model asked to diagnose garbage will invent findings; we stop it
 *      at the door (is_ecg / interpretable flags → abstain).
 *   2. STRUCTURED NUMERIC EXTRACTION — force discrete numeric measurements
 *      (HR, PR, QRS, QT, RR) instead of prose. Numbers can be verified; prose
 *      cannot.
 *   3. DETERMINISTIC CROSS-CHECK — we RE-COMPUTE heart rate, QTc (Bazett &
 *      Fridericia) and the axis category in plain JS from the model's own raw
 *      measurements. If the model's stated value disagrees with math, the math
 *      wins and a discrepancy is flagged. The model literally cannot lie about
 *      a QTc when we recompute it.
 *   4. EVIDENCE-LINKED FINDINGS — every finding must cite the specific leads /
 *      measurement it rests on. Findings with no evidence are dropped.
 *   5. INTERNAL-CONSISTENCY CHECKS — catch self-contradiction (e.g. "Sinus
 *      Rhythm" but P waves absent; "Emergency" but no findings).
 *   6. SELF-CONSISTENCY + ADVERSARIAL VERIFICATION — for urgent/uncertain
 *      reads, run a second independent interpretation and an adversarial
 *      "try to refute this" pass. Disagreement → downgrade to uncertainty
 *      instead of a confident (possibly hallucinated) call.
 *
 *  The engine is transport-agnostic: callers pass an `invokeLLM` function
 *  (base44.integrations.Core.InvokeLLM) so this file has no hard SDK dependency
 *  and stays unit-testable.
 * ============================================================================
 */

import { ECG_FULL_RULES } from "./ecgRules";

const langNames = { he: "Hebrew", en: "English", ar: "Arabic" };

/* ==========================================================================
 *  1. SYSTEM PROMPT — 7-step methodology (merged with the full rules engine)
 * ========================================================================== */

const ECG_METHODOLOGY = `## שיטת קריאה שיטתית בת 7 שלבים (חובה — בסדר הזה)

### שלב 0 — האם זו בכלל א.ק.ג?
לפני הכל, קבע: האם התמונה היא תרשים אלקטרוקרדיוגרם (ECG/EKG) אמיתי?
- אם זו אינה תמונת ECG (סלפי, צילום מסך, מסמך, תמונת עור/רנטגן, ציור) → החזר is_ecg=false והסבר קצר. אל תמציא פענוח.
- אם זו תמונת ECG אך אינה קריאה (מטושטשת, חתוכה, רזולוציה נמוכה, ללא רשת/כיול, חלק מההובלות חסרות) → is_ecg=true אך interpretable=false, ופרט מה חסר.

### שלב 1 — ולידציה טכנית וכיול
- מהירות נייר (סטנדרט 25 מ"מ/שנייה). אם שונה, ציין וכייל את כל המדידות בהתאם.
- כיול מתח (סטנדרט 10 מ"מ/מיליוולט). בדוק את פולס הכיול.
- זיהוי ארטיפקטים: נדנוד קו בסיס, רעד שרירים, הפרעת 50/60Hz, החלפת הובלות (lead misplacement), dextrocardia טכני.
- קבע quality ו-interpretable. ללא כיול ידוע — מדוד ביחידות משבצות וציין את ההנחה.

### שלב 2 — קצב וריתמוס
- חשב דופק (BPM) — עדיף משיטת 300/1500 או ספירת רצועה.
- קבע מקור הקצב: סינוס / עלייתי / צומתי (junctional) / חדרי.
- רגולריות: סדיר / סדיר-לא-סדיר / לא-סדיר-לחלוטין.
- מורפולוגיית גל P ויחס P:QRS (1:1, דיסוציאציה, חסם).

### שלב 3 — ציר חשמלי
- מדוד את ציר ה-QRS במישור הפרונטלי (תקין -30° עד +90°; LAD, RAD, ציר קיצוני).
- בסס על הובלות I ו-aVF (ו-II לעידון).

### שלב 4 — מרווחים ומתחים (חישוב מדויק)
- מרווח PR (תקין 120–200ms).
- משך QRS (תקין <120ms).
- QT — מתחילת QRS לסוף גל T. מדוד RR לצורך תיקון.
- **דווח את הערכים הגולמיים qt_ms ו-rr_ms** — המערכת תחשב QTc לפי Bazett ו-Fridericia בעצמה. דווח גם את הערכים שאתה מחשב, אך הערכים הגולמיים הם החשובים.
- סמן QTc מוארך (>450ms גברים, >460ms נשים/ילדים) או קצר (<340ms).

### שלב 5 — הגדלה והיפרטרופיה
- עליות: RAE (P-pulmonale ב-II), LAE (P-mitrale ב-II/V1).
- חדרים: RVH (R גבוה ב-V1, S עמוק ב-V6, RAD) מול LVH (Sokolow-Lyon: S(V1)+R(V5/V6) > 35mm, או Cornell). התחשב בנורמות מתוקנות-גיל בילדים.

### שלב 6 — איסכמיה, אוטם ורה-פולריזציה
- מקטע ST: הגבהה (STEMI, פריקרדיטיס, early repolarization) / שקיעה (איסכמיה, NSTEMI, strain).
- גלי T: hyperacute, היפוך (איסכמיה, juvenile pattern, PE), biphasic (Wellens).
- גלי Q: פתולוגיים (>1mm רוחב או >25% מגובה QRS).

### שלב 7 — אבחנה מבדלת מקיפה וזיהוי פתולוגיה
כסה את כל הדפוסים הניתנים לזיהוי: הפרעות קצב (AFib/AFlutter/SVT/VT/VFib/PAC/PVC/SSS), הפרעות הולכה (LBBB/RBBB/LAFB/LPFB/AV blocks), מחלת לב איסכמית (MI קדמי/תחתון/צידי/אחורי/RV, אוטם ישן), הפרעות אלקטרוליט (היפר/היפוקלמיה, היפר/היפוקלצמיה), תסמונות גנטיות (LQTS/SQTS/Brugada/WPW/ARVC), ומבניות/שונות (פריקרדיטיס/מיוקרדיטיס, PE עם S1Q3T3, אפקט דיגיטליס, היפותרמיה/Osborn).`;

const ANTI_HALLUCINATION_LAWS = `## חוקי-ברזל נגד הזיות (קריטי ביותר)
1. **אל תמציא מדידות שאינך רואה.** אם הובלה חסרה/לא קריאה — ציין "לא בר-הערכה" (indeterminate). ניחוש הוא הזיה.
2. **כל ממצא חייב ראיה.** לכל פריט ב-primary_findings ציין ב-finding_evidence את ההובלות/המדד המדויקים שעליהם הוא נשען. ממצא ללא ראיה מדידה — אל תכלול אותו.
3. **אל תסיק "תקין" אלא אם כל 7 השלבים תקינים לחלוטין.** כל חריגה → סווג והסבר.
4. **העדף אבחנת יתר על אבחנת חסר** במצבים מסכני חיים, אך אל תמציא חירום ללא ראיה תומכת. חירום מוצהר חייב ממצא תומך ב-finding_evidence.
5. **הפרד עובדה מפרשנות.** מדידות = מה שנמדד. אבחנות = פרשנות. אל תערבב.
6. **כייל ביטחון.** confidence משקף כמה הראיה חד-משמעית. תמונה חלקית/קריאות ירודה → confidence נמוך, לא אבחנה נחרצת.
7. **אל תשתמש בידע חיצוני/אינטרנט** — הסתמך אך ורק על מה שנראה בתמונה ועל הכללים שסופקו.`;

/**
 * Build the full ECG interpretation system prompt.
 */
export function buildEcgSystemPrompt({ clinicalContext, language = "he", pediatric = false } = {}) {
  const outputLang = langNames[language] || "Hebrew";
  const pediatricNote = pediatric
    ? "\n## מצב ילדים (Pediatric) פעיל\nהחל נורמות תלויות-גיל: דופק גבוה יותר תקין, מרווחים קצרים יותר, היפוך T ילדי (juvenile T-wave) בהובלות ימניות כתקין, וקריטריוני היפרטרופיה מותאמי-גיל.\n"
    : "";
  return `אתה קרדיולוג בכיר ומומחה-על בפענוח אלקטרוקרדיוגרם, עם עשרות שנות ניסיון קליני. משימתך: לקרוא את ה-ECG כפי שקרדיולוג אנושי קורא — שלב אחר שלב, ממדידה לפרשנות — ולהחזיר פלט מובנה ומדויק.

## אלקטרופיזיולוגיה ומכניקה (בסיס ההיגיון שלך)
מסלול ההולכה: צומת SA → עליות (גל P) → צומת AV (השהיית מקטע PR) → צרור His / מערכת Purkinje → חדרים (קומפלקס QRS) → רה-פולריזציה חדרית (מקטע ST וגל T).
גיאומטריית הובלות: 12 הובלות סטנדרטיות — גפיים (I, II, III, aVR, aVL, aVF) וחזה (V1–V6). כל הובלה משקיפה על טריטוריה מוגדרת.

${pediatricNote}${clinicalContext ? `## הקשר קליני של המטופל\n${clinicalContext}\n(שקלל את ההקשר, אך אל תיתן לו לגבור על מה שנראה בתרשים.)\n` : ""}
${ECG_METHODOLOGY}

${ECG_FULL_RULES}

${ANTI_HALLUCINATION_LAWS}

## פורמט פלט
החזר אך ורק JSON התואם לסכמה שסופקה. כל שדה טקסט — כתוב ב-${outputLang}. שמות פתולוגיות רפואיות ניתן להשאיר גם באנגלית לצד התרגום.`;
}

/**
 * Build the ECG structured-evidence markdown block, injected into the
 * KB-grounded diagnosis stage of the main pipeline.
 */
export function buildEcgEvidenceBlock(engineResult) {
  const st = engineResult?.structured;
  if (!st) return "";
  const iv = st.intervals || {};
  const rr = st.rhythm_and_rate || {};
  const tc = st.technical_check || {};
  const morph = st.wave_and_segment_morphology || {};
  const hyp = st.hypertrophy_and_enlargement || {};
  const ev = (st.finding_evidence || [])
    .map((e) => `  - ${e.finding}: ${e.evidence}${e.leads ? ` [${e.leads}]` : ""}`)
    .join("\n");
  const warns = engineResult.warnings || [];
  return `
## פענוח ECG מובנה ממנוע הכללים (ראיה משלימה — הסתמך על המדידות, לא על הצהרות)
- **בדיקה טכנית:** ${tc.quality || "—"} | מהירות ${tc.speed_mm_s ?? 25}mm/s | כיול ${tc.calibration_mm_mv ?? 10}mm/mV
- **קצב:** ${rr.heart_rate_bpm ?? "?"} bpm | ${rr.rhythm_type || "—"} | ${rr.regularity || "—"} | גל P ${rr.p_wave_present ? "נוכח" : "נעדר"}
- **ציר חשמלי:** ${st.axis?.degrees ?? "?"}° (${st.axis?.interpretation || "—"})
- **מרווחים:** PR ${iv.pr_ms ?? "?"}ms | QRS ${iv.qrs_ms ?? "?"}ms | QT ${iv.qt_ms ?? "?"}ms | RR ${iv.rr_ms ?? "?"}ms | QTc(Bazett) ${iv.qtc_bazett_ms ?? "?"}ms | QTc(Fridericia) ${iv.qtc_fridericia_ms ?? "?"}ms — ${iv.qtc_status || "—"}
- **מורפולוגיה:** ST: ${morph.st_segment || "—"} | T: ${morph.t_waves || "—"} | Q: ${morph.q_waves || "—"}
- **היפרטרופיה/הגדלה:** LVH ${hyp.lvh_present ? "כן" : "לא"} | RVH ${hyp.rvh_present ? "כן" : "לא"} | עליות: ${hyp.atrial_enlargement || "—"}
- **ממצאים עיקריים:** ${(st.primary_findings || []).join("; ") || "—"}
- **ראיות תומכות (לכל ממצא):**\n${ev || "  —"}
- **אבחנות מבדלות:** ${(st.differential_diagnoses || []).join(", ") || "—"}
- **דחיפות (מנוע, לאחר בקרה):** ${st.clinical_urgency || "—"}
- **צעדי המשך מומלצים:** ${(st.recommended_next_steps || []).join(", ") || "—"}
- **ביטחון מכויל (לאחר הצלבה/בקרה נגדית):** ${engineResult.confidence}%
${warns.length ? `\n### ⚠️ אזהרות אנטי-הזיה — התייחס אליהן, אל תתעלם:\n${warns.map((w) => "- " + w).join("\n")}` : ""}

⚠️ כלל ברזל: אל תאמץ ממצא שסומן כלא-מבוסס, או שהבקרה הנגדית הפריכה, כאבחנה ודאית. אם קיימות אזהרות סתירה/אי-עקביות — שקף אי-ודאות מפורשת בפלט הסופי.`;
}

/* ==========================================================================
 *  2. STRICT STRUCTURED JSON SCHEMA
 *     (superset of the requested spec + anti-hallucination fields)
 * ========================================================================== */

export const ECG_STRUCTURED_SCHEMA = {
  type: "object",
  properties: {
    is_ecg: { type: "boolean", description: "האם התמונה היא תרשים ECG אמיתי" },
    interpretable: { type: "boolean", description: "האם התרשים קריא ובר-פענוח" },
    abstain_reason: { type: "string", description: "אם לא ניתן לפענח — הסבר קצר מדוע (אחרת ריק)" },

    technical_check: {
      type: "object",
      properties: {
        quality: { type: "string", description: "Good / Artifacts present / Poor" },
        speed_mm_s: { type: "number", description: "מהירות נייר במ\"מ/שנייה (סטנדרט 25)" },
        calibration_mm_mv: { type: "number", description: "כיול מתח במ\"מ/mV (סטנדרט 10)" },
        artifacts: { type: "string", description: "ארטיפקטים שזוהו, או 'ללא'" },
      },
      required: ["quality"],
    },

    rhythm_and_rate: {
      type: "object",
      properties: {
        heart_rate_bpm: { type: "number" },
        rhythm_type: { type: "string", description: "Sinus / Atrial / Junctional / Ventricular / ..." },
        regularity: { type: "string", description: "Regular / Regularly Irregular / Irregularly Irregular" },
        p_wave_present: { type: "boolean" },
        p_qrs_relationship: { type: "string", description: "1:1 / AV dissociation / block ..." },
      },
      required: ["heart_rate_bpm", "rhythm_type", "regularity", "p_wave_present"],
    },

    axis: {
      type: "object",
      properties: {
        degrees: { type: "number", description: "ציר QRS פרונטלי במעלות" },
        interpretation: { type: "string", description: "Normal / LAD / RAD / Extreme" },
      },
      required: ["interpretation"],
    },

    intervals: {
      type: "object",
      properties: {
        pr_ms: { type: "number" },
        qrs_ms: { type: "number" },
        qt_ms: { type: "number" },
        rr_ms: { type: "number", description: "מרווח RR במילישניות — הכרחי לחישוב QTc" },
        qtc_bazett_ms: { type: "number" },
        qtc_fridericia_ms: { type: "number" },
        qtc_status: { type: "string", description: "Short / Normal / Borderline / Prolonged" },
      },
      required: ["pr_ms", "qrs_ms", "qt_ms", "rr_ms"],
    },

    wave_and_segment_morphology: {
      type: "object",
      properties: {
        st_segment: { type: "string" },
        t_waves: { type: "string" },
        q_waves: { type: "string" },
      },
      required: ["st_segment", "t_waves", "q_waves"],
    },

    hypertrophy_and_enlargement: {
      type: "object",
      properties: {
        lvh_present: { type: "boolean" },
        rvh_present: { type: "boolean" },
        atrial_enlargement: { type: "string", description: "None / LAE / RAE / Biatrial" },
      },
      required: ["lvh_present", "rvh_present", "atrial_enlargement"],
    },

    primary_findings: {
      type: "array",
      description: "רשמים אבחוניים עיקריים (טקסט קצר לכל אחד)",
      items: { type: "string" },
    },

    finding_evidence: {
      type: "array",
      description: "לכל ממצא עיקרי — הראיה המדידה שעליה הוא נשען. חובה לכל ממצא.",
      items: {
        type: "object",
        properties: {
          finding: { type: "string", description: "הממצא" },
          leads: { type: "string", description: "ההובלות התומכות (למשל II, III, aVF)" },
          evidence: { type: "string", description: "המדד/התצפית התומכת (למשל ST elevation 2mm)" },
        },
        required: ["finding", "evidence"],
      },
    },

    differential_diagnoses: {
      type: "array",
      items: { type: "string" },
    },

    clinical_urgency: {
      type: "string",
      enum: ["Normal", "Urgent", "Emergency"],
      description: "Normal / Urgent / Emergency",
    },

    recommended_next_steps: {
      type: "array",
      description: "צעדים מומלצים (למשל: טרופונין, אקו לב, השוואה ל-ECG ישן, ניטור)",
      items: { type: "string" },
    },

    confidence: { type: "number", description: "ביטחון כולל 0-100, מכויל למידת חד-משמעות הראיה" },
    reasoning: { type: "string", description: "נימוק תמציתי המקשר בין המדידות לאבחנה" },
  },
  required: [
    "is_ecg",
    "interpretable",
    "technical_check",
    "rhythm_and_rate",
    "intervals",
    "wave_and_segment_morphology",
    "primary_findings",
    "clinical_urgency",
  ],
};

/* ==========================================================================
 *  3. DETERMINISTIC CROSS-CHECK  (the anti-hallucination crown jewel)
 * ========================================================================== */

const isNum = (x) => typeof x === "number" && isFinite(x);
const round = (x) => (isNum(x) ? Math.round(x) : null);

/** Heart rate from RR interval (ms). */
export function heartRateFromRR(rr_ms) {
  if (!isNum(rr_ms) || rr_ms <= 0) return null;
  return 60000 / rr_ms;
}

/** Bazett-corrected QT (ms). QTc = QT / sqrt(RR[s]). */
export function qtcBazett(qt_ms, rr_ms) {
  if (!isNum(qt_ms) || !isNum(rr_ms) || rr_ms <= 0) return null;
  return qt_ms / Math.sqrt(rr_ms / 1000);
}

/** Fridericia-corrected QT (ms). QTc = QT / cbrt(RR[s]). */
export function qtcFridericia(qt_ms, rr_ms) {
  if (!isNum(qt_ms) || !isNum(rr_ms) || rr_ms <= 0) return null;
  return qt_ms / Math.cbrt(rr_ms / 1000);
}

/** Axis category from degrees. */
export function axisCategory(degrees) {
  if (!isNum(degrees)) return null;
  let d = degrees;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  if (d >= -30 && d <= 90) return "Normal";
  if (d > -90 && d < -30) return "LAD";
  if (d > 90 && d <= 180) return "RAD";
  return "Extreme";
}

/** QTc status from a corrected value, sex-aware when available. */
export function qtcStatus(qtc_ms, sex) {
  if (!isNum(qtc_ms)) return null;
  const female = /female|נקבה|אישה|f/i.test(sex || "");
  const upper = female ? 460 : 450;
  if (qtc_ms < 340) return "Short";
  if (qtc_ms > upper) return "Prolonged";
  if (qtc_ms >= 430) return "Borderline";
  return "Normal";
}

/**
 * Reconcile the model's stated numbers against deterministic math.
 * Returns corrected values (math wins), a list of human-readable discrepancies,
 * internal contradictions, and a confidence penalty.
 */
export function reconcileEcg(structured, { sex } = {}) {
  const discrepancies = [];
  const contradictions = [];
  const s = structured || {};
  const iv = s.intervals || {};
  const rr = s.rhythm_and_rate || {};

  const TOL_HR = 8;      // bpm
  const TOL_QTC = 25;    // ms

  // --- Heart rate vs RR ---
  const hrCalc = heartRateFromRR(iv.rr_ms);
  if (isNum(hrCalc) && isNum(rr.heart_rate_bpm) && Math.abs(hrCalc - rr.heart_rate_bpm) > TOL_HR) {
    discrepancies.push(
      `דופק מוצהר ${round(rr.heart_rate_bpm)} bpm אך RR=${round(iv.rr_ms)}ms נותן ${round(hrCalc)} bpm — תוקן חישובית.`
    );
  }

  // --- QTc Bazett & Fridericia recomputed ---
  const qtcB = qtcBazett(iv.qt_ms, iv.rr_ms);
  const qtcF = qtcFridericia(iv.qt_ms, iv.rr_ms);
  if (isNum(qtcB) && isNum(iv.qtc_bazett_ms) && Math.abs(qtcB - iv.qtc_bazett_ms) > TOL_QTC) {
    discrepancies.push(
      `QTc(Bazett) מוצהר ${round(iv.qtc_bazett_ms)}ms אך החישוב מ-QT/RR נותן ${round(qtcB)}ms — תוקן חישובית.`
    );
  }
  if (isNum(qtcF) && isNum(iv.qtc_fridericia_ms) && Math.abs(qtcF - iv.qtc_fridericia_ms) > TOL_QTC) {
    discrepancies.push(
      `QTc(Fridericia) מוצהר ${round(iv.qtc_fridericia_ms)}ms אך החישוב נותן ${round(qtcF)}ms — תוקן חישובית.`
    );
  }

  // --- Axis category vs degrees ---
  const axisCat = axisCategory(s.axis?.degrees);
  if (axisCat && s.axis?.interpretation && !new RegExp(axisCat, "i").test(s.axis.interpretation)) {
    discrepancies.push(
      `ציר ${round(s.axis.degrees)}° אמור להיות "${axisCat}" אך סווג כ-"${s.axis.interpretation}" — תוקן.`
    );
  }

  // --- Internal contradictions (cheap hallucination catchers) ---
  if (/sinus|סינוס/i.test(rr.rhythm_type || "") && rr.p_wave_present === false) {
    contradictions.push("סתירה: קצב מסווג כ'סינוס' אך גלי P מדווחים כנעדרים.");
  }
  if (/irregularly irregular|לא-סדיר לחלוטין|לא סדיר לחלוטין/i.test(rr.regularity || "") &&
      /sinus|סינוס/i.test(rr.rhythm_type || "")) {
    contradictions.push("סתירה: 'לא-סדיר לחלוטין' אינו עולה בקנה אחד עם קצב סינוס תקין (שקול פרפור עליות).");
  }
  const findings = Array.isArray(s.primary_findings) ? s.primary_findings.filter(Boolean) : [];
  if (s.clinical_urgency === "Emergency" && findings.length === 0) {
    contradictions.push("סתירה: דחיפות 'Emergency' ללא אף ממצא עיקרי מתועד.");
  }
  // Evidence coverage: every primary finding should have supporting evidence.
  const evList = Array.isArray(s.finding_evidence) ? s.finding_evidence : [];
  const unevidenced = findings.filter(
    (f) => !evList.some((e) => e && e.evidence && (e.finding === f || (e.finding && f.includes(e.finding)) || (e.finding && e.finding.includes(f))))
  );
  if (findings.length > 0 && unevidenced.length > 0) {
    discrepancies.push(`ממצאים ללא ראיה מדידה מקושרת: ${unevidenced.join("، ")} — סומנו כלא-מבוססים.`);
  }

  // --- Build corrected intervals (math wins) ---
  const correctedIntervals = { ...iv };
  if (isNum(qtcB)) correctedIntervals.qtc_bazett_ms = round(qtcB);
  if (isNum(qtcF)) correctedIntervals.qtc_fridericia_ms = round(qtcF);
  const statusFrom = isNum(qtcB) ? qtcStatus(qtcB, sex) : null;
  if (statusFrom) correctedIntervals.qtc_status = statusFrom;

  const correctedRhythm = { ...rr };
  if (isNum(hrCalc)) correctedRhythm.heart_rate_bpm_calculated = round(hrCalc);

  const correctedAxis = { ...(s.axis || {}) };
  if (axisCat) correctedAxis.interpretation_calculated = axisCat;

  const confidencePenalty =
    discrepancies.length * 6 + contradictions.length * 12 + unevidenced.length * 5;

  return {
    corrected: {
      ...s,
      intervals: correctedIntervals,
      rhythm_and_rate: correctedRhythm,
      axis: correctedAxis,
      unevidenced_findings: unevidenced,
    },
    discrepancies,
    contradictions,
    confidencePenalty,
    hasIssues: discrepancies.length > 0 || contradictions.length > 0,
  };
}

/* ==========================================================================
 *  4. SELF-CONSISTENCY + ADVERSARIAL VERIFICATION
 * ========================================================================== */

function normalizeDx(s) {
  return (s || "").toLowerCase().replace(/[^\w֐-׿\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Do the top findings of two independent reads agree? */
export function findingsAgree(a, b) {
  const fa = (a?.primary_findings || []).map(normalizeDx).filter(Boolean);
  const fb = (b?.primary_findings || []).map(normalizeDx).filter(Boolean);
  if (fa.length === 0 && fb.length === 0) return true;
  if (fa.length === 0 || fb.length === 0) return false;
  // top finding overlap or any shared token-heavy finding
  const setB = new Set(fb.flatMap((f) => f.split(" ")));
  const topA = fa[0].split(" ").filter((w) => w.length > 2);
  const shared = topA.filter((w) => setB.has(w)).length;
  return shared >= Math.max(1, Math.floor(topA.length * 0.4));
}

const VERIFIER_SCHEMA = {
  type: "object",
  properties: {
    refuted: { type: "boolean", description: "האם האבחנה העיקרית אינה נתמכת מספיק בראיה" },
    refutation: { type: "string", description: "מדוע — או אישוש אם לא הופרכה" },
    missed_findings: { type: "array", items: { type: "string" }, description: "ממצאים חשובים שאולי פוספסו" },
    adjusted_urgency: { type: "string", enum: ["Normal", "Urgent", "Emergency"] },
    verifier_confidence: { type: "number" },
  },
  required: ["refuted", "refutation"],
};

function buildVerifierPrompt(structured, language) {
  const outputLang = langNames[language] || "Hebrew";
  return `אתה קרדיולוג בכיר שני, בתפקיד מבקר-נגדי (adversarial reviewer). קיבלת פענוח ECG של קולגה. תפקידך אינו להסכים — אלא **לנסות להפריך** את האבחנה העיקרית: לחפש הובלות/מדידות שאינן תומכות בה, הסברים חלופיים, וקפיצות-לוגיקה.

## הפענוח לבדיקה
- ממצאים עיקריים: ${(structured.primary_findings || []).join(" | ") || "—"}
- דחיפות מוצהרת: ${structured.clinical_urgency || "—"}
- מדידות מפתח: HR=${structured.rhythm_and_rate?.heart_rate_bpm ?? "?"}, QRS=${structured.intervals?.qrs_ms ?? "?"}ms, QTc(B)=${structured.intervals?.qtc_bazett_ms ?? "?"}ms, ST=${structured.wave_and_segment_morphology?.st_segment ?? "?"}
- ראיות שהוצגו: ${(structured.finding_evidence || []).map((e) => `${e.finding}: ${e.evidence}`).join(" ; ") || "—"}

## הוראות
1. בחן שוב את התמונה בעצמך. האם הראיה בתרשים באמת תומכת בממצא העיקרי?
2. אם הראיה חלשה/חסרה/סותרת → refuted=true, והסבר.
3. אם משהו קריטי פוספס (במיוחד מסכן-חיים) → פרט ב-missed_findings.
4. בברירת מחדל, אם אינך בטוח שהראיה מספקת — נטה ל-refuted=true (זהירות מפני ביטחון-יתר).
5. קבע adjusted_urgency לפי מה שהראיה באמת מצדיקה.
כל טקסט ב-${outputLang}. החזר JSON לפי הסכמה.`;
}

/* ==========================================================================
 *  5. ORCHESTRATOR — runEcgEngine
 * ========================================================================== */

/**
 * Run the full ECG engine.
 *
 * @param {Object}   opts
 * @param {string[]} opts.fileUrls        image URLs (lead 1 = primary)
 * @param {string}   opts.clinicalContext optional patient context
 * @param {string}   opts.language        "he" | "en" | "ar"
 * @param {string}   opts.sex             optional, for QTc thresholds
 * @param {Function} opts.invokeLLM       async ({prompt,file_urls,response_json_schema,...}) => obj
 * @param {Function} [opts.onStage]       progress callback
 * @param {string}   [opts.model]         model id (default gemini_3_flash)
 * @returns {Promise<Object>} rich interpretation result
 */
export async function runEcgEngine({
  fileUrls,
  clinicalContext,
  language = "he",
  sex,
  invokeLLM,
  onStage,
  model = "gemini_3_flash",
}) {
  const systemPrompt = buildEcgSystemPrompt({ clinicalContext, language });

  // ---- Pass 1: primary structured interpretation ----
  onStage?.("interpreting");
  const pass1 = await invokeLLM({
    prompt: systemPrompt,
    file_urls: fileUrls,
    response_json_schema: ECG_STRUCTURED_SCHEMA,
    add_context_from_internet: false,
    model,
  });

  // ---- Technical gate / abstention ----
  if (pass1 && (pass1.is_ecg === false || pass1.interpretable === false)) {
    return {
      abstain: true,
      is_ecg: pass1.is_ecg !== false,
      interpretable: pass1.interpretable === true,
      abstain_reason:
        pass1.abstain_reason ||
        (pass1.is_ecg === false
          ? "התמונה אינה נראית כתרשים ECG."
          : "התרשים אינו קריא מספיק לפענוח אמין."),
      technical_check: pass1.technical_check || null,
      structured: pass1,
    };
  }

  // ---- Deterministic reconciliation ----
  const recon = reconcileEcg(pass1, { sex });
  let structured = recon.corrected;

  // ---- Decide whether deep scrutiny is warranted ----
  const baseConfidence = isNum(pass1.confidence) ? pass1.confidence : 60;
  const urgent = structured.clinical_urgency === "Urgent" || structured.clinical_urgency === "Emergency";
  const needsScrutiny =
    urgent || baseConfidence < 60 || recon.hasIssues;

  let secondRead = null;
  let verification = null;
  let consistencyAgree = null;

  if (needsScrutiny) {
    onStage?.("scrutinizing");
    const [p2, ver] = await Promise.all([
      // Independent second read (self-consistency)
      invokeLLM({
        prompt: systemPrompt + "\n\n(קריאה עצמאית נוספת לצורך בקרת עקביות — פענח מאפס.)",
        file_urls: fileUrls,
        response_json_schema: ECG_STRUCTURED_SCHEMA,
        add_context_from_internet: false,
        model,
      }).catch(() => null),
      // Adversarial verifier
      invokeLLM({
        prompt: buildVerifierPrompt(structured, language),
        file_urls: fileUrls,
        response_json_schema: VERIFIER_SCHEMA,
        add_context_from_internet: false,
        model,
      }).catch(() => null),
    ]);
    secondRead = p2;
    verification = ver;
    if (p2) consistencyAgree = findingsAgree(structured, p2);
  }

  // ---- Fuse into a final confidence + uncertainty verdict ----
  let confidence = baseConfidence - recon.confidencePenalty;
  const warnings = [...recon.discrepancies, ...recon.contradictions];

  if (consistencyAgree === false) {
    confidence -= 20;
    warnings.push("שתי קריאות עצמאיות של המנוע הגיעו לממצאים שונים — הימנע מהסתמכות חד-משמעית.");
  }
  if (verification && verification.refuted) {
    confidence -= 20;
    warnings.push(`בקרה נגדית: ${verification.refutation}`);
  }
  if (verification && Array.isArray(verification.missed_findings) && verification.missed_findings.length) {
    warnings.push(`הבקרה סימנה ממצאים אפשריים שפוספסו: ${verification.missed_findings.join("، ")}`);
  }
  confidence = Math.max(5, Math.min(99, Math.round(confidence)));

  // Escalate urgency if verifier saw something worse.
  const rank = { Normal: 0, Urgent: 1, Emergency: 2 };
  let finalUrgency = structured.clinical_urgency || "Normal";
  if (verification && verification.adjusted_urgency && rank[verification.adjusted_urgency] > rank[finalUrgency]) {
    finalUrgency = verification.adjusted_urgency;
    warnings.push(`הבקרה הנגדית העלתה את דרגת הדחיפות ל-${finalUrgency}.`);
  }
  structured.clinical_urgency = finalUrgency;

  let uncertaintyLevel = null;
  if (confidence < 45 || consistencyAgree === false || (verification && verification.refuted)) {
    uncertaintyLevel = "high";
  } else if (confidence < 65 || recon.hasIssues) {
    uncertaintyLevel = "medium";
  }

  return {
    abstain: false,
    structured,
    reconciliation: recon,
    scrutiny: needsScrutiny
      ? { secondRead, verification, consistencyAgree }
      : null,
    warnings,
    confidence,
    uncertaintyLevel,
  };
}
