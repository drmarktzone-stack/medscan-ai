/**
 * Resolve with `fallback` if `promise` takes longer than `ms` — or rejects.
 *
 * Callers use this to keep a slow or failing provider from blocking a screen,
 * so a rejection has to behave like a timeout. Without swallowing rejections a
 * single failure inside `Promise.all` would take down the whole screen.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} [fallback]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, fallback = null) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });

  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    timeout,
  ]).finally(() => clearTimeout(timer));
}

/**
 * Run several independent tasks, replacing any that time out or throw with
 * `fallback` instead of failing the whole batch.
 *
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} ms
 * @param {any} [fallback]
 */
export function allSettledWithTimeout(tasks, ms, fallback = null) {
  return Promise.all(tasks.map((task) => {
    // A task that throws before returning a promise would otherwise escape the
    // race and reject the whole batch synchronously.
    try {
      return withTimeout(task(), ms, fallback);
    } catch {
      return Promise.resolve(fallback);
    }
  }));
}
