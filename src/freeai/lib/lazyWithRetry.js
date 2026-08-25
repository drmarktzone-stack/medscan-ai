import { lazy } from "react";

/**
 * `React.lazy` that survives a deploy.
 *
 * Chunk filenames are content-hashed, so a tab holding the previous
 * `index.html` asks for chunks that no longer exist and the dynamic import
 * rejects — the page then renders the error boundary until the user happens to
 * hard-refresh.
 *
 * A failed import is retried once (covering a transient network blip); if it
 * fails again the page is reloaded once to pick up the current asset manifest.
 * The reload is recorded in `sessionStorage` so a genuinely broken chunk cannot
 * turn into a refresh loop.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} factory
 * @param {string} key Stable id used to remember that a reload was attempted.
 */
export function lazyWithRetry(factory, key) {
  const storageKey = `freeai_chunk_reload_${key}`;

  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(storageKey);
      return mod;
    } catch (error) {
      try {
        return await factory();
      } catch (retryError) {
        const alreadyReloaded = sessionStorage.getItem(storageKey) === "1";
        if (!alreadyReloaded && typeof window !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
          window.location.reload();
          // Keep the promise pending so nothing renders during the reload.
          return new Promise(() => {});
        }
        throw retryError;
      }
    }
  });
}
