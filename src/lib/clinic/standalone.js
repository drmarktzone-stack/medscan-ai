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

export function isBase44CreditFailure(err) {
  const status = Number(err?.status || err?.response?.status || 0);
  if ([402, 429, 502, 503, 504].includes(status)) return true;
  const msg = String(err?.message || err?.data?.message || '');
  return /credit|quota|payment|payment required|insufficient|402|out of credits/i.test(msg);
}
