/**
 * Marketing share URLs — node src/lib/clinic/marketingConfig.test.mjs
 */
import {
  buildShareMessages,
  whatsAppShareUrl,
  marketingPath,
} from "./marketingConfig.js";

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

console.log("\nDoctorPedAI — marketing config\n");

t("buildShareMessages — Hebrew clinician includes start path", () => {
  const m = buildShareMessages("he");
  assert(m.clinician.includes("/start"));
  assert(m.parent.includes("/parent"));
  assert(m.upgrade.includes("/checkout"));
});

t("whatsAppShareUrl — encodes text", () => {
  const url = whatsAppShareUrl("hello world");
  assert(url.startsWith("https://wa.me/?text="));
  assert(url.includes("hello%20world"));
});

t("marketingPath — respects base", () => {
  assert(marketingPath("/start").endsWith("/start"));
});

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exit(1);
