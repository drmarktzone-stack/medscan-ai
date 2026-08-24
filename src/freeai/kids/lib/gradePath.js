/**
 * Grade learning path — weekly pack per grade.
 */

import { SUBJECTS } from "../data/curriculum.js";
import { pickL } from "./locale.js";

const PACKS = {
  1: ["hebrew", "math", "art"],
  2: ["hebrew", "math", "science"],
  3: ["hebrew", "math", "english"],
  4: ["math", "english", "science"],
  5: ["math", "english", "science", "computers"],
  6: ["math", "english", "science", "history"],
  7: ["math", "english", "science", "geography"],
  8: ["math", "english", "science", "civics"],
  9: ["math", "english", "science", "history"],
  10: ["math", "english", "science", "computers"],
  11: ["math", "english", "science", "history"],
  12: ["math", "english", "science", "civics"],
};

export function getWeeklyPath(grade, lang) {
  const g = String(grade || "5");
  const ids = PACKS[g] || PACKS[5];
  return ids.map((id, i) => {
    const sub = SUBJECTS.find((s) => s.id === id);
    return {
      week: i + 1,
      id,
      label: sub ? pickL(sub.name, lang) : id,
      icon: sub?.icon || "📚",
      done: false,
    };
  });
}
