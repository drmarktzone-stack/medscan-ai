/**
 * Zero-cost stack — relay URL resolution (no paid services required).
 */

export function getRelayUrl() {
  const fromEnv = String(import.meta.env?.VITE_RELAY_URL || import.meta.env?.VITE_WECHAT_RELAY_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env?.DEV) {
    return 'http://127.0.0.1:8765';
  }

  return '';
}

export function isZeroCostMode() {
  return !import.meta.env?.VITE_SUPABASE_URL?.trim();
}

export const ZERO_COST_STACK = {
  frontend: 'GitHub Pages / Cloudflare Pages — $0',
  sync: 'WeiChat Relay (Node or Cloudflare Worker) — $0',
  storage: 'localStorage + relay JSON/KV — $0',
  optional: 'Supabase free tier — $0 up to limits',
};
