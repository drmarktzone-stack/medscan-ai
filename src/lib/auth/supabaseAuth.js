/**
 * Supabase GoTrue auth for standalone builds (free tier).
 * Session stored in localStorage — no extra npm dependency.
 */

import { getSupabaseConfig } from '../supabase/client.js';
import { absoluteAppPath } from '../clinic/standalone.js';

const SESSION_KEY = 'doctorped_supabase_session_v1';

function authHeaders(cfg, token = null) {
  const h = {
    apikey: cfg.anonKey,
    'Content-Type': 'application/json',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session) {
  if (!session?.access_token) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function mapSupabaseUser(session) {
  const u = session?.user || {};
  return {
    id: u.id,
    email: u.email || '',
    supabase: true,
    local: false,
    full_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
  };
}

async function parseAuthResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.msg || json?.error_description || json?.error || 'auth_failed';
    const err = new Error(String(msg));
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export async function supabaseSignIn(email, password) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('supabase_env_missing');
  const res = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseAuthResponse(res);
  saveStoredSession(data);
  return data;
}

export async function supabaseSignUp(email, password, metadata = {}) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('supabase_env_missing');
  const res = await fetch(`${cfg.url}/auth/v1/signup`, {
    method: 'POST',
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, password, data: metadata }),
  });
  const data = await parseAuthResponse(res);
  if (data.access_token) saveStoredSession(data);
  return data;
}

export async function supabaseSignOut() {
  const cfg = getSupabaseConfig();
  const session = loadStoredSession();
  clearStoredSession();
  if (!cfg || !session?.access_token) return;
  try {
    await fetch(`${cfg.url}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(cfg, session.access_token),
    });
  } catch {
    /* local session already cleared */
  }
}

export async function supabaseGetUser() {
  const cfg = getSupabaseConfig();
  const session = loadStoredSession();
  if (!cfg || !session?.access_token) return null;
  const res = await fetch(`${cfg.url}/auth/v1/user`, {
    headers: authHeaders(cfg, session.access_token),
  });
  if (res.status === 401) {
    clearStoredSession();
    return null;
  }
  const user = await parseAuthResponse(res);
  return { ...session, user };
}

export async function supabaseResetPasswordRequest(email) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('supabase_env_missing');
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}${absoluteAppPath('/reset-password')}`
    : undefined;
  const res = await fetch(`${cfg.url}/auth/v1/recover`, {
    method: 'POST',
    headers: authHeaders(cfg),
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error(json?.msg || 'reset_failed');
    err.status = res.status;
    throw err;
  }
}

export async function supabaseUpdatePassword(newPassword, accessToken) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('supabase_env_missing');
  const token = accessToken || loadStoredSession()?.access_token;
  if (!token) throw new Error('no_session');
  const res = await fetch(`${cfg.url}/auth/v1/user`, {
    method: 'PUT',
    headers: authHeaders(cfg, token),
    body: JSON.stringify({ password: newPassword }),
  });
  return parseAuthResponse(res);
}

/** Parse access_token from Supabase email recovery hash (#access_token=...) */
export function parseRecoveryTokenFromHash(hash = '') {
  const h = String(hash || '').replace(/^#/, '');
  if (!h) return null;
  const params = new URLSearchParams(h);
  return params.get('access_token') || params.get('token') || null;
}
