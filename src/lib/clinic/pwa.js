/**
 * Installable clinic shell (PWA).
 * Relative URLs so GitHub Pages at /medscan-ai/ still opens the app, not github.io/.
 */

export function serviceWorkerUrl(baseUrl = "/") {
  const raw = String(baseUrl || "/").trim() || "/";
  if (raw === "./" || raw === ".") return "./sw.js";
  const withSlash = raw.endsWith("/") ? raw : `${raw}/`;
  return `${withSlash}sw.js`;
}

export async function registerClinicPwa({ env = {}, register } = {}) {
  if (env.DEV === true || env.MODE === "development") return null;
  if (typeof register !== "function") return null;
  try {
    return await register(serviceWorkerUrl(env.BASE_URL));
  } catch {
    return null;
  }
}
