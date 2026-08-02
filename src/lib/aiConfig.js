/**
 * ============================================================================
 *  Central AI model configuration
 * ============================================================================
 *  All diagnostic reasoning and content-generation calls route their `model`
 *  through here, so switching the underlying vision/reasoning model is a
 *  ONE-LINE change instead of hunting through every engine.
 *
 *  The model string is passed to Base44's `Core.InvokeLLM({ model })`. Only
 *  identifiers your Base44 project actually provisions will work — verify a
 *  model is available before switching, or every AI call will fail.
 *
 *  To move to Claude (as the engine specs request), set DIAGNOSIS_MODEL to the
 *  Claude identifier exposed by your Base44 workspace, e.g. something like
 *  "claude_3_5_sonnet" / "claude_3_opus" (confirm the exact string in Base44).
 * ============================================================================
 */

// High-precision vision + reasoning model used for image interpretation,
// the structured engines, criteria verification and adversarial checks.
export const DIAGNOSIS_MODEL = "gemini_3_flash";

// Model used for bulk content generation / evaluation matching (throughput).
export const GENERATION_MODEL = "gemini_3_1_pro";
