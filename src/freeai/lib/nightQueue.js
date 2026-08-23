/**
 * Night queue — schedule generations for when credits reset.
 */

const QUEUE_KEY = "freeai_night_queue_v1";

export function loadQueue() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToQueue(task) {
  const queue = loadQueue();
  queue.push({
    id: `q-${Date.now()}`,
    ...task,
    scheduledFor: getNextReset(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  }
  return queue;
}

export function processQueue() {
  const queue = loadQueue();
  const now = new Date();
  const ready = queue.filter((t) => t.status === "pending" && new Date(t.scheduledFor) <= now);
  const pending = queue.filter((t) => t.status === "pending" && new Date(t.scheduledFor) > now);
  return { ready, pending, total: queue.length };
}

export function markQueueDone(id) {
  const queue = loadQueue().map((t) => t.id === id ? { ...t, status: "done" } : t);
  if (typeof window !== "undefined") {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

function getNextReset() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 1, 0, 0);
  return tomorrow.toISOString();
}

export function getNextResetLabel(locale = "he") {
  const next = getNextReset();
  const d = new Date(next);
  if (locale === "he") {
    return `הלילה ב-${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `Tonight at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}
