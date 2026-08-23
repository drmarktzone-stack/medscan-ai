/**
 * Payment config — phone normalization (no secrets in repo).
 * node src/lib/clinic/paymentConfig.test.mjs
 */
import {
  normalizeIsraeliMobile,
  formatIsraeliMobile,
} from "./paymentConfig.js";

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
const assertEq = (a, b, m) => {
  if (a !== b) throw new Error(m || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
};

console.log("\nDoctorPedAI — payment config\n");

t("normalizeIsraeliMobile — 10 digits with leading 0", () => {
  assertEq(normalizeIsraeliMobile("0501234567"), "0501234567");
});

t("normalizeIsraeliMobile — strips formatting", () => {
  assertEq(normalizeIsraeliMobile("050-123-4567"), "0501234567");
});

t("normalizeIsraeliMobile — 972 prefix", () => {
  assertEq(normalizeIsraeliMobile("972501234567"), "0501234567");
});

t("normalizeIsraeliMobile — 9 digits starting with 5", () => {
  assertEq(normalizeIsraeliMobile("501234567"), "0501234567");
});

t("normalizeIsraeliMobile — empty", () => {
  assertEq(normalizeIsraeliMobile(""), null);
  assertEq(normalizeIsraeliMobile(null), null);
});

t("formatIsraeliMobile — display", () => {
  assertEq(formatIsraeliMobile("0501234567"), "050-123-4567");
});

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
