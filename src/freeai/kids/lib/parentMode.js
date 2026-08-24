/**
 * Parent mode — PIN gate + settings (local only).
 */

const PARENT_KEY = "freeai_kids_parent_v1";

function read() {
  if (typeof window === "undefined") return { pinHash: null, sessionUntil: 0 };
  try {
    return JSON.parse(localStorage.getItem(PARENT_KEY) || "null") ?? { pinHash: null, sessionUntil: 0 };
  } catch {
    return { pinHash: null, sessionUntil: 0 };
  }
}

function write(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PARENT_KEY, JSON.stringify(data));
}

function hashPin(pin) {
  return btoa(String(pin)).split("").reverse().join("");
}

export function hasParentPin() {
  return !!read().pinHash;
}

export function setParentPin(pin) {
  if (!/^\d{4,6}$/.test(String(pin))) return false;
  write({ ...read(), pinHash: hashPin(pin), sessionUntil: 0 });
  return true;
}

export function verifyParentPin(pin) {
  const p = read();
  if (!p.pinHash) {
    setParentPin(pin);
    return unlockParentSession();
  }
  if (hashPin(pin) !== p.pinHash) return false;
  return unlockParentSession();
}

function unlockParentSession() {
  const until = Date.now() + 30 * 60 * 1000;
  write({ ...read(), sessionUntil: until });
  return true;
}

export function isParentUnlocked() {
  return read().sessionUntil > Date.now();
}

export function lockParentSession() {
  write({ ...read(), sessionUntil: 0 });
}
