import { base44 } from "@/api/base44Client";
import { buildCasesForMatching, buildMatchedCasesText } from "./knowledgeBase";
import { getMeasurementProtocol, EXTRACTION_SCHEMA } from "./diagnosticProtocols";
import { ECG_FULL_RULES, ECG_INTERPRETATION_SCHEMA } from "./ecgRules";

const langNames = { he: "Hebrew", en: "English", ar: "Arabic" };

const emptyKbErrors = {
  he: "מאגר הידע ריק. יש להוסיף מקרים למאגר לפני ביצוע אבחון.",
  en: "The knowledge base is empty. Please add cases before running a diagnosis.",
  ar: "قاعدة المعرفة فارغة. يرجى إضافة حالات قبل إجراء التشخيص.",
};

const uncertaintyReasons = {
  he: {
    high: "רמת הביטחון של ההתאמה הטובה ביותר נמוכה. האבחנה אינה וודאית — מומלץ להתייעץ עם רופא מומחה לבדיקה נוספת.",
    medium: "מספר אבחנות מתחרות עם דרגות ביטחון דומות. רצוי בדיקה נוספת לאישוש האבחנה הסופית.",
  },
  en: {
    high: "The confidence level of the best match is low. The diagnosis is uncertain — consult a specialist for further evaluation.",
    medium: "Multiple competing diagnoses with similar confidence levels. Further testing is recommended to confirm the final diagnosis.",
  },
  ar: {
    high: "مستوى الثقة لأفضل تطابق منخفض. التشخيص غير مؤكد — يُنصح باستشارة طبيب مختص لمزيد من الفحص.",
    medium: "هناك عدة تشخيصات منافسة بمستويات ثقة متقاربة. يُنصح بإجراء فحوصات إضافية لتأكيد التشخيص النهائي.",
  },
};

const defaultFindingLabels = { he: "ממצא", en: "Finding", ar: "نتيجة" };

export async function runDiagnosisPipeline({
  files,
  entityName,
  analysisType,
  domainRole,
  matchingInstructions,
  diagnosisInstructions,
  clinicalContext,
  onStage,
  language = "he",
}) {
  const outputLang = langNames[language] || "Hebrew";
  const langDirective = `\n## Output Language\nALL text in your response (titles, reasoning, summary, analysis, guideline, finding labels) MUST be written in ${outputLang}. This is critical — the user selected ${outputLang} as their language.`;

  const protocol = getMeasurementProtocol(analysisType);

  // 0. Upload images + fetch knowledge-base cases in parallel (independent I/O)
  const [uploadResults, allCases] = await Promise.all([
    Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f }))),
    base44.entities[entityName].list("-created_date", 1000),
  ]);
  const fileUrls = uploadResults.map((r) => r.file_url);
  const file_url = fileUrls[0];

  if (!allCases || allCases.length === 0) {
    throw new Error(emptyKbErrors[language] || emptyKbErrors.he);
  }

  const casesForMatching = buildCasesForMatching(allCases);

  // ---------- Stage 1: Scan, Measure & Match ----------
  onStage?.("extracting");

  const stage1Promise = base44.integrations.Core.InvokeLLM({
    prompt: `אתה ${domainRole} עם ניסיון רב שנים. משימה זו מחולקת לשני חלקים: ראשית סריקה ומדידה שיטתית של התמונה, ולאחר מכן התאמה מול כל מקרי מאגר הידע.

## התמונות לניתוח
תמונה 1 היא התמונה הראשית לניתוח. שאר התמונות (אם קיימות) הן זוויות/לידים נוספים.
${clinicalContext ? `\n## הקשר קליני של המטופל\n${clinicalContext}\n` : ""}
${protocol.measurement}

## חלק א׳ — סריקה ומדידה
בצע את הפרוטוקול המלא. חלץ כל מדד כערך כמותי ככל הניתן. אל תדלג על מדדים — אם אינו בר-הערכה מהתמונה, ציין זאת. המדידות ישמשו ראיה לשלב האימות והאבחון.

## מאגר הידע — כל המקרים (יש להעריך כל מקרה)
${casesForMatching}

## חלק ב׳ — התאמה
${matchingInstructions}

- התאם את המדידות שחלצת מול המאפיינים של כל מקרה במאגר.
- לכל מקרה החזר ציון ביטחון 0-100 והסבר קצר המבוסס על המדידות.
- דרג מהתואם ביותר לפחות. החזר רק את 12 ההתאמות הטובות ביותר.
- אל תניח "תקין" כברירת מחדל — שקול כל מקרה ברצינות, במיוחד מצבים מסכני חיים.
${langDirective}`,
    file_urls: fileUrls,
    response_json_schema: {
      type: "object",
      properties: {
        measurements: EXTRACTION_SCHEMA.properties.measurements,
        red_flags: EXTRACTION_SCHEMA.properties.red_flags,
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              case_id: { type: "string" },
              title: { type: "string" },
              diagnosis: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["case_id", "title", "confidence", "reasoning"],
          },
        },
      },
      required: ["measurements", "matches"],
    },
    add_context_from_internet: false,
    model: "gemini_3_flash",
  });

  // ---------- Stage 1.5: ECG interpretation (parallel with Stage 1) ----------
  let ecgInterpPromise = null;
  if (analysisType === "ecg") {
    ecgInterpPromise = base44.integrations.Core.InvokeLLM({
      prompt: `אתה קרדיולוג מומחה. בצע פענוח ECG שיטתי עצמאי באמצעות מנוע החוקים המלא. מטרתך לזהות כל חריגה — גם עדינה — ולתעד אותה. אינך מחליט "תקין" אלא אם כן כל 10 שלבי הפענוח ללא יוצא מן הכלל תקינים.

## כלל ברזל — איסור תקין שקרי
- חוסר עמידה בכלל ספציפי אינו שולל פתולוגיה. ייתכן שהתמונה אינה מאפשרת מדידה מדויקת אך עדיין יש פתולוגיה.
- אם לא זיהית פתולוגיה ספציפית אך יש כל חריגה כלשהי (קצב, מורפולוגיה, ST, T, QRS) → הקפד לציין "דפוס לא-ספציפי — לא ניתן לשלול פתולוגיה ללא בדיקה נוספת".
- רק אם כל המדידות וכל ההובלות תקינות לחלוטין → כתוב "תקין".
- העדף יתר על אבחנת יתר (לזהות פתולוגיה כשיש ספק) על-פני אבחנת חסר.

## התמונות לניתוח
תמונה 1 היא התרשים הראשי. שאר התמונות (אם קיימות) הן לידים/רצועות נוספים.
${clinicalContext ? `\n## הקשר קליני\n${clinicalContext}\n` : ""}
${ECG_FULL_RULES}

## הוראות ביצוע
1. בצע את כל 10 שלבי הפענוח השיטתי — אל תדלג על שלב. בצע מדידות עצמאיות מהתרשים.
2. לכל הובלה / קבוצת הובלות, תעד את הממצא והטריטוריה המתאימה. ציין במפורש כל חריגה.
3. הפעל את כל קבוצות כללי האבחנה (א–ח). לכל כלל: סמן met / not_met / indeterminate עם ראיה. "indeterminate" פירושו שלא ניתן לשלול — לא שלילי.
4. צלב את הכללים והחריגות שזיהית → קבע את הפתולוגיה העיקרית שזוהתה.
5. רשום אבחנות מבדלות.
6. הנימוק חייב להתבסס על הובלות ספציפיות וכללים ספציפיים (למשל: "ST elevation ב-II, III, aVF → דופן תחתית → STEMI תחתית").
${langDirective}`,
      file_urls: fileUrls,
      response_json_schema: ECG_INTERPRETATION_SCHEMA,
      add_context_from_internet: false,
      model: "gemini_3_flash",
    });
  }

  // ---------- Await parallel stages ----------
  const [extractMatchResult, ecgInterpResult] = await Promise.all([
    stage1Promise,
    ecgInterpPromise || Promise.resolve(null),
  ]);
  const ecgInterpretation = ecgInterpResult;

  const measurements = Array.isArray(extractMatchResult.measurements)
    ? extractMatchResult.measurements.filter((m) => m.parameter)
    : [];
  const redFlags = extractMatchResult.red_flags || "";

  const matches = (extractMatchResult.matches || [])
    .filter((m) => m.case_id)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // ---------- Compute diagnostic uncertainty ----------
  const topConfidence = matches[0]?.confidence || 0;
  const secondConfidence = matches[1]?.confidence || 0;
  const confidenceGap = topConfidence - secondConfidence;
  const reasons = uncertaintyReasons[language] || uncertaintyReasons.he;

  let uncertainty = null;
  if (matches.length === 0 || topConfidence < 40) {
    uncertainty = { level: "high", reason: reasons.high };
  } else if (topConfidence < 65 && matches.length > 1 && confidenceGap <= 15) {
    uncertainty = { level: "medium", reason: reasons.medium };
  }

  // ---------- Resolve top matched cases (full detail + reference images) ----------
  const topMatchIds = matches.slice(0, 5).map((m) => m.case_id);
  const topCases = topMatchIds
    .map((id) => allCases.find((c) => c.id === id))
    .filter(Boolean);

  const referenceCases = topCases.slice(0, 3);
  const referenceImages = referenceCases
    .filter((c) => c.image_url)
    .map((c) => c.image_url);

  const matchedCasesText = buildMatchedCasesText(topCases);

  let imageLegend = "";
  if (referenceImages.length > 0) {
    const legendItems = referenceCases
      .filter((c) => c.image_url)
      .map((c, i) => `תמונה ${i + 2}: ייחוס עבור "${c.title}" (${c.diagnosis})`);
    imageLegend = `## תמונות להשוואה ויזואלית\nתמונה 1: התמונה לניתוח.\n${legendItems.join("\n")}`;
  }

  const measurementsText = measurements.length > 0
    ? measurements.map((m) => `- **${m.parameter}**: ${m.value}${m.notes ? ` — ${m.notes}` : ""}`).join("\n")
    : "לא חולצו מדידות.";

  // ---------- Stage 2: Criteria Verification + Diagnosis ----------
  onStage?.("verifying");

  const matchesSummary = matches.slice(0, 5).map((m, i) =>
    `${i + 1}. ${m.title} — ${m.diagnosis || ""} (ביטחון התאמה: ${m.confidence}%): ${m.reasoning}`
  ).join("\n");

  const diagnosis = await base44.integrations.Core.InvokeLLM({
    prompt: `אתה ${domainRole} עם ניסיון רב שנים. בצע אימות קריטריוני אבחון ולאחריו ניתוח קליני מפורט, המבוסס על המדידות שחולצו והמקרים התואמים מול מאגר הידע.

## התמונות לניתוח
תמונה 1 (התמונה הראשונה) היא התמונה הראשית. שאר התמונות הן זוויות/לידים נוספים. סמן ממצאים בתמונה 1 בלבד.
${clinicalContext ? `\n## הקשר קליני של המטופל\n${clinicalContext}\n` : ""}
## מדידות שחולצו מהתמונה (שלב הסריקה והמדידה)
${measurementsText}
${redFlags ? `\n## דגלים אדומים שזוהו\n${redFlags}\n` : ""}
${ecgInterpretation ? `
## פרשנות עצמאית ממנוע החוקים (ECG) — ראיה משלימה בלבד
⚠️ חשוב: פלט זה הוא ראיה משלימה, לא החלטה סופית. אל תסתמך על "preliminary_diagnosis" שלילי כשלילת פתולוגיה. חוסר עמידה בכלל ספציפי אינו שולל אבחנה — הסתמך על הממצאים בהובלות ועל המאגר.
- **פתולוגיה עיקרית שזוהתה:** ${ecgInterpretation.preliminary_diagnosis || "—"}
- **אבחנות מבדלות:** ${(ecgInterpretation.differentials || []).join(", ") || "—"}
- **נימוק:** ${ecgInterpretation.reasoning || "—"}

### ממצאים לפי הובלות (הסתמך על אלו)
${(ecgInterpretation.lead_findings || []).map((lf) => `- **${lf.leads}** (${lf.territory || "—"}): ${lf.finding}`).join("\n") || "—"}

### הפעלת כללי אבחנה
${(ecgInterpretation.rule_applications || []).map((ra) => `- **${ra.rule}** — ${ra.status} (${ra.confidence || "?"}%): ${ra.evidence}`).join("\n") || "—"}
` : ""}
## תוצאות שלב ההתאמה — המקרים התואמים ביותר
${matchesSummary}

## פרטי המקרים התואמים מתוך מאגר הידע (כולל קריטריוני אבחון)
${matchedCasesText}

${imageLegend}

${protocol.criteria}

## הוראות ניתוח
${diagnosisInstructions}

## כלל ברזל — איסור תקין שקרי (CRITICAL)
1. אל תסיק "תקין" אלא אם כן כל המדידות וכל ההובלות תקינות לחלוטין ללא כל חריגה.
2. כל חריגה (ST, T, QRS, קצב, ציר, מרווח) חייבת להיות מסווגת ומוסברת.
3. הפרשנות ממנוע החוקים היא ראיה משלימה בלבד — אל תאמץ "preliminary_diagnosis" שלילי כשלילת פתולוגיה.
4. כשיש ספק, העדף הפניה לבירור דחוף על-פני "תקין".
5. העדף אבחנת יתר (לזהות פתולוגיה) על-פני אבחנת חסר — במיוחד במצבים מסכני חיים.

## סימון אזורי ממצא על התמונה
זהה אזורים בתמונה 1 בהם יש ממצא חריג או משמעותי. לכל אזור החזר תיבת תחום (bounding box) בקואורדינטות נורמליזציה — אחוזים (0-100): x, y, width, height, label. אם אין ממצא חריג ברור, החזר מערך ריק.

## פלט נדרש
- **criteria_analysis**: עבור כל אחד מ-5 המקרים התואמים המובילים — מערך קריטריונים עם סטטוס (met / not_met / indeterminate) וראיה, ציון criteria_confidence (0-100), והמלצה (מאושר / סביר / אפשרי / נשלל).
- **summary**: סיכום תמציתי של הממצא העיקרי (משפט אחד).
- **severity**: רמת חומרה — normal / mild / moderate / severe / urgent.
- **guideline**: המלצת טיפול/הפניה מקצועית תמציתית וספציפית.
- **analysis**: ניתוח מפורט ב-Markdown הכולל:
  * **מדידות שחולצו** — טבלת המדידות הכמותיות
  * **אימות קריטריונים** — עמידה בקריטריונים של האבחנה המובילה
  * **תיאור הממצאים** — המאפיינים העיקריים
  * **השוואה למאגר הידע** — טבלת המקרים התואמים עם דרגת ביטחון ונימוק
  * **אבחנה ראשית** ואבחנות מבדלות
  * **סימני דגל אדום** אם קיימים
  * **המלצות קליניות** — המשך טיפול / בירור / הפניה
- **findings**: מערך אזורי ממצא (תיבות תחום).
${langDirective}`,
    file_urls: [...fileUrls, ...referenceImages],
    response_json_schema: {
      type: "object",
      properties: {
        criteria_analysis: {
          type: "array",
          description: "אימות קריטריוני אבחון עבור המקרים התואמים המובילים",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              diagnosis: { type: "string" },
              criteria: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    criterion: { type: "string" },
                    status: { type: "string", enum: ["met", "not_met", "indeterminate"] },
                    evidence: { type: "string" },
                  },
                  required: ["criterion", "status"],
                },
              },
              criteria_confidence: { type: "number" },
              recommendation: { type: "string" },
            },
            required: ["title", "criteria", "criteria_confidence"],
          },
        },
        summary: { type: "string", description: "סיכום קצר של הממצאים" },
        severity: { type: "string", enum: ["normal", "mild", "moderate", "severe", "urgent"] },
        analysis: { type: "string", description: "ניתוח מפורט בפורמט Markdown" },
        guideline: { type: "string", description: "המלצת טיפול/הפניה מקצועית תמציתית" },
        findings: {
          type: "array",
          description: "אזורי ממצא חריגים על גבי התמונה (תיבות תחום בקואורדינטות נורמליזציה 0-100)",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "תיאור קצר של הממצא באזור" },
              x: { type: "number", description: "פינה שמאלית-עליונה X (0-100)" },
              y: { type: "number", description: "פינה שמאלית-עליונה Y (0-100)" },
              width: { type: "number", description: "רוחב (0-100)" },
              height: { type: "number", description: "גובה (0-100)" },
            },
            required: ["label", "x", "y", "width", "height"],
          },
        },
      },
      required: ["summary", "severity", "analysis", "findings"],
    },
    add_context_from_internet: false,
    model: "gemini_3_flash",
  });

  // ---------- Validate & clamp findings (normalized 0-100) ----------
  const defaultLabel = defaultFindingLabels[language] || defaultFindingLabels.he;
  const rawFindings = Array.isArray(diagnosis.findings) ? diagnosis.findings : [];
  const findings = rawFindings
    .map((f) => {
      const x = Math.max(0, Math.min(100, Number(f.x) || 0));
      const y = Math.max(0, Math.min(100, Number(f.y) || 0));
      const width = Math.max(0, Math.min(100 - x, Number(f.width) || 0));
      const height = Math.max(0, Math.min(100 - y, Number(f.height) || 0));
      return { label: String(f.label || defaultLabel), x, y, width, height };
    })
    .filter((f) => f.width > 0 && f.height > 0);

  // ---------- Merge criteria-based confidence into matched cases ----------
  const criteriaMap = {};
  (diagnosis.criteria_analysis || []).forEach((ca) => {
    if (ca.title) criteriaMap[ca.title] = ca;
  });
  const enrichedMatches = matches.slice(0, 8).map((m) => {
    const ca = criteriaMap[m.title];
    if (ca) {
      const conf = typeof ca.criteria_confidence === "number" ? ca.criteria_confidence : m.confidence;
      const rec = ca.recommendation ? ` — ${ca.recommendation}` : "";
      return { ...m, confidence: conf, reasoning: `${m.reasoning}${rec}` };
    }
    return m;
  });

  // ---------- Persist the analysis ----------
  const analysisRecord = await base44.entities.Analysis.create({
    type: analysisType,
    image_url: file_url,
    result: diagnosis.analysis,
    severity: diagnosis.severity,
    summary: diagnosis.summary,
  });

  return {
    summary: diagnosis.summary,
    severity: diagnosis.severity,
    analysis: diagnosis.analysis,
    matchedCases: enrichedMatches,
    imageUrl: file_url,
    findings,
    uncertainty,
    guideline: diagnosis.guideline,
    measurements,
    ecgInterpretation,
    analysisId: analysisRecord.id,
  };
}