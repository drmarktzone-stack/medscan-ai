/**
 * Procedural SVG artwork for FreeAI.
 *
 * Every illustration in the app used to be a remote Pollinations URL with a flat
 * emoji-on-gradient square as its failure state, so a slow or blocked CDN left
 * the UI looking broken. These scenes are generated locally as data URLs: they
 * render instantly, never fail, and are deterministic — the same topic always
 * produces the same picture, so lessons and cards stay visually stable.
 */

/* -------------------------------------------------------------------------- */
/* Deterministic randomness                                                    */
/* -------------------------------------------------------------------------- */

import { renderMotif } from "./motifs.js";

function hashString(input) {
  let h = 2166136261;
  const s = String(input ?? "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — small, fast, stable across runs. */
function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------- */
/* Palettes                                                                    */
/* -------------------------------------------------------------------------- */

/** Each palette is tuned so white text and dark glyphs both stay readable. */
const PALETTES = [
  { name: "aurora", sky: ["#6d28d9", "#c026d3"], glow: "#f0abfc", hill: ["#4c1d95", "#6d28d9"], accent: "#fbbf24" },
  { name: "lagoon", sky: ["#0891b2", "#3b82f6"], glow: "#a5f3fc", hill: ["#0e7490", "#1d4ed8"], accent: "#fde047" },
  { name: "sunset", sky: ["#f97316", "#e11d48"], glow: "#fed7aa", hill: ["#9a3412", "#be123c"], accent: "#fef08a" },
  { name: "meadow", sky: ["#059669", "#0d9488"], glow: "#a7f3d0", hill: ["#065f46", "#115e59"], accent: "#fcd34d" },
  { name: "berry", sky: ["#db2777", "#7c3aed"], glow: "#fbcfe8", hill: ["#9d174d", "#5b21b6"], accent: "#fde68a" },
  { name: "cosmos", sky: ["#1e1b4b", "#4c1d95"], glow: "#c7d2fe", hill: ["#172554", "#312e81"], accent: "#fcd34d" },
];

/* -------------------------------------------------------------------------- */
/* Topic → motif                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Motifs are matched on Hebrew, English and Arabic keywords because the same
 * generator serves all three locales.
 */
const MOTIFS = [
  { id: "math", glyph: "🔢", re: /math|מתמט|חשבון|מספר|number|geometry|גיאומטר|حساب/i },
  { id: "science", glyph: "🔬", re: /science|מדע|ניסוי|lab|מעבדה|chem|כימ|physics|פיזיק|علوم/i },
  { id: "space", glyph: "🪐", re: /space|חלל|כוכב|planet|כדור הארץ|galaxy|فضاء/i },
  { id: "nature", glyph: "🌳", re: /nature|טבע|צמח|plant|animal|חי|tree|עץ|طبيعة/i },
  { id: "language", glyph: "📚", re: /hebrew|עברית|english|אנגלית|language|שפה|letter|אות|read|קריא|لغة/i },
  { id: "history", glyph: "🏛️", re: /history|היסטור|עבר|ancient|תקופ|تاريخ/i },
  { id: "geography", glyph: "🗺️", re: /geo|גיאוגר|מפה|map|country|מדינה|جغرافيا/i },
  { id: "computers", glyph: "💻", re: /comput|מחשב|code|קוד|program|תכנות|robot|رובוט|حاسوب/i },
  { id: "body", glyph: "❤️", re: /body|גוף|heart|לב|health|בריאות|anatomy|איבר|جسم/i },
  { id: "food", glyph: "🍎", re: /food|מזון|אוכל|kitchen|מטבח|cook|בישול|recipe|מתכון|طعام/i },
  { id: "music", glyph: "🎵", re: /music|מוזיק|נגינ|sound|קול|song|שיר|موسيقى/i },
  { id: "art", glyph: "🎨", re: /art|אמנות|ציור|draw|design|עיצוב|paint|צבע|فن/i },
  { id: "game", glyph: "🎮", re: /game|משחק|play|puzzle|פאזל|לعبة/i },
  { id: "story", glyph: "📖", re: /story|סיפור|tale|אגד|book|ספר|قصة/i },
  { id: "logo", glyph: "🏷️", re: /logo|לוגו|brand|מותג|banner|באנר|شعار/i },
  { id: "sport", glyph: "⚽", re: /sport|ספורט|תנועה|exercise|رياضة/i },
];

const DEFAULT_MOTIF = { id: "spark", glyph: "✨" };

/** @param {string} text */
export function motifFor(text = "") {
  return MOTIFS.find((m) => m.re.test(text)) || DEFAULT_MOTIF;
}

/** Emoji shorthand for compact UI (chips, badges) where a full scene is too big. */
export function emojiForTopic(text = "") {
  return motifFor(text).glyph;
}

/* -------------------------------------------------------------------------- */
/* Scene construction                                                          */
/* -------------------------------------------------------------------------- */

function escapeXml(value) {
  return String(value ?? "").replace(/[<>&"']/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[c]);
}

/** Rounded organic blob used for the layered hills at the bottom of a scene. */
function hillPath(width, height, baseY, amplitude, random) {
  const steps = 5;
  const dx = width / steps;
  let d = `M0 ${height} L0 ${baseY}`;
  let prevY = baseY;
  for (let i = 1; i <= steps; i++) {
    const x = dx * i;
    const y = baseY + (random() - 0.5) * amplitude;
    const cx = x - dx / 2;
    d += ` Q${cx} ${prevY} ${x} ${y}`;
    prevY = y;
  }
  return `${d} L${width} ${height} Z`;
}

function decorations(width, height, random, palette, count) {
  const shapes = [];
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height * 0.66;
    const r = 2 + random() * 5;
    const opacity = (0.25 + random() * 0.5).toFixed(2);
    shapes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${palette.glow}" opacity="${opacity}"/>`);
  }
  return shapes.join("");
}

function twinkles(width, height, random, palette, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height * 0.55;
    const s = 5 + random() * 8;
    const opacity = (0.4 + random() * 0.5).toFixed(2);
    out.push(
      `<path d="M${x.toFixed(1)} ${(y - s).toFixed(1)} L${(x + s * 0.28).toFixed(1)} ${(y - s * 0.28).toFixed(1)} L${(x + s).toFixed(1)} ${y.toFixed(1)} L${(x + s * 0.28).toFixed(1)} ${(y + s * 0.28).toFixed(1)} L${x.toFixed(1)} ${(y + s).toFixed(1)} L${(x - s * 0.28).toFixed(1)} ${(y + s * 0.28).toFixed(1)} L${(x - s).toFixed(1)} ${y.toFixed(1)} L${(x - s * 0.28).toFixed(1)} ${(y - s * 0.28).toFixed(1)} Z" fill="${palette.accent}" opacity="${opacity}"/>`,
    );
  }
  return out.join("");
}

/**
 * Build a complete illustration scene.
 *
 * @param {object} options
 * @param {string} options.topic       Drives palette, motif and layout seed.
 * @param {string} [options.subject]   Extra text used for motif matching.
 * @param {string} [options.label]     Caption rendered under the motif.
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @param {number} [options.variant]   Change to get a different composition.
 * @returns {string} SVG markup
 */
export function sceneSvg(options = {}) {
  const {
    topic = "FreeAI",
    subject = "",
    label = "",
    width = 768,
    height = 480,
    variant = 0,
  } = options;

  const seed = hashString(`${topic}|${subject}|${variant}`);
  const random = makeRandom(seed);
  const palette = PALETTES[seed % PALETTES.length];
  const motif = motifFor(`${topic} ${subject}`);

  const uid = `s${seed.toString(36)}`;
  const cx = width / 2;
  const horizon = height * 0.7;
  const motifBox = Math.min(width, height) * 0.52;
  const motifCenterY = horizon - motifBox * 0.44;
  const motifScale = motifBox / 100;

  const artwork = `<g transform="translate(${(cx - motifBox / 2).toFixed(1)} ${(motifCenterY - motifBox / 2).toFixed(1)}) scale(${motifScale.toFixed(4)})">${renderMotif(motif.id, palette.accent)}</g>`;

  const caption = label
    ? `<text x="${cx}" y="${(height - 26).toFixed(1)}" font-size="${Math.round(height * 0.07)}" font-family="Heebo, system-ui, sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle" opacity="0.96">${escapeXml(label).slice(0, 32)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <defs>
    <linearGradient id="${uid}sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${palette.sky[0]}"/>
      <stop offset="100%" stop-color="${palette.sky[1]}"/>
    </linearGradient>
    <radialGradient id="${uid}glow" cx="50%" cy="52%" r="46%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${uid}hillA" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.hill[0]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${palette.hill[1]}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="${uid}hillB" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.hill[1]}"/>
      <stop offset="100%" stop-color="${palette.hill[0]}"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#${uid}sky)"/>
  ${twinkles(width, height, random, palette, 7)}
  ${decorations(width, height, random, palette, 16)}
  <ellipse cx="${cx}" cy="${motifCenterY.toFixed(1)}" rx="${(motifBox * 1.25).toFixed(1)}" ry="${(motifBox * 1.05).toFixed(1)}" fill="url(#${uid}glow)"/>

  <path d="${hillPath(width, height, horizon + height * 0.08, height * 0.09, random)}" fill="url(#${uid}hillA)"/>
  <path d="${hillPath(width, height, horizon + height * 0.18, height * 0.07, random)}" fill="url(#${uid}hillB)"/>

  ${artwork}
  ${caption}
</svg>`;
}

/** @returns {string} `data:` URL safe for use in `<img src>` and CSS. */
export function sceneDataUrl(options = {}) {
  return `data:image/svg+xml,${encodeURIComponent(sceneSvg(options))}`;
}

/** Square avatar/thumbnail variant — tighter crop, no caption. */
export function thumbDataUrl(topic, subject = "", size = 320) {
  return sceneDataUrl({ topic, subject, width: size, height: size });
}

/** Wide banner variant used for page and lesson heroes. */
export function bannerDataUrl(topic, subject = "", label = "") {
  return sceneDataUrl({ topic, subject, label, width: 960, height: 400 });
}

/**
 * Legacy name kept so existing call sites keep working; now renders a full
 * scene instead of a flat gradient square.
 */
export function emojiPlaceholderDataUrl(label = "FreeAI", _emoji = "") {
  return sceneDataUrl({ topic: label, label, width: 512, height: 512 });
}
