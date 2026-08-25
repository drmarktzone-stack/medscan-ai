/**
 * Image fallbacks.
 *
 * Kept as a thin re-export so the many existing call sites keep working while
 * the actual drawing lives in `artwork.js`.
 */

export {
  emojiPlaceholderDataUrl,
  emojiForTopic,
  sceneDataUrl,
  thumbDataUrl,
  bannerDataUrl,
} from "./artwork.js";

import { sceneDataUrl } from "./artwork.js";

/**
 * Attach a locally generated fallback to a remote image descriptor.
 * @param {{ id?: string; url?: string; prompt?: string; label?: string }} img
 * @param {string} [label]
 */
export function withImageFallback(img, label = "") {
  const topic = label || img?.prompt || img?.label || "FreeAI";
  const fallbackUrl = sceneDataUrl({ topic, width: 512, height: 512 });
  return {
    ...img,
    id: img?.id || `fb-${topic.length}-${Math.abs(topic.charCodeAt(0) || 0)}`,
    url: img?.url || fallbackUrl,
    fallbackUrl,
  };
}
