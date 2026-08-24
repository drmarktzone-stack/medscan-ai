/**
 * Lab XP, streak & completion — keeps kids coming back.
 */

const KEY = "freeai_kids_lab_progress_v1";

function read() {
  if (typeof window === "undefined") {
    return { xp: 0, completed: {}, streak: 0, lastDay: null, combos: 0 };
  }
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null") ?? {
      xp: 0, completed: {}, streak: 0, lastDay: null, combos: 0,
    };
  } catch {
    return { xp: 0, completed: {}, streak: 0, lastDay: null, combos: 0 };
  }
}

function write(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function loadLabProgress() {
  return read();
}

export function getLabLevel(xp) {
  const level = Math.floor((xp || 0) / 50) + 1;
  const into = (xp || 0) % 50;
  return { level, into, next: 50 - into, xp: xp || 0 };
}

/** Mark experiment complete & award XP. Returns celebration payload. */
export function completeExperiment(categoryId, experimentId, xp = 15) {
  const data = read();
  const key = `${categoryId}:${experimentId}`;
  const firstTime = !data.completed[key];

  if (firstTime) {
    data.xp = (data.xp || 0) + xp;
    data.completed[key] = { at: new Date().toISOString(), xp };
    data.combos = (data.combos || 0) + 1;
  }

  const today = todayStr();
  if (data.lastDay !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    data.streak = data.lastDay === yStr ? (data.streak || 0) + 1 : 1;
    data.lastDay = today;
  }

  write(data);
  const lvl = getLabLevel(data.xp);

  return {
    firstTime,
    xp: firstTime ? xp : 0,
    totalXp: data.xp,
    level: lvl.level,
    levelUp: firstTime && lvl.into === 0 && lvl.level > 1,
    combo: data.combos,
    streak: data.streak,
  };
}

export function completedCount() {
  return Object.keys(read().completed || {}).length;
}

export function isExperimentDone(categoryId, experimentId) {
  return !!read().completed?.[`${categoryId}:${experimentId}`];
}
