/**
 * Local clinic session — the app can run on this computer without a remote account.
 * A hosted app shows the login/register screens unless the physician chose
 * "continue on this computer", or VITE_LOCAL_CLINIC is set.
 */

export const LOCAL_CLINIC_KEY = 'doctorped_local_clinic_v1';
export const LOCAL_CLINIC_USER = Object.freeze({ id: 'local-clinic', local: true, email: null });

export function resolveLocalClinicMode({
  env = {},
  storage = null,
  appId = null,
  token = null,
  base44Reachable,
} = {}) {
  if (env.VITE_FORCE_AUTH === 'true' || env.VITE_FORCE_AUTH === '1') return false;
  if (env.VITE_LOCAL_CLINIC === 'true' || env.VITE_LOCAL_CLINIC === '1') return true;
  try {
    if (storage?.getItem?.(LOCAL_CLINIC_KEY) === '1') return true;
  } catch {
    /* ignore quota / private mode */
  }
  if (!appId) return true;
  if (base44Reachable === false) return true;
  void token;
  return false;
}

function liveEnv() {
  try {
    return import.meta.env || {};
  } catch {
    return {};
  }
}

export function isLocalClinicSession(overrides = {}) {
  return resolveLocalClinicMode({
    env: overrides.env ?? liveEnv(),
    storage: overrides.storage ?? (typeof localStorage === 'undefined' ? null : localStorage),
    appId: overrides.appId ?? null,
    token: overrides.token ?? null,
    base44Reachable: overrides.base44Reachable,
  });
}

export function enableLocalClinic(storage) {
  const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
  if (store) store.setItem(LOCAL_CLINIC_KEY, '1');
}

export function disableLocalClinic(storage) {
  const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
  if (store) store.removeItem(LOCAL_CLINIC_KEY);
}
