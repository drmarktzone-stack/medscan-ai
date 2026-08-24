/**
 * Activity log for parent dashboard.
 */

const LOG_KEY = "freeai_kids_activity_v1";
const MAX = 200;

function read() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, MAX)));
}

export function logActivity(type, meta = {}) {
  const entry = {
    id: `act-${Date.now()}`,
    type,
    meta,
    at: new Date().toISOString(),
  };
  write([entry, ...read()]);
  return entry;
}

export function loadActivityLog(limit = 50) {
  return read().slice(0, limit);
}

export function getActivityStats(days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const logs = read().filter((e) => new Date(e.at).getTime() >= cutoff);
  const byType = {};
  for (const e of logs) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  return { total: logs.length, byType, logs: logs.slice(0, 30) };
}
