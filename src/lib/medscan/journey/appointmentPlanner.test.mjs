/**
 * node src/lib/medscan/journey/appointmentPlanner.test.mjs
 */
import {
  buildAppointmentPlan,
  planFromFollowUp,
  planFromClinicalResult,
  suggestDateOptions,
  parseAppointmentSearchParams,
} from "./appointmentPlanner.js";
import { buildBookingDestinations, telHref, HMO_BOOKING } from "./appointmentLinks.js";
import { saveCareProfile } from "./careProfile.js";
import { serviceFromFollowUpType } from "./appointmentCatalog.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

function memoryStore() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

console.log("\nAppointment navigation\n");

t("מיפוי follow-up לשירות", () => {
  assert(serviceFromFollowUpType("imaging") === "imaging");
  assert(serviceFromFollowUpType("specialist") === "specialist");
});

t("חירום — מד\"א ומיון לפני קופה", () => {
  const dest = buildBookingDestinations({ hmo: "clalit", serviceId: "emergency", urgency: "emergency" });
  assert(dest.length >= 2);
  assert(dest[0].id === "mda");
  assert(dest.some((d) => d.phone === "101"));
});

t("דחוף — Terem + קופה", () => {
  const dest = buildBookingDestinations({ hmo: "maccabi", serviceId: "pediatrician", urgency: "urgent" });
  assert(dest[0].id === "terem");
  assert(dest.some((d) => d.id === "hmo-maccabi"));
});

t("שגרה — קופה ואז פרטי לפי שירות", () => {
  const dest = buildBookingDestinations({ hmo: "meuhedet", serviceId: "imaging", urgency: "routine" });
  assert(dest[0].id === "hmo-meuhedet");
  assert(dest.some((d) => d.id === "assuta"));
});

t("tel: לטלפון קופה", () => {
  assert(telHref(HMO_BOOKING.clalit.phone) === "tel:*2700");
});

t("תוכנית עם פרופיל — לא ממציא תורים", () => {
  const store = memoryStore();
  const profile = saveCareProfile({ hmo: "clalit", city: "חיפה" }, store);
  const plan = buildAppointmentPlan({
    profile,
    serviceId: "specialist",
    urgency: "routine",
    preferredDates: ["2026-08-25"],
    preferredSlots: ["morning"],
  });
  assert(plan.destinations.length >= 1);
  assert(plan.preferredDates.length === 1);
  assert(!plan.destinations.some((d) => d.slotTime), "must not invent slots");
});

t("תוכנית מ-follow-up", () => {
  const plan = planFromFollowUp({ type: "imaging", title: "MRI", dueDate: "2026-09-01" }, { hmo: "leumit" });
  assert(plan.serviceId === "imaging");
  assert(plan.preferredDates[0] === "2026-09-01");
});

t("תוצאה קlinית דחופה", () => {
  const plan = planFromClinicalResult({ severity: "urgent", serviceId: "pediatrician" });
  assert(plan.urgency === "urgent");
});

t("תאריכים מוצעים — 14 ימים", () => {
  assert(suggestDateOptions(new Date("2026-08-23"), 14).length === 14);
});

t("query params", () => {
  const p = parseAppointmentSearchParams("?service=hearing&urgency=routine&context=ecg");
  assert(p.service === "hearing");
  assert(p.context === "ecg");
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
