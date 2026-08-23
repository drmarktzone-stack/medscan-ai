/**
 * FreeAI Hub — local credit tracking per provider.
 * Persists to localStorage; resets tracked by resetPeriod metadata.
 */

import { FREE_AI_PROVIDERS, getProvider } from "../data/providers.js";

const STORAGE_KEY = "freeai_credits_v1";
const KEYS_STORAGE = "freeai_api_keys_v1";
const PROJECTS_KEY = "freeai_projects_v1";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

/** @returns {Record<string, { remaining: number; lastReset: string; enabled: boolean }>} */
export function loadCreditState() {
  const stored = readJson(STORAGE_KEY, {});
  const state = {};

  for (const p of FREE_AI_PROVIDERS) {
    const s = stored[p.id];
    if (s && !needsReset(s.lastReset, p.resetPeriod)) {
      state[p.id] = { ...s, enabled: s.enabled !== false };
    } else {
      state[p.id] = {
        remaining: p.defaultCredits,
        lastReset: new Date().toISOString(),
        enabled: s?.enabled !== false,
      };
    }
  }
  return state;
}

function needsReset(lastReset, period) {
  if (period === "unlimited" || period === "one_time") return false;
  const last = new Date(lastReset);
  const now = new Date();
  if (period === "daily") {
    return last.toDateString() !== now.toDateString();
  }
  if (period === "monthly") {
    return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
  }
  return false;
}

export function saveCreditState(state) {
  writeJson(STORAGE_KEY, state);
}

export function getRemainingCredits(providerId) {
  const state = loadCreditState();
  return state[providerId]?.remaining ?? 0;
}

export function useCredits(providerId, amount = 1) {
  const state = loadCreditState();
  const p = getProvider(providerId);
  if (!p || !state[providerId]) return { ok: false, reason: "unknown_provider" };

  const cost = (p.costPerUnit ?? 1) * amount;
  if (state[providerId].remaining < cost) {
    return { ok: false, reason: "insufficient_credits", remaining: state[providerId].remaining };
  }

  state[providerId].remaining -= cost;
  saveCreditState(state);
  return { ok: true, remaining: state[providerId].remaining, used: cost };
}

export function setCredits(providerId, remaining) {
  const state = loadCreditState();
  if (!state[providerId]) return;
  state[providerId].remaining = Math.max(0, Number(remaining) || 0);
  saveCreditState(state);
}

export function toggleProvider(providerId, enabled) {
  const state = loadCreditState();
  if (!state[providerId]) return;
  state[providerId].enabled = enabled;
  saveCreditState(state);
}

export function resetProviderCredits(providerId) {
  const p = getProvider(providerId);
  if (!p) return;
  const state = loadCreditState();
  state[providerId] = {
    remaining: p.defaultCredits,
    lastReset: new Date().toISOString(),
    enabled: state[providerId]?.enabled !== false,
  };
  saveCreditState(state);
}

export function totalAvailableCredits(capability = null) {
  const state = loadCreditState();
  let total = 0;
  for (const p of FREE_AI_PROVIDERS) {
    if (capability && !p.capabilities.includes(capability)) continue;
    if (state[p.id]?.enabled === false) continue;
    total += state[p.id]?.remaining ?? 0;
  }
  return total;
}

/** API keys stored locally — never sent to our servers */
export function loadApiKeys() {
  return readJson(KEYS_STORAGE, {});
}

export function saveApiKey(providerId, key) {
  const keys = loadApiKeys();
  if (key) keys[providerId] = key;
  else delete keys[providerId];
  writeJson(KEYS_STORAGE, keys);
}

/** @typedef {{ id: string; name: string; tasks: object[]; createdAt: string; status: string }} Project */

export function loadProjects() {
  return readJson(PROJECTS_KEY, []);
}

export function saveProject(project) {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) projects[idx] = project;
  else projects.unshift(project);
  writeJson(PROJECTS_KEY, projects.slice(0, 20));
  return project;
}

export function deleteProject(id) {
  const projects = loadProjects().filter((p) => p.id !== id);
  writeJson(PROJECTS_KEY, projects);
}
