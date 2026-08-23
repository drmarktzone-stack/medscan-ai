/**
 * node src/lib/medscan/journey/journeyExtras.test.mjs
 */
import {
  prepItemsForService, prepProgress, togglePrepItem, loadPrepChecks,
} from "./visitPrepChecklists.js";
import {
  addResultsWait, waitWindow, effectiveStatus, inferTestType,
  resultsWaitStats, loadResultsWait, daysSince,
} from "./resultsWaitStore.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

function mem() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

console.log("\nVisit prep + results wait\n");

t("MRI checklist includes contrast + escort", () => {
  const items = prepItemsForService("imaging");
  const ids = items.map((i) => i.id);
  assert(ids.includes("contrast_allergy"));
  assert(ids.includes("adult_escort"));
});

t("critical items gate readiness", () => {
  const items = prepItemsForService("emergency");
  const critical = items.filter((i) => i.critical).map((i) => i.id);
  const prog0 = prepProgress("emergency", []);
  assert(prog0.ready === false);
  const prog1 = prepProgress("emergency", critical);
  assert(prog1.ready === true);
});

t("prep checks persist", () => {
  const store = mem();
  togglePrepItem("lab", "id", store);
  assert(loadPrepChecks(store).lab.includes("id"));
});

t("infer MRI from title", () => {
  assert(inferTestType("MRI מוח") === "imaging_mri");
  assert(inferTestType("בדיקת דם") === "blood_routine");
});

t("overdue when past max days", () => {
  const store = mem();
  const item = addResultsWait({
    title: "דם",
    testType: "blood_routine",
    orderedAt: "2020-01-01",
  }, store);
  assert(effectiveStatus(item) === "overdue");
  const w = waitWindow(item);
  assert(w.overdue === true);
});

t("received skips overdue", () => {
  const item = {
    testType: "blood_routine",
    orderedAt: "2020-01-01",
    status: "received",
  };
  assert(effectiveStatus(item) === "received");
});

t("stats count overdue", () => {
  const store = mem();
  addResultsWait({ title: "x", testType: "blood_routine", orderedAt: "2020-01-01" }, store);
  const s = resultsWaitStats(loadResultsWait(store));
  assert(s.overdue >= 1);
});

t("daysSince non-negative", () => {
  assert(daysSince(new Date().toISOString().slice(0, 10)) === 0);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
