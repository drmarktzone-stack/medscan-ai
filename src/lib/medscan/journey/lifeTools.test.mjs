/**
 * node src/lib/medscan/journey/lifeTools.test.mjs
 */
import {
  buildEmergencyScript, saveEmergencyProfile, emergencyProfileReady,
} from "./emergencyProfile.js";
import { translateVisitNotes } from "./visitTranslator.js";
import { evaluateDaycareReturn, ganMessageForGanenet } from "./daycareReturn.js";

const t = (k, p) => {
  let s = k;
  if (p) Object.entries(p).forEach(([a, b]) => { s = s.replace(`{${a}}`, b); });
  return s;
};

let pass = 0, fail = 0;
const test = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "fail"); };

console.log("\nLife tools\n");

test("Emergency script includes child name and 101 content", () => {
  const p = saveEmergencyProfile({ childName: "יונatan", weightKg: "12", allergies: "penicillin" }, null);
  const s = buildEmergencyScript({ profile: p, currentSituation: "חום 40", lang: "he" });
  assert(s.script.includes("יונatan"));
  assert(s.script.includes("penicillin"));
  assert(s.phone101 === "101");
  assert(emergencyProfileReady(p));
});

test("Visit translator finds antibiotic + fever", () => {
  const r = translateVisitNotes("מנוחה, אנטיביוטיקה 5 ימים, חום — נפרמול", { t });
  assert(r.ok);
  assert(r.matched.length >= 2);
  assert(r.plain.actions.length >= 1);
});

test("Daycare — lethargy blocks gan", () => {
  const r = evaluateDaycareReturn({ ageYears: 3, lethargic: true });
  assert(r.verdict === "stay_home");
  assert(r.red.includes("gan.red_lethargy"));
});

test("Daycare — fever free 24h likely ok", () => {
  const r = evaluateDaycareReturn({ ageYears: 4, feverFree24h: true });
  assert(r.verdict === "likely_ok");
});

test("Gan message template", () => {
  const r = evaluateDaycareReturn({ ageYears: 5, feverFree24h: true });
  const msg = ganMessageForGanenet(r, "דני", (k, p) => {
    if (k === "gan.message_template") return `שלום, ${p.name} — ${p.status}.`;
    if (k === "gan.note_ok") return "אפשר לגן";
    return k;
  });
  assert(msg.includes("דני"));
  assert(msg.includes("אפשר"));
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
