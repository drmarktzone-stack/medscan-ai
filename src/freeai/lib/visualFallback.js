/**
 * Reliable visual fallbacks when external image CDNs fail.
 * SVG data URLs — always load, no network.
 */

const PALETTES = [
  ["#8b5cf6", "#ec4899"],
  ["#06b6d4", "#3b82f6"],
  ["#f59e0b", "#ef4444"],
  ["#10b981", "#14b8a6"],
  ["#6366f1", "#a855f7"],
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** @param {string} label @param {string} [emoji] */
export function emojiPlaceholderDataUrl(label = "FreeAI", emoji = "✨") {
  const [c1, c2] = PALETTES[hash(label) % PALETTES.length];
  const safe = String(label).slice(0, 24).replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <text x="256" y="220" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="256" y="340" font-size="28" fill="white" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle">${safe}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Pick emoji by topic keywords */
export function emojiForTopic(text = "") {
  const t = text.toLowerCase();
  if (/cat|חתול|כלב|dog|animal|חיה|חתולים/.test(t)) return "🐱";
  if (/math|חשב|מספר|number/.test(t)) return "🔢";
  if (/science|מדע|ניסוי|lab/.test(t)) return "🔬";
  if (/game|משחק|play/.test(t)) return "🎮";
  if (/story|סיפור|book/.test(t)) return "📖";
  if (/music|מוזיק|sound|קול/.test(t)) return "🎵";
  if (/food|מזון|מטבח|kitchen|pizza|עוג/.test(t)) return "🍕";
  if (/house|בית|home|car|מכונית/.test(t)) return "🏠";
  if (/logo|לוגו|brand/.test(t)) return "🏷️";
  if (/body|גוף|heart|לב/.test(t)) return "❤️";
  return "✨";
}

/** @param {{ id?: string; url?: string; prompt?: string; label?: string }} img */
export function withImageFallback(img, label = "") {
  const topic = label || img?.prompt || img?.label || "FreeAI";
  const emoji = emojiForTopic(topic);
  return {
    ...img,
    id: img?.id || `fb-${hash(topic)}`,
    url: img?.url || emojiPlaceholderDataUrl(topic, emoji),
    fallbackUrl: emojiPlaceholderDataUrl(topic, emoji),
  };
}
