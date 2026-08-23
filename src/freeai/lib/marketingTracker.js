/**
 * Marketing KPI tracker — localStorage until backend analytics exist.
 */

const STATS_KEY = "freeai_marketing_stats_v1";
const REF_KEY = "freeai_ref_v1";

export const KPI_TARGETS = {
  visits: 500,
  shares: 50,
  signups: 100,
  proInterest: 20,
};

export function captureReferral() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref") || params.get("utm_source");
  if (ref) {
    localStorage.setItem(REF_KEY, ref);
    trackEvent("visit", { ref });
  }
  return ref;
}

export function loadStats() {
  if (typeof window === "undefined") {
    return { visits: 0, shares: 0, signups: 0, proInterest: 0, events: [] };
  }
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
  } catch {
    return { visits: 0, shares: 0, signups: 0, proInterest: 0, events: [] };
  }
}

function saveStats(stats) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
  return stats;
}

export function trackEvent(type, meta = {}) {
  const stats = loadStats();
  stats.events = stats.events || [];
  stats.events.push({ type, at: new Date().toISOString(), ...meta });
  if (stats.events.length > 200) stats.events = stats.events.slice(-200);

  if (type === "visit") stats.visits = (stats.visits || 0) + 1;
  if (type === "share") stats.shares = (stats.shares || 0) + 1;
  if (type === "signup") stats.signups = (stats.signups || 0) + 1;
  if (type === "pro_interest") stats.proInterest = (stats.proInterest || 0) + 1;

  return saveStats(stats);
}

export function getProgress(stats, key) {
  const current = stats[key] || 0;
  const target = KPI_TARGETS[key] || 1;
  return { current, target, pct: Math.min(100, Math.round((current / target) * 100)) };
}

/** Build tracked URL for a channel */
export function trackedUrl(baseUrl, channel) {
  const url = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : "https://drmarktzone.github.io");
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", "outreach");
  url.searchParams.set("ref", channel);
  return url.toString();
}
