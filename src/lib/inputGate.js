/**
 * ============================================================================
 *  Input Quality & Relevance Gate  (anti-hallucination, all domains)
 * ============================================================================
 *
 *  The single biggest source of hallucination in an image-diagnosis tool is
 *  GARBAGE INPUT: a selfie, a screenshot, a document, a photo of the wrong body
 *  part, or a blurry / cropped image. Asked to diagnose such an image, a vision
 *  model will confidently invent findings.
 *
 *  This gate runs a cheap, fast pre-check BEFORE the heavy diagnostic pipeline
 *  and refuses to proceed when the image is not a relevant, interpretable
 *  medical image for the selected domain. (ECG has its own richer gate inside
 *  ecgEngine.js, so this module covers skin & radiology.)
 * ============================================================================
 */

const langNames = { he: "Hebrew", en: "English", ar: "Arabic" };

const DOMAINS = {
  skin: {
    he: "תצלום עור מקרוב (נגע, פריחה, שומה, ציפורן וכד')",
    en: "a close-up photograph of skin (a lesion, rash, mole, nail, etc.)",
    ar: "صورة مقرّبة للجلد (آفة، طفح، شامة، ظفر، إلخ)",
  },
  radiology: {
    he: "בדיקת הדמיה רפואית (רנטגן / CT / MRI / אולטרסאונד)",
    en: "a medical imaging study (X-ray / CT / MRI / ultrasound)",
    ar: "دراسة تصوير طبي (أشعة سينية / مقطعية / رنين / موجات فوق صوتية)",
  },
};

export const INPUT_GATE_SCHEMA = {
  type: "object",
  properties: {
    is_relevant: { type: "boolean", description: "Is this the expected kind of medical image for the domain?" },
    image_kind: { type: "string", description: "Short description of what the image actually is" },
    quality: { type: "string", enum: ["good", "acceptable", "poor"], description: "Interpretability quality" },
    interpretable: { type: "boolean", description: "Is the image clear/complete enough to analyze reliably?" },
    issues: { type: "array", items: { type: "string" }, description: "Concrete problems (blur, crop, glare, low-res, wrong subject...)" },
  },
  required: ["is_relevant", "quality", "interpretable"],
};

const rejectionMsgs = {
  he: {
    irrelevant: (kind, expected) =>
      `התמונה שהועלתה (${kind}) אינה ${expected}. נא להעלות תמונה מתאימה כדי למנוע אבחון שגוי.`,
    quality: (issues) =>
      `איכות התמונה אינה מספקת לאבחון אמין${issues ? `: ${issues}` : ""}. נא להעלות תמונה חדה, מלאה ומוארת היטב.`,
  },
  en: {
    irrelevant: (kind, expected) =>
      `The uploaded image (${kind}) is not ${expected}. Please upload an appropriate image to avoid an incorrect diagnosis.`,
    quality: (issues) =>
      `Image quality is insufficient for a reliable diagnosis${issues ? `: ${issues}` : ""}. Please upload a sharp, complete, well-lit image.`,
  },
  ar: {
    irrelevant: (kind, expected) =>
      `الصورة المرفوعة (${kind}) ليست ${expected}. يرجى رفع صورة مناسبة لتجنّب تشخيص خاطئ.`,
    quality: (issues) =>
      `جودة الصورة غير كافية لتشخيص موثوق${issues ? `: ${issues}` : ""}. يرجى رفع صورة واضحة وكاملة وجيدة الإضاءة.`,
  },
};

/**
 * Run the input gate for a non-ECG domain.
 * @returns {Promise<{ok: boolean, reason?: string, gate: object}>}
 */
export async function runInputGate({ fileUrls, analysisType, language = "he", invokeLLM, model = "gemini_3_flash" }) {
  const domain = DOMAINS[analysisType];
  if (!domain) return { ok: true, gate: null }; // unknown domain → don't block

  const outputLang = langNames[language] || "Hebrew";
  const expected = domain.en;

  const gate = await invokeLLM({
    prompt: `You are a strict medical image intake screener. Your ONLY job is to decide whether the FIRST image is suitable for analysis in this domain. Do NOT diagnose.

## Expected image type for this domain
${expected}

## Decide
1. is_relevant: Is the first image genuinely ${expected}? A selfie, screenshot, document, drawing, unrelated object, or the wrong body part / wrong modality → is_relevant=false.
2. quality: good / acceptable / poor — based on sharpness, framing, lighting, resolution, completeness.
3. interpretable: true only if a clinician could reliably read it. Heavy blur, extreme crop, glare, or tiny/low-res → false.
4. issues: list concrete problems.

Be conservative: when in doubt about relevance or quality, mark it down. It is far safer to ask for a better image than to analyze a bad one. Any free-text you write should be in ${outputLang}. Return JSON per the schema.`,
    file_urls: fileUrls,
    response_json_schema: INPUT_GATE_SCHEMA,
    add_context_from_internet: false,
    model,
  });

  const msgs = rejectionMsgs[language] || rejectionMsgs.he;

  if (gate && gate.is_relevant === false) {
    return { ok: false, reason: msgs.irrelevant(gate.image_kind || "—", domain[language] || domain.he), gate };
  }
  if (gate && (gate.interpretable === false || gate.quality === "poor")) {
    const issues = Array.isArray(gate.issues) ? gate.issues.join("، ") : "";
    return { ok: false, reason: msgs.quality(issues), gate };
  }
  return { ok: true, gate };
}
