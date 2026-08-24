/**
 * Supabase REST helpers for WeiChat sync.
 */

export function getSupabaseConfig() {
  const url = String(import.meta.env?.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(import.meta.env?.VITE_SUPABASE_ANON_KEY || '');
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}
