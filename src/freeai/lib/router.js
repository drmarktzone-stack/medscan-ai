/**
 * FreeAI Hub — routes generation tasks to the best available free provider.
 */

import { providersForCapability } from "../data/providers.js";
import { loadCreditState, useCredits, loadApiKeys } from "./creditStore.js";
import { generatePollinationsBatch, validatePrompt } from "./generators/pollinations.js";
import { withImageFallback } from "./visualFallback.js";

/**
 * Find best provider for immediate in-app generation.
 * @param {'image'|'video'|'design'|'edit'} taskType
 */
export function findInAppProvider(taskType) {
  const creditState = loadCreditState();
  const candidates = providersForCapability(taskType).filter((p) => {
    if (creditState[p.id]?.enabled === false) return false;
    if (p.id === "pollinations" && taskType === "image") return true;
    if (p.hasApi && p.accessMode === "api" && !p.needsKey) return true;
    return false;
  });

  for (const p of candidates) {
    const rem = creditState[p.id]?.remaining ?? 0;
    if (rem >= (p.costPerUnit ?? 1)) return p;
  }
  return null;
}

/**
 * Generate content using the best available free in-app provider.
 * @param {{ type: string; prompt: string; count?: number }} request
 */
export async function generateFree(request) {
  const { type = "image", prompt, count = 1 } = request;

  const validation = validatePrompt(prompt);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  const provider = findInAppProvider(type);
  if (!provider) {
    return {
      ok: false,
      reason: "no_in_app_provider",
      suggestion: "browser",
      messageHe: "אין ספק API חינמי זמין — השתמש בתוכנית הפרויקט לפתיחת כלים בדפדפן",
      messageEn: "No free in-app API available — use the project plan to open browser tools",
    };
  }

  if (provider.id === "pollinations") {
    const creditResult = useCredits("pollinations", count);
    if (!creditResult.ok) {
      return { ok: false, reason: creditResult.reason, remaining: creditResult.remaining };
    }
    const batch = generatePollinationsBatch(prompt, count);
    return {
      ...batch,
      images: batch.images.map((img) => withImageFallback(img, prompt)),
      creditsUsed: 0,
      remaining: creditResult.remaining,
    };
  }

  return { ok: false, reason: "provider_not_implemented", providerId: provider.id };
}

/**
 * Get next recommended action when credits run out on a provider.
 * @param {string} taskType
 * @param {string} [excludeProviderId]
 */
export function getNextProvider(taskType, excludeProviderId) {
  const creditState = loadCreditState();
  const providers = providersForCapability(taskType).filter((p) => {
    if (p.id === excludeProviderId) return false;
    if (creditState[p.id]?.enabled === false) return false;
    return (creditState[p.id]?.remaining ?? 0) >= (p.costPerUnit ?? 1);
  });

  return providers[0] ?? null;
}

/**
 * Check which providers need API keys that user hasn't configured.
 */
export function missingApiKeys() {
  const keys = loadApiKeys();
  const creditState = loadCreditState();
  const missing = [];

  for (const p of providersForCapability("image")) {
    if (!p.hasApi || !p.needsKey) continue;
    if (creditState[p.id]?.enabled === false) continue;
    if (!keys[p.id]) {
      missing.push({ id: p.id, name: p.nameHe, url: p.url });
    }
  }
  return missing;
}
