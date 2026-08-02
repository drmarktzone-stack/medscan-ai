import { base44 } from "@/api/base44Client";
import { buildCasesForMatching, buildMatchedCasesText } from "./knowledgeBase";
import { getMeasurementProtocol, EXTRACTION_SCHEMA } from "./diagnosticProtocols";
import { runEcgEngine } from "./ecgEngine";
import { runInputGate } from "./inputGate";
import { verifyDiagnosis } from "./verify";

const langNames = { he: "Hebrew", en: "English", ar: "Arabic" };

const emptyKbErrors = {
  he: "מאגר הידע ריק. יש להוסיף מקרים למאגר לפני ביצוע אבחון.",
  en: "The knowledge base is empty. Please add cases before running a diagnosis.",
  ar: "قاعدة المعرفة فارغة. يرجى إضافة حالات قبل إجراء التشخيص.",
};

const abstainErrors = {
  he: (r) => `לא ניתן להפיק פענוח אמין: ${r} נא להעלות תמונת ECG ברורה ומלאה (רצוי 12 לידים ורשת כיול נראית).`,
  en: (r) => `Cannot produce a reliable reading: ${r} Please upload a clear, complete ECG image (ideally 12 leads with a visible calibration grid).`,
  ar: (r) => `تعذّر إنتاج قراءة موثوقة: ${r} يرجى رفع صورة تخطيط قلب واضحة وكاملة (يفضّل 12 اتجاهًا مع شبكة معايرة مرئية).`,
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
  preUploadedUrls,
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

  // 0. Upload images (or use pre-uploaded URLs) + fetch knowledge-base cases in parallel
  const [resolvedUrls, allCases] = await Promise.all([
    preUploadedUrls && preUploadedUrls.length > 0
      ? Promise.resolve(preUploadedUrls)
      : Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f }))).then((rs) => rs.map((r) => r.file_url)),
    base44.entities[entityName].list("-created_date", 1000),
  ]);
  const fileUrls = resolvedUrls;
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

  // ---------- Stage 1.5: State-of-the-art ECG engine (parallel with Stage 1) ----------
  // Structured 7-step reading + deterministic cross-check + (for urgent/uncertain
  // reads) self-consistency & adversarial verification. See ecgEngine.js.
  let ecgEnginePromise = null;
  if (analysisType === "ecg") {
    ecgEnginePromise = runEcgEngine({
      fileUrls,
      clinicalContext,
      language,
      invokeLLM: (args) => base44.integrations.Core.InvokeLLM(args),
      onStage,
      model: "gemini_3_flash",
    });
  }

  // ---------- Input quality/relevance gate for non-ECG domains (parallel) ----------
  // ECG has its own richer gate inside the engine; skin & radiology use this.
  let gatePromise = null;
  if (analysisType !== "ecg") {
    gatePromise = runInputGate({
      fileUrls,
      analysisType,
      language,
      invokeLLM: (args) => base44.integrations.Core.InvokeLLM(args),
    });
  }

  // ---------- Await parallel stages ----------
  const [extractMatchResult, ecgEngineResult, gateResult] = await Promise.all([
    stage1Promise,
    ecgEnginePromise || Promise.resolve(null),
    gatePromise || Promise.resolve(null),
  ]);

  // ---------- Input gate: refuse irrelevant / poor-quality images ----------
  if (gateResult && !gateResult.ok) {
    throw new Error(gateResult.reason);
  }

  // ---------- ECG abstention gate (anti-hallucination: refuse bad input) ----------
  if (ecgEngineResult && ecgEngineResult.abstain) {
    const build = abstainErrors[language] || abstainErrors.he;
    throw new Error(build(ecgEngineResult.abstain_reason || ""));
  }
  const ecgEngine = ecgEngineResult && !ecgEngineResult.abstain ? ecgEngineResult : null;
  const ecgStructured = ecgEngine?.structured || null;

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

  // Merge the ECG engine's own uncertainty verdict (from cross-check / verifier).
  if (ecgEngine?.uncertaintyLevel) {
    const lvlRank = { medium: 1, high: 2 };
    if (!uncertainty || (lvlRank[ecgEngine.uncertaintyLevel] || 0) > (lvlRank[uncertainty.level] || 0)) {
      uncertainty = {
        level: ecgEngine.uncertaintyLevel,
        reason: reasons[ecgEngine.uncertaintyLevel] || reasons.medium,
      };
    }
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

  // ---------- Build the structured ECG evidence block for the diagnosis stage ----------
  let ecgEvidenceBlock = "";
  if (ecgStructured) {
    const st = ecgStructured;
    const iv = st.intervals || {};
    const rr = st.rhythm_and_rate || {};
    const tc = st.technical_check || {};
    const morph = st.wave_and_segment_morphology || {};
    const hyp = st.hypertrophy_and_enlargement || {};
    const ev = (st.finding_evidence || [])
      .map((e) => `  - ${e.finding}: ${e.evidence}${e.leads ? ` [${e.leads}]` : ""}`)
      .join("\n");
    const warns = ecgEngine.warnings || [];
    ecgEvidenceBlock = `
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
- **ביטחון מכויל (לאחר הצלבה/בקרה נגדית):** ${ecgEngine.confidence}%
${warns.length ? `\n### ⚠️ אזהרות אנטי-הזיה — התייחס אליהן, אל תתעלם:\n${warns.map((w) => "- " + w).join("\n")}` : ""}

⚠️ כלל ברזל: אל תאמץ ממצא שסומן כלא-מבוסס, או שהבקרה הנגדית הפריכה, כאבחנה ודאית. אם קיימות אזהרות סתירה/אי-עקביות — שקף אי-ודאות מפורשת בפלט הסופי.`;
  }

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
${ecgEvidenceBlock}
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
3. הפרשנות ממנוע החוקים היא ראיה משלימה בלבד — אל תאמץ ממצא לא-מבוסס כשלילת/קביעת פתולוגיה.
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

  // ---------- Severity safety-net: never under-call an ECG emergency ----------
  const severityRank = { normal: 0, mild: 1, moderate: 2, severe: 3, urgent: 4 };
  let finalSeverity = diagnosis.severity;
  if (ecgStructured) {
    const urgencyFloor = { Normal: null, Urgent: "severe", Emergency: "urgent" };
    const floor = urgencyFloor[ecgStructured.clinical_urgency];
    if (floor && (severityRank[floor] || 0) > (severityRank[finalSeverity] || 0)) {
      finalSeverity = floor;
    }
  }

  // ---------- Adversarial verification for non-ECG urgent/uncertain reads ----------
  if (analysisType !== "ecg") {
    const needsVerify = ["urgent", "severe"].includes(finalSeverity) || !!uncertainty;
    if (needsVerify) {
      const verdict = await verifyDiagnosis({
        fileUrls,
        analysisType,
        primaryDiagnosis: enrichedMatches[0]?.diagnosis || enrichedMatches[0]?.title || diagnosis.summary,
        summary: diagnosis.summary,
        severity: finalSeverity,
        measurementsText,
        language,
        invokeLLM: (args) => base44.integrations.Core.InvokeLLM(args),
      }).catch(() => null);
      if (verdict && verdict.refuted) {
        uncertainty = {
          level: "high",
          reason: `${reasons.high} (בקרה נגדית: ${verdict.refutation})`,
        };
      } else if (verdict && Array.isArray(verdict.missed_findings) && verdict.missed_findings.length) {
        uncertainty = uncertainty || { level: "medium", reason: reasons.medium };
      }
    }
  }

  // ---------- Persist the analysis ----------
  const analysisRecord = await base44.entities.Analysis.create({
    type: analysisType,
    image_url: file_url,
    result: diagnosis.analysis,
    severity: finalSeverity,
    summary: diagnosis.summary,
  });

  return {
    summary: diagnosis.summary,
    severity: finalSeverity,
    analysis: diagnosis.analysis,
    matchedCases: enrichedMatches,
    imageUrl: file_url,
    findings,
    uncertainty,
    guideline: diagnosis.guideline,
    measurements,
    ecgInterpretation: ecgEngine,
    analysisId: analysisRecord.id,
  };
}
