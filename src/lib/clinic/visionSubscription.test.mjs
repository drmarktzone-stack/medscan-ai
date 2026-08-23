/**
 * Vision subscription state — node src/lib/clinic/visionSubscription.test.mjs
 */
import {
  grantVisionAccess,
  hasVisionAccess,
  setVisionPending,
  isVisionPendingVerification,
  getVisionSubscriptionState,
  revokeVisionAccess,
  visionAccessDaysRemaining,
} from "./visionSubscription.js";

function memoryStore(seed = {}) {
  const data = { ...seed };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data,
  };
}

let pass = 0;
let fail = 0;
const t = (n, fn) => {
  try {
    fn();
    console.log("  ✓ " + n);
    pass++;
  } catch (e) {
    console.log("  ✗ " + n + "\n      " + e.message);
    fail++;
  }
};
const assert = (c, m) => {
  if (!c) throw new Error(m || "assertion failed");
};

console.log("\nDoctorPedAI — vision subscription\n");

t("pending then grant unlocks access", () => {
  global.localStorage = memoryStore();
  revokeVisionAccess();
  assert(!hasVisionAccess());
  setVisionPending({ amountIls: 49, phone: "0501234567" });
  assert(isVisionPendingVerification());
  grantVisionAccess({ days: 30, source: "test" });
  assert(hasVisionAccess());
  assert(getVisionSubscriptionState().status === "active");
  assert(visionAccessDaysRemaining() >= 29);
});

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
