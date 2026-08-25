/**
 * Kids Media Router — routes image / video / animation requests through
 * all free provider pools (in-app API → instant Pollinations → browser links).
 */

import { generateFree } from "../../lib/router.js";
import { providersForCapability } from "../../data/providers.js";
import { loadCreditState } from "../../lib/creditStore.js";
import { generatePollinationsBatch, buildPollinationsUrl } from "../../lib/generators/pollinations.js";

const KIDS_STYLE =
  "cute kawaii cartoon, colorful, kids educational illustration, soft pastel, safe for children, no text, no watermark";

/** @typedef {'image'|'video'|'animation'|'design'} KidsMediaType */

function kidSafePrompt(prompt) {
  return `${KIDS_STYLE}, ${prompt}`;
}

/**
 * Browser-provider deep links for when kid wants video / high-quality art in external tool.
 * @param {KidsMediaType} type
 * @param {string} prompt
 */
export function buildProviderLinks(type, prompt) {
  const cap = type === "animation" ? "video" : type;
  const creditState = loadCreditState();
  const encoded = encodeURIComponent(prompt.slice(0, 200));

  return providersForCapability(cap)
    .filter((p) => creditState[p.id]?.enabled !== false && (p.generateUrl || p.url))
    .slice(0, 6)
    .map((p) => {
      let url = p.generateUrl || p.url;
      if (p.id === "pollinations") {
        url = `https://pollinations.ai/p/${encoded}`;
      }
      return {
        id: p.id,
        name: p.nameHe,
        nameEn: p.name,
        url,
        accessMode: p.accessMode,
        quality: p.quality,
        isBrowser: p.accessMode === "browser" || p.accessMode === "app",
      };
    });
}

/**
 * Multi-frame flipbook — instant "animation" feel without waiting for video APIs.
 * @param {string} prompt
 * @param {number} count
 */
export function animationFramesFromPrompt(prompt, count = 4) {
  const frames = [];
  const baseSeed = Date.now();
  const safe = kidSafePrompt(prompt);

  for (let i = 0; i < count; i++) {
    const framePrompt = `${safe}, animation frame ${i + 1} of ${count}, subtle motion`;
    frames.push({
      id: `anim-${baseSeed}-${i}`,
      url: buildPollinationsUrl(framePrompt, { width: 640, height: 480, seed: baseSeed + i * 9973 }),
      provider: "pollinations",
      frame: i,
    });
  }
  return frames;
}

/** Preload URLs so images appear instantly when rendered. */
export function preloadMediaUrls(urls) {
  if (typeof Image === "undefined") return;
  for (const url of urls) {
    if (!url) continue;
    const img = new Image();
    img.src = url;
  }
}

/**
 * Main entry — generate kid-safe media with instant display + provider fallbacks.
 * @param {{ type?: KidsMediaType; prompt: string; count?: number }} opts
 */
export async function generateKidsMedia(opts) {
  const { type = "image", prompt, count = 1 } = opts;
  const safePrompt = kidSafePrompt(prompt);
  const apiType = type === "animation" || type === "video" ? "image" : type;

  const inApp = await generateFree({ type: apiType, prompt: safePrompt, count });
  const providerLinks = buildProviderLinks(type, prompt);

  let images = [];
  let provider = "pollinations";
  let fallbackReason = null;

  if (inApp.ok && inApp.images?.length) {
    images = inApp.images;
    provider = inApp.provider;
  } else {
    fallbackReason = inApp.reason;
    const batch = generatePollinationsBatch(safePrompt, count);
    images = batch.images;
    provider = batch.provider;
  }

  const wantsMotion = type === "animation" || type === "video";
  const animationFrames = wantsMotion ? animationFramesFromPrompt(prompt, Math.max(count, 4)) : undefined;

  const urls = [
    ...images.map((i) => i.url),
    ...(animationFrames || []).map((f) => f.url),
  ];
  preloadMediaUrls(urls);

  return {
    ok: true,
    type,
    instant: { images, animationFrames },
    provider,
    providerLinks,
    fallbackReason,
    creditsUsed: inApp.creditsUsed,
    remaining: inApp.remaining,
  };
}

/** Batch variant for story scenes etc. */
export async function generateKidsMediaBatch(requests) {
  return Promise.all(requests.map((r) => generateKidsMedia(r)));
}

/** Pick best instant image URL from media result. */
export function firstImageUrl(media) {
  return media?.instant?.images?.[0]?.url || media?.instant?.animationFrames?.[0]?.url || null;
}
