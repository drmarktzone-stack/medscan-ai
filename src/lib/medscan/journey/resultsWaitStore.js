/**
 * Track pending lab/imaging results — expected wait windows, overdue alerts.
 * needs_verification — SLAs vary by lab and season.
 */

export const RESULTS_WAIT_KEY = "medscan_results_wait_v1";

export const RESULT_TEST_TYPES = Object.freeze([
  { id: "blood_routine", labelKey: "wait.type_blood_routine", daysMin: 1, daysMax: 3 },
  { id: "blood_special", labelKey: "wait.type_blood_special", daysMin: 3, daysMax: 14 },
  { id: "urine", labelKey: "wait.type_urine", daysMin: 1, daysMax: 5 },
  { id: "culture", labelKey: "wait.type_culture", daysMin: 2, daysMax: 7 },
  { id: "stool", labelKey: "wait.type_stool", daysMin: 3, daysMax: 10 },
  { id: "imaging_xray", labelKey: "wait.type_xray", daysMin: 0, daysMax: 3 },
  { id: "imaging_us", labelKey: "wait.type_us", daysMin: 0, daysMax: 5 },
  { id: "imaging_ct", labelKey: "wait.type_ct", daysMin: 1, daysMax: 7 },
  { id: "imaging_mri", labelKey: "wait.type_mri", daysMin: 3, daysMax: 14 },
  { id: "pathology", labelKey: "wait.type_pathology", daysMin: 7, daysMax: 21 },
  { id: "hearing", labelKey: "wait.type_hearing", daysMin: 3, daysMax: 14 },
  { id: "genetics", labelKey: "wait.type_genetics", daysMin: 14, daysMax: 90 },
  { id: "other", labelKey: "wait.type_other", daysMin: 3, daysMax: 14 },
]);

export const WAIT_STATUS = Object.freeze(["waiting", "received", "overdue"]);

function clip(v, max = 120) {
  return String(v || "").trim().slice(0, max);
}

export function testTypeMeta(typeId) {
  return RESULT_TEST_TYPES.find((t) => t.id === typeId) || RESULT_TEST_TYPES.find((t) => t.id === "other");
}

export function emptyWaitItem(overrides = {}) {
  const type = testTypeMeta(overrides.testType || "blood_routine");
  const orderedAt = overrides.orderedAt || new Date().toISOString().slice(0, 10);
  return {
    id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    testType: type.id,
    orderedAt,
    labName: "",
    status: "waiting",
    notes: "",
    createdAt: new Date().toISOString(),
    ...overrides,
    title: clip(overrides.title, 120),
    labName: clip(overrides.labName, 80),
  };
}

export function daysSince(isoDate) {
  if (!isoDate) return 0;
  const a = new Date(isoDate);
  const b = new Date();
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.max(0, Math.floor((b - a) / 86400000));
}

export function waitWindow(item) {
  const meta = testTypeMeta(item?.testType);
  const elapsed = daysSince(item?.orderedAt);
  return {
    elapsed,
    daysMin: meta.daysMin,
    daysMax: meta.daysMax,
    inWindow: elapsed >= meta.daysMin && elapsed <= meta.daysMax,
    overdue: item?.status === "waiting" && elapsed > meta.daysMax,
    early: elapsed < meta.daysMin,
  };
}

export function effectiveStatus(item) {
  if (item?.status === "received") return "received";
  const w = waitWindow(item);
  return w.overdue ? "overdue" : "waiting";
}

export function loadResultsWait(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(RESULTS_WAIT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveResultsWait(items, storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  const next = (items || []).map((item) => ({
    ...emptyWaitItem(),
    ...item,
    status: ["waiting", "received", "overdue"].includes(item.status) ? item.status : "waiting",
  }));
  if (store) store.setItem(RESULTS_WAIT_KEY, JSON.stringify(next));
  return next;
}

export function addResultsWait(partial, storage) {
  const items = loadResultsWait(storage);
  const item = emptyWaitItem(partial);
  items.unshift(item);
  saveResultsWait(items, storage);
  return item;
}

export function updateResultsWait(id, patch, storage) {
  const items = loadResultsWait(storage).map((item) =>
    item.id === id ? { ...item, ...patch, id: item.id } : item,
  );
  return saveResultsWait(items, storage);
}

export function removeResultsWait(id, storage) {
  return saveResultsWait(loadResultsWait(storage).filter((i) => i.id !== id), storage);
}

export function resultsWaitStats(items) {
  const list = items || [];
  const enriched = list.map((i) => ({ ...i, computed: effectiveStatus(i) }));
  return {
    total: list.length,
    waiting: enriched.filter((i) => i.computed === "waiting").length,
    overdue: enriched.filter((i) => i.computed === "overdue").length,
    received: enriched.filter((i) => i.computed === "received").length,
  };
}

/** Suggest test type from free-text title. */
export function inferTestType(title) {
  const s = String(title || "").toLowerCase();
  if (/mri|אמ\"?ר|מ\.?ר\.?י|מגנט/i.test(s)) return "imaging_mri";
  if (/\bct\b|ט\.?א\.?|computed tomography/i.test(s)) return "imaging_ct";
  if (/x.?ray|rentgen|רנטgen|צילום/i.test(s)) return "imaging_xray";
  if (/ultrasound|אולטרה|\bus\b/i.test(s)) return "imaging_us";
  if (/שתן|urine/i.test(s)) return "urine";
  if (/תרבית|culture/i.test(s)) return "culture";
  if (/צואה|stool/i.test(s)) return "stool";
  if (/שמיע|hearing|audi/i.test(s)) return "hearing";
  if (/genetic|גנט/i.test(s)) return "genetics";
  if (/biops|פתולוג|pathol/i.test(s)) return "pathology";
  if (/blood|דם|cbc|כימיה|מעבדה/i.test(s)) return "blood_routine";
  return "other";
}
