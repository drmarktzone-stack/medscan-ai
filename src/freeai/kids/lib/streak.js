/**
 * Daily streak tracking for Kids.
 */

const STREAK_KEY = "freeai_kids_streak_v1";

function read() {
  if (typeof window === "undefined") return { count: 0, lastDate: "", history: [] };
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "null") ?? { count: 0, lastDate: "", history: [] };
  } catch {
    return { count: 0, lastDate: "", history: [] };
  }
}

function write(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Mark daily lesson (or any daily activity) complete */
export function completeDailyActivity() {
  const today = todayKey();
  const s = read();
  if (s.lastDate === today) return s;

  let count = s.count || 0;
  if (s.lastDate === yesterdayKey()) count += 1;
  else if (s.lastDate !== today) count = 1;

  const history = [...(s.history || []), today].slice(-60);
  const next = { count, lastDate: today, history };
  write(next);
  return next;
}

export function loadStreak() {
  const s = read();
  const today = todayKey();
  if (s.lastDate && s.lastDate !== today && s.lastDate !== yesterdayKey()) {
    return { ...s, count: 0, broken: true };
  }
  return { ...s, broken: false };
}

export function isTodayComplete() {
  return read().lastDate === todayKey();
}
