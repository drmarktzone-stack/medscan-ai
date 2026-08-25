/**
 * Vector motifs for FreeAI artwork.
 *
 * Each motif is drawn inside a 100x100 box so `artwork.js` can scale and place
 * it freely. These are real paths rather than emoji glyphs because emoji render
 * differently (or not at all) depending on the device's installed fonts, which
 * made illustrations look inconsistent across phones.
 *
 * `ink` is the motif's own colour ramp; `accent` comes from the scene palette so
 * every illustration stays in harmony with its background.
 */

const WHITE = "#ffffff";

/** @typedef {(accent: string) => string} MotifRenderer */

/** Soft drop shadow shared by all motifs. */
function shadow() {
  return `<ellipse cx="50" cy="94" rx="30" ry="5" fill="#000000" opacity="0.16"/>`;
}

/** @type {Record<string, { render: MotifRenderer }>} */
export const MOTIF_ART = {
  math: {
    render: (accent) => `
      ${shadow()}
      <rect x="10" y="20" width="46" height="46" rx="10" fill="${WHITE}" opacity="0.95"/>
      <rect x="10" y="20" width="46" height="46" rx="10" fill="${accent}" opacity="0.18"/>
      <path d="M26 43h14M33 36v14" stroke="#312e81" stroke-width="6" stroke-linecap="round"/>
      <circle cx="74" cy="34" r="16" fill="${accent}"/>
      <path d="M74 54 L92 86 L56 86 Z" fill="${WHITE}" opacity="0.92"/>
    `,
  },

  science: {
    render: (accent) => `
      ${shadow()}
      <path d="M42 10h16v6h-4v22l20 38q4 8-5 8H31q-9 0-5-8l20-38V16h-4z" fill="${WHITE}" opacity="0.94"/>
      <path d="M35 62h30l9 14q4 8-5 8H31q-9 0-5-8z" fill="${accent}"/>
      <circle cx="44" cy="72" r="4" fill="${WHITE}" opacity="0.75"/>
      <circle cx="58" cy="77" r="3" fill="${WHITE}" opacity="0.6"/>
      <circle cx="52" cy="66" r="2.5" fill="${WHITE}" opacity="0.55"/>
    `,
  },

  space: {
    render: (accent) => `
      ${shadow()}
      <circle cx="50" cy="46" r="26" fill="${accent}"/>
      <path d="M50 20a26 26 0 0 1 0 52 26 26 0 0 1 0-52z" fill="${WHITE}" opacity="0.14"/>
      <circle cx="40" cy="38" r="6" fill="${WHITE}" opacity="0.32"/>
      <circle cx="60" cy="55" r="4" fill="${WHITE}" opacity="0.26"/>
      <ellipse cx="50" cy="48" rx="44" ry="11" fill="none" stroke="${WHITE}" stroke-width="5" opacity="0.85" transform="rotate(-18 50 48)"/>
    `,
  },

  nature: {
    render: (accent) => `
      ${shadow()}
      <rect x="45" y="58" width="10" height="32" rx="4" fill="#92400e"/>
      <circle cx="50" cy="34" r="22" fill="${accent}"/>
      <circle cx="31" cy="49" r="15" fill="${accent}" opacity="0.88"/>
      <circle cx="69" cy="49" r="15" fill="${accent}" opacity="0.88"/>
      <circle cx="43" cy="28" r="7" fill="${WHITE}" opacity="0.28"/>
    `,
  },

  language: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 26q-14-10-34-8v52q20-2 34 8z" fill="${WHITE}" opacity="0.95"/>
      <path d="M50 26q14-10 34-8v52q-20-2-34 8z" fill="${accent}"/>
      <path d="M25 34h18M25 44h18M25 54h14" stroke="#4338ca" stroke-width="3.5" stroke-linecap="round" opacity="0.65"/>
      <path d="M57 34h18M57 44h18M57 54h14" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>
    `,
  },

  history: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 10 92 30H8z" fill="${accent}"/>
      <rect x="14" y="34" width="72" height="6" rx="3" fill="${WHITE}" opacity="0.9"/>
      <rect x="22" y="42" width="10" height="36" rx="4" fill="${WHITE}" opacity="0.9"/>
      <rect x="45" y="42" width="10" height="36" rx="4" fill="${WHITE}" opacity="0.9"/>
      <rect x="68" y="42" width="10" height="36" rx="4" fill="${WHITE}" opacity="0.9"/>
      <rect x="12" y="80" width="76" height="8" rx="4" fill="${WHITE}" opacity="0.95"/>
    `,
  },

  geography: {
    render: (accent) => `
      ${shadow()}
      <circle cx="50" cy="48" r="34" fill="${WHITE}" opacity="0.95"/>
      <circle cx="50" cy="48" r="34" fill="${accent}" opacity="0.25"/>
      <path d="M50 14v68M16 48h68" stroke="${accent}" stroke-width="3" opacity="0.7"/>
      <ellipse cx="50" cy="48" rx="16" ry="34" fill="none" stroke="${accent}" stroke-width="3" opacity="0.7"/>
      <path d="M30 36q10 6 20 2t22 4l-6 12q-14-4-22 2t-18-2z" fill="${accent}" opacity="0.85"/>
    `,
  },

  computers: {
    render: (accent) => `
      ${shadow()}
      <rect x="16" y="20" width="68" height="46" rx="7" fill="${WHITE}" opacity="0.95"/>
      <rect x="22" y="26" width="56" height="34" rx="4" fill="${accent}"/>
      <path d="M30 36h22M30 44h30M30 52h16" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/>
      <path d="M8 74h84q0 10-10 10H18q-10 0-10-10z" fill="${WHITE}" opacity="0.9"/>
    `,
  },

  body: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 86C22 64 10 48 10 34 10 21 20 11 32 11c8 0 14 4 18 10 4-6 10-10 18-10 12 0 22 10 22 23 0 14-12 30-40 52z" fill="${accent}"/>
      <path d="M32 24c-6 0-10 5-10 11" stroke="${WHITE}" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
    `,
  },

  food: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 26c-6-8-20-8-26 2s-2 34 8 46c6 7 12 6 18 6s12 1 18-6c10-12 14-36 8-46s-20-10-26-2z" fill="${accent}"/>
      <path d="M50 26c0-10 6-16 16-18 1 10-5 16-16 18z" fill="#22c55e"/>
      <path d="M34 40c-3 6-3 14 0 20" stroke="${WHITE}" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    `,
  },

  music: {
    render: (accent) => `
      ${shadow()}
      <rect x="52" y="14" width="7" height="52" rx="3.5" fill="${WHITE}" opacity="0.95"/>
      <path d="M59 14q22 6 22 22-8-10-22-10z" fill="${accent}"/>
      <ellipse cx="41" cy="68" rx="18" ry="13" fill="${accent}" transform="rotate(-18 41 68)"/>
      <ellipse cx="41" cy="68" rx="9" ry="6" fill="${WHITE}" opacity="0.3" transform="rotate(-18 41 68)"/>
    `,
  },

  art: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 12c22 0 40 15 40 34 0 12-10 16-18 16h-8c-6 0-9 4-9 9 0 6-5 11-12 11-19 0-33-16-33-36S28 12 50 12z" fill="${WHITE}" opacity="0.95"/>
      <circle cx="34" cy="34" r="6" fill="#ef4444"/>
      <circle cx="52" cy="26" r="6" fill="${accent}"/>
      <circle cx="70" cy="36" r="6" fill="#3b82f6"/>
      <circle cx="32" cy="56" r="6" fill="#22c55e"/>
    `,
  },

  game: {
    render: (accent) => `
      ${shadow()}
      <path d="M26 28h48q18 0 18 22t-12 26q-8 4-13-4l-5-8H36l-5 8q-5 8-13 4Q6 72 6 50t20-22z" fill="${WHITE}" opacity="0.95"/>
      <path d="M22 42h14M29 35v14" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="70" cy="38" r="5.5" fill="${accent}"/>
      <circle cx="80" cy="50" r="5.5" fill="${accent}" opacity="0.7"/>
    `,
  },

  story: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 30q-14-12-36-10v52q22-2 36 10z" fill="${WHITE}" opacity="0.95"/>
      <path d="M50 30q14-12 36-10v52q-22-2-36 10z" fill="${accent}"/>
      <path d="M68 36l3.5 7 7.5 1-5.5 5 1.5 8-6.5-4-6.5 4 1.5-8-5.5-5 7.5-1z" fill="${WHITE}" opacity="0.9"/>
    `,
  },

  logo: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 8l36 14v28c0 20-15 32-36 40-21-8-36-20-36-40V22z" fill="${accent}"/>
      <path d="M50 8l36 14v28c0 20-15 32-36 40z" fill="${WHITE}" opacity="0.12"/>
      <path d="M50 28l6.5 13.5L71 43l-10.5 10 2.5 15L50 61l-13 7 2.5-15L29 43l14.5-1.5z" fill="${WHITE}" opacity="0.95"/>
    `,
  },

  sport: {
    render: (accent) => `
      ${shadow()}
      <circle cx="50" cy="48" r="34" fill="${WHITE}" opacity="0.95"/>
      <path d="M50 30l13 9-5 15H42l-5-15z" fill="${accent}"/>
      <path d="M50 14v10M22 40l10 6M78 40l-10 6M34 78l8-9M66 78l-8-9" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
    `,
  },

  spark: {
    render: (accent) => `
      ${shadow()}
      <path d="M50 8l9 26 26 9-26 9-9 26-9-26-26-9 26-9z" fill="${accent}"/>
      <path d="M50 8l9 26 26 9-35 0z" fill="${WHITE}" opacity="0.2"/>
      <circle cx="22" cy="24" r="5" fill="${WHITE}" opacity="0.75"/>
      <circle cx="80" cy="72" r="4" fill="${WHITE}" opacity="0.6"/>
    `,
  },
};

/**
 * @param {string} id
 * @param {string} accent
 * @returns {string} SVG fragment in a 0..100 coordinate box
 */
export function renderMotif(id, accent) {
  const motif = MOTIF_ART[id] || MOTIF_ART.spark;
  return motif.render(accent);
}
