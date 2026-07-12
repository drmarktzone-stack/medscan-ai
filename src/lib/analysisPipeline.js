import { base44 } from "@/api/base44Client";
import { buildCasesForMatching, buildMatchedCasesText } from "./knowledgeBase";

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

  // 1. Upload all images (first is the primary analysis image)
  const uploadResults = await Promise.all(
    files.map((f) => base44.integrations.Core.UploadFile({ file: f }))
  );
  const fileUrls = uploadResults.map((r) => r.file_url);
  const file_url = fileUrls[0];

  // 2. Fetch all knowledge-base cases
  const allCases = await base44.entities[entityName].list("-created_date", 100);

  if (!allCases || allCases.length === 0) {
    throw new Error(emptyKbErrors[language] || emptyKbErrors.he);
  }

  // ---------- Stage 1: Structured matching against every case ----------
  onStage?.("matching");

  const casesForMatching = buildCasesForMatching(allCases);

  const matchingResult = await base44.integrations.Core.InvokeLLM({
    prompt: `אתה ${domainRole}. משימתך הראשונה היא התאמה מדויקת וביקורתית של התמונה שהועלתה מול כל אחד מהמקרים במאגר הידע.

## התמונות לניתוח
תמונה 1 היא התמונה הראשית לניתוח. שאר התמונות (אם קיימות) הן זוויות/לידים נוספים — השתמש בהן להשלמת התמונה הקלינית.
${clinicalContext ? `\n## הקשר קליני של המטופל\n${clinicalContext}\n` : ""}
## מאגר הידע — כל המקרים (יש להעריך כל מקרה)
${casesForMatching}

## הוראות התאמה
${matchingInstructions}

- הערך את מידת ההתאמה של התמונה מול כל מקרה באופן יסודי.
- לכל מקרה השב ציון ביטחון בין 0 ל-100 והסבר קצר לניקוד.
- אל תניח "תקין" כברירת מחדל — שקול כל מקרה ברצינות, במיוחד מצבים מסכני חיים.
- דרג את התוצאות מהתואם ביותר לפחות תואם.
- חפש באינטרנט מאגרי תמונות רפואיים וספרות קלינית כדי להשלים את ההשוואה מול כל מקרה — השתמש בממצאים פתולוגיים ותקינים עדכניים ממקורות מהימנים.
- אם סופק הקשר קליני של המטופל, שקול אותו בעת ההתאמה — גיל, מין, תסמינים ורקע רפואי עשויים לשנות משמעותית את סבירות האבחנה.

## פלט נדרש (JSON)
מערך matches מסודר מהתואם ביותר לפחות תואם. כל פריט כולל:
- case_id: מזהה המקרה (כפי שמופיע ברשימה)
- title: כותרת המקרה
- diagnosis: האבחנה
- confidence: מספר שלם 0-100
- reasoning: הסבר קצר לניקוד
${langDirective}`,
    file_urls: fileUrls,
    response_json_schema: {
      type: "object",
      properties: {
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
      required: ["matches"],
    },
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
  });

  const matches = (matchingResult.matches || [])
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

  const referenceImages = topCases
    .filter((c) => c.image_url)
    .map((c) => c.image_url);

  const matchedCasesText = buildMatchedCasesText(topCases);

  let imageLegend = "";
  if (referenceImages.length > 0) {
    const legendItems = topCases
      .filter((c) => c.image_url)
      .map((c, i) => `תמונה ${i + 2}: ייחוס עבור "${c.title}" (${c.diagnosis})`);
    imageLegend = `## תמונות להשוואה ויזואלית\nתמונה 1: התמונה לניתוח.\n${legendItems.join("\n")}`;
  }

  // ---------- Stage 2: Detailed diagnosis grounded in the top matches ----------
  onStage?.("diagnosing");

  const matchesSummary = matches.slice(0, 5).map((m, i) =>
    `${i + 1}. ${m.title} — ${m.diagnosis || ""} (ביטחון: ${m.confidence}%): ${m.reasoning}`
  ).join("\n");

  const diagnosis = await base44.integrations.Core.InvokeLLM({
    prompt: `אתה ${domainRole} עם ניסיון רב שנים. בצע ניתוח קליני מפורט של התמונה, המבוסס על המקרים התואמים שזוהו בשלב ההתאמה מול מאגר הידע.

## התמונות לניתוח
תמונה 1 (התמונה הראשונה) היא התמונה הראשית לניתוח. שאר התמונות הן זוויות/לידים נוספים — השתמש בהן להשלמת ההערכה. סמן ממצאים בתמונה 1 בלבד.
${clinicalContext ? `\n## הקשר קליני של המטופל\n${clinicalContext}\n` : ""}
## תוצאות שלב ההתאמה — המקרים התואמים ביותר
${matchesSummary}

## פרטי המקרים התואמים מתוך מאגר הידע
${matchedCasesText}

${imageLegend}

## הוראות ניתוח
${diagnosisInstructions}

## הערכה מורחבת מהאינטרנט
חפש באינטרנט מאגרי תמונות רפואיים, ספרות קלינית עדכנית וממצאים פתולוגיים ותקינים כדי להשוות את התמונה. הסתמך על מקורות מהימנים — ספרות רפואית, מאגרי תמונות קליניות, וקריטריוני אבחון מקצועיים.

## סימון אזורי ממצא על התמונה
זהה את האזורים הספציפיים בתמונה 1 (התמונה לניתוח) בהם יש ממצא חריג או משמעותי קלינית.
עבור כל אזור, החזר תיבת תחום (bounding box) בקואורדינטות נורמליזציה — אחוזים מממדי התמונה (0-100):
- x: מיקום הפינה השמאלית-עליונה בציר האופקי (0-100)
- y: מיקום הפינה השמאלית-עליונה בציר האנכי (0-100)
- width: רוחב התיבה באחוזים (0-100)
- height: גובה התיבה באחוזים (0-100)
- label: תיאור קצר של הממצא באזור (עד 4 מילים)
הקואורדינטות יחסיות לתמונה 1 בלבד. אם אין ממצא חריג ברור, החזר מערך ריק.

## פלט נדרש
- summary: סיכום תמציתי של הממצא העיקרי (משפט אחד)
- severity: רמת חומרה — normal / mild / moderate / severe / urgent
- findings: מערך של אזורי ממצא (תיבות תחום) על גבי התמונה
- guideline: המלצת טיפול/הפניה מקצועית תמציתית וספציפית (לדוגמה: "STEMI → הפניה דחופה לצנתור ראשוני", "חשד למלנומה → ביופסיה דחופה אצל כירורג עור")
- analysis: ניתוח מפורט ב-Markdown הכולל:
  * **תיאור הממצאים** — המאפיינים העיקריים שזוהו בתמונה
  * **השוואה למאגר הידע** — טבלת המקרים התואמים עם דרגת ביטחון ונימוק
  * **אבחנה ראשית** ואבחנות מבדלות (מהסביר ביותר לפחות סביר)
  * **ממצאים פתולוגיים** משמעותיים
  * **סימני דגל אדום** אם קיימים
  * **המלצות קליניות** — המשך טיפול / בירור / הפניה
${langDirective}`,
    file_urls: [...fileUrls, ...referenceImages],
    response_json_schema: {
      type: "object",
      properties: {
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
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
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
    matchedCases: matches.slice(0, 8),
    imageUrl: file_url,
    findings,
    uncertainty,
    guideline: diagnosis.guideline,
    analysisId: analysisRecord.id,
  };
}