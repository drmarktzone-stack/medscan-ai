/**
 * node src/lib/medscan/knowledge/localNelsonSubset.test.mjs
 */
import { readFileSync } from "node:fs";
import { extractionFileToChapter, chaptersFromExtractions } from "./localNelsonSubset.js";

let pass = 0, fail = 0;
const t = (n, fn) => { try { fn(); console.log("  ✓ " + n); pass++; } catch (e) { console.log("  ✗ " + n + "\n      " + e.message); fail++; } };
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

console.log("\nNelson subset — local book door\n");

t("קובץ חילוץ הופך לפרק עם נושא וציטוט, בלי להמציא פרק", () => {
  const raw = JSON.parse(readFileSync("scripts/extractions/nelson22/c220-fever-no-focus.json", "utf8"));
  const ch = extractionFileToChapter(raw, 0);
  assert(ch.chapter_no === 220, "מספר פרק");
  assert(ch.topics.length >= 1, "יש נושא");
  assert(ch.topics[0].k.includes("c220"), "מפתח עוגן נשמר");
  assert(JSON.stringify(ch).includes("38"), "ציטוט החום מהמקור נשמר");
  assert(ch.local_subset === true);
});

t("שני קבצים לאותו פרק מתמזגים", () => {
  const merged = chaptersFromExtractions([
    { chapter_title_he: "זיהום", topics: [{ topic_key: "n.c1.a", topic_title_he: "א", chapter_number: 1, summary_he: "א" }] },
    { chapter_title_he: "זיהום", topics: [{ topic_key: "n.c1.b", topic_title_he: "ב", chapter_number: 1, summary_he: "ב" }] },
  ]);
  assert(merged.length === 1, "פרק אחד");
  assert(merged[0].topics.length === 2, "שני נושאים");
});

t("קובץ בלי נושאים לא נכנס לספר", () => {
  const ch = extractionFileToChapter({ chapter_title_he: "ריק", topics: [] }, 3);
  assert(ch.topics.length === 0);
  assert(chaptersFromExtractions([{ chapter_title_he: "ריק", topics: [] }]).length === 0);
});

console.log(`\n  ${pass} עברו, ${fail} נכשלו\n`);
if (fail) process.exit(1);
