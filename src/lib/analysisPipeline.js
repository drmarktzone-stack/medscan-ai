import { base44 } from "@/api/base44Client";
import { buildCasesForMatching, buildMatchedCasesText } from "./knowledgeBase";

/**
 * Two-stage RAG diagnosis pipeline.
 *
 * Stage 1 — Matching: the uploaded image is compared against EVERY case in the
 *   knowledge base. The model returns a ranked list with a confidence score
 *   (0-100) and reasoning for each case. This is the structured matching step.
 *
 * Stage 2 — Diagnosis: a detailed analysis is generated, grounded ONLY in the
 *   top matched cases (full detail + their reference images, clearly labeled),
 *   so the final diagnosis is driven by the specific best matches rather than
 *   a generic interpretation.
 *
 * @param {object} params
 * @param {File}   params.file                 - uploaded image file
 * @param {string} params.entityName           - "ECGCase" | "SkinCase"
 * @param {string} params.analysisType         - "ecg" | "skin"
 * @param {string} params.domainRole           - Hebrew role label, e.g. "קרדיולוג מומחה"
 * @param {string} params.matchingInstructions - domain-specific visual analysis steps for matching
 * @param {string} params.diagnosisInstructions- domain-specific outline for the detailed report
 * @param {(stage: string) => void} [params.onStage] - progress callback ("matching" | "diagnosing")
 * @returns {Promise<{summary, severity, analysis, matchedCases}>}
 */
export async function runDiagnosisPipeline({
  file,
  entityName,
  analysisType,
  domainRole,
  matchingInstructions,
  diagnosisInstructions,
  onStage,
}) {
  // 1. Upload the image
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  // 2. Fetch all knowledge-base cases
  const allCases = await base44.entities[entityName].list("-created_date", 100);

  if (!allCases || allCases.length === 0) {
    throw new Error("מאגר הידע ריק. יש להוסיף מקרים למאגר לפני ביצוע אבחון.");
  }

  // ---------- Stage 1: Structured matching against every case ----------
  onStage?.("matching");

  const casesForMatching = buildCasesForMatching(allCases);

  const matchingResult = await base44.integrations.Core.InvokeLLM({
    prompt: `אתה ${domainRole}. משימתך הראשונה היא התאמה מדויקת וביקורתית של התמונה שהועלתה מול כל אחד מהמקרים במאגר הידע.

## התמונה לניתוח
התמונה המצורפת היא התמונה לניתוח.

## מאגר הידע — כל המקרים (יש להעריך כל מקרה)
${casesForMatching}

## הוראות התאמה
${matchingInstructions}

- הערך את מידת ההתאמה של התמונה מול כל מקרה באופן יסודי.
- לכל מקרה השב ציון ביטחון בין 0 ל-100 והסבר קצר לניקוד.
- אל תניח "תקין" כברירת מחדל — שקול כל מקרה ברצינות, במיוחד מצבים מסכני חיים.
- דרג את התוצאות מהתואם ביותר לפחות תואם.

## פלט נדרש (JSON)
מערך matches מסודר מהתואם ביותר לפחות תואם. כל פריט כולל:
- case_id: מזהה המקרה (כפי שמופיע ברשימה)
- title: כותרת המקרה
- diagnosis: האבחנה
- confidence: מספר שלם 0-100
- reasoning: הסבר קצר לניקוד`,
    file_urls: [file_url],
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
    model: "claude_sonnet_4_6",
  });

  const matches = (matchingResult.matches || [])
    .filter((m) => m.case_id)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // ---------- Resolve top matched cases (full detail + reference images) ----------
  const topMatchIds = matches.slice(0, 5).map((m) => m.case_id);
  const topCases = topMatchIds
    .map((id) => allCases.find((c) => c.id === id))
    .filter(Boolean);

  const referenceImages = topCases
    .filter((c) => c.image_url)
    .map((c) => c.image_url);

  const matchedCasesText = buildMatchedCasesText(topCases);

  // Build a legend so the model knows which reference image belongs to which case
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

## התמונה לניתוח
תמונה 1 (התמונה הראשונה בקובץ המצורף) היא התמונה לניתוח.

## תוצאות שלב ההתאמה — המקרים התואמים ביותר
${matchesSummary}

## פרטי המקרים התואמים מתוך מאגר הידע
${matchedCasesText}

${imageLegend}

## הוראות ניתוח
${diagnosisInstructions}

## פלט נדרש
- summary: סיכום תמציתי של הממצא העיקרי (משפט אחד)
- severity: רמת חומרה — normal / mild / moderate / severe / urgent
- analysis: ניתוח מפורט ב-Markdown הכולל:
  * **תיאור הממצאים** — המאפיינים העיקריים שזוהו בתמונה
  * **השוואה למאגר הידע** — טבלת המקרים התואמים עם דרגת ביטחון ונימוק
  * **אבחנה ראשית** ואבחנות מבדלות (מהסביר ביותר לפחות סביר)
  * **ממצאים פתולוגיים** משמעותיים
  * **סימני דגל אדום** אם קיימים
  * **המלצות קליניות** — המשך טיפול / בירור / הפניה`,
    file_urls: [file_url, ...referenceImages],
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "סיכום קצר של הממצאים" },
        severity: { type: "string", enum: ["normal", "mild", "moderate", "severe", "urgent"] },
        analysis: { type: "string", description: "ניתוח מפורט בפורמט Markdown" },
      },
      required: ["summary", "severity", "analysis"],
    },
    model: "claude_sonnet_4_6",
  });

  // ---------- Persist the analysis ----------
  await base44.entities.Analysis.create({
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
  };
}