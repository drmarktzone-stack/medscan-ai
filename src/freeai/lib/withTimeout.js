/**
 * Race a promise against a timeout.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} [fallback]
 */
export function withTimeout(promise, ms, fallback = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}
