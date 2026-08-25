/** Trilingual label picker for FreeAI Kids (he / en / ar) */

export function resolveKidsLang(lang) {
  const l = String(lang || "he").toLowerCase();
  if (l === "en" || l === "ar") return l;
  return "he";
}

/** @param {{ he: string; en: string; ar: string }} labels @param {string} lang */
export function pickL(labels, lang) {
  const loc = resolveKidsLang(lang);
  return labels[loc] ?? labels.he ?? labels.en ?? "";
}

/** @param {Record<string, { he: string; en: string; ar: string }>} dict @param {string} key @param {string} lang */
export function tKids(dict, key, lang) {
  const entry = dict[key];
  if (!entry) return key;
  return pickL(entry, lang);
}
