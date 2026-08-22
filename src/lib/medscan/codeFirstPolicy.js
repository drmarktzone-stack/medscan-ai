/**
 * When to skip the language gate and answer from deterministic code.
 * Development mode is not a reason to skip — it only lets draft KB
 * enter the FactBlock inside groundedInvoke.
 */
export function decideCodeFirst({ standalone = false, appId = null, invokeLLM = null } = {}) {
  if (standalone) return true;
  if (!appId) return true;
  return typeof invokeLLM !== 'function';
}
