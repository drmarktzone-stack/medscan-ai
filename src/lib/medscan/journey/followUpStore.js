/**
 * Post-visit follow-up tracker — localStorage on this device.
 */

export const FOLLOWUP_KEY = 'medscan_followup_v1';

export const FOLLOWUP_TYPES = Object.freeze([
  { id: 'results', labelKey: 'journey.follow_type_results' },
  { id: 'specialist', labelKey: 'journey.follow_type_specialist' },
  { id: 'hitchayvut', labelKey: 'journey.follow_type_hitchayvut' },
  { id: 'referral', labelKey: 'journey.follow_type_referral' },
  { id: 'imaging', labelKey: 'journey.follow_type_imaging' },
  { id: 'other', labelKey: 'journey.follow_type_other' },
]);

export const FOLLOWUP_STATUS = Object.freeze(['pending', 'done', 'stuck']);

function clip(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

export function emptyFollowUpItem(overrides = {}) {
  return {
    id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: 'results',
    title: '',
    notes: '',
    dueDate: '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function loadFollowUps(storage) {
  const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(FOLLOWUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFollowUps(items, storage) {
  const store = storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
  const next = (items || []).map((item) => ({
    ...emptyFollowUpItem(),
    ...item,
    title: clip(item.title, 120),
    notes: clip(item.notes, 500),
    status: FOLLOWUP_STATUS.includes(item.status) ? item.status : 'pending',
  }));
  if (store) store.setItem(FOLLOWUP_KEY, JSON.stringify(next));
  return next;
}

export function addFollowUp(partial, storage) {
  const items = loadFollowUps(storage);
  const item = emptyFollowUpItem(partial);
  items.unshift(item);
  saveFollowUps(items, storage);
  return item;
}

export function updateFollowUp(id, patch, storage) {
  const items = loadFollowUps(storage).map((item) =>
    item.id === id ? { ...item, ...patch, id: item.id } : item,
  );
  return saveFollowUps(items, storage);
}

export function removeFollowUp(id, storage) {
  return saveFollowUps(loadFollowUps(storage).filter((item) => item.id !== id), storage);
}

export function followUpStats(items) {
  const list = items || [];
  return {
    total: list.length,
    pending: list.filter((i) => i.status === 'pending').length,
    done: list.filter((i) => i.status === 'done').length,
    stuck: list.filter((i) => i.status === 'stuck').length,
  };
}
