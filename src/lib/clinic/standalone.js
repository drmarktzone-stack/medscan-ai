/**
 * Standalone (free-host) mode — the app runs as a static site
 * without Base44 credits, hosting, or LLM. Text engines stay on-device.
 */

export function readStandaloneFlag(env = {}) {
  const a = env.VITE_STANDALONE;
  const b = env.VITE_LOCAL_CLINIC;
  return a === 'true' || a === '1' || b === 'true' || b === '1';
}

export function isStandaloneBuild(env) {
  try {
    return readStandaloneFlag(env ?? (typeof import.meta !== 'undefined' ? import.meta.env : {}) ?? {});
  } catch {
    return false;
  }
}

/** React Router basename from Vite `base` ('' at site root, '/repo' on GitHub Pages). */
export function routerBasename(baseUrl = '/') {
  const trimmed = String(baseUrl || '/').replace(/\/$/, '');
  if (!trimmed || trimmed === '.' || trimmed === './') return undefined;
  return trimmed;
}

/**
 * Full-page jumps (`window.location.href`) must include Vite `base`.
 * Without this, GitHub Pages goes to github.io/parent instead of github.io/medscan-ai/parent.
 */
export function absoluteAppPath(path, baseUrl) {
  const rel = String(path || "/");
  const relNorm = rel.startsWith("/") ? rel : `/${rel}`;
  const raw = baseUrl ?? (typeof import.meta !== "undefined" ? import.meta.env?.BASE_URL : "/");
  const base = routerBasename(raw);
  if (!base) return relNorm;
  if (relNorm === "/") return `${base}/`;
  if (relNorm === base || relNorm.startsWith(`${base}/`)) return relNorm;
  return `${base}${relNorm}`;
}

/** Hosted Base44 public-settings / me() must not spin the app forever. */
export const AUTH_BOOT_DEADLINE_MS = 2500;

export function withDeadline(promise, ms = AUTH_BOOT_DEADLINE_MS, label = "deadline") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(label), { deadline: true })), ms);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

export function isBase44CreditFailure(err) {
  const status = Number(err?.status || err?.response?.status || 0);
  if ([402, 429, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || err?.data?.message || '');
  return /credit|quota|payment|payment required|insufficient|402|out of credits/i.test(msg);
}
