/**
 * Pollinations.ai — free image generation, no API key required.
 * https://pollinations.ai/
 */

/**
 * Build Pollinations image URL for a prompt.
 * @param {string} prompt
 * @param {{ width?: number; height?: number; seed?: number; model?: string }} [opts]
 */
export function buildPollinationsUrl(prompt, opts = {}) {
  const { width = 1024, height = 1024, seed, model = "flux" } = opts;
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({ width: String(width), height: String(height), model });
  if (seed != null) params.set("seed", String(seed));
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

/**
 * Generate image URLs (client-side — actual fetch happens in browser/img tag).
 * @param {string} prompt
 * @param {number} count
 */
export function generatePollinationsBatch(prompt, count = 1) {
  const results = [];
  const baseSeed = Date.now();

  for (let i = 0; i < count; i++) {
    const seed = baseSeed + i * 7919;
    results.push({
      id: `poll-${seed}`,
      url: buildPollinationsUrl(prompt, { seed }),
      provider: "pollinations",
      prompt,
      seed,
    });
  }

  return { ok: true, images: results, provider: "pollinations" };
}

/**
 * Estimate if prompt is safe/valid for generation.
 */
export function validatePrompt(prompt) {
  if (!prompt || prompt.trim().length < 3) {
    return { ok: false, reason: "prompt_too_short" };
  }
  if (prompt.length > 2000) {
    return { ok: false, reason: "prompt_too_long" };
  }
  return { ok: true };
}
