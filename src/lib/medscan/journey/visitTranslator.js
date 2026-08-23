/**
 * Translate common doctor/report phrases to plain parent language.
 * Deterministic pattern matching — no LLM. needs_verification on clinical rules.
 */

const RULES_HE = [
  {
    pattern: /מעקב|follow.?up|ביקור חוזר/i,
    means: "life.visit_followup",
    do: "life.do_followup",
    worry: "life.worry_followup",
  },
  {
    pattern: /מנוחה|rest|שכיבה/i,
    means: "life.visit_rest",
    do: "life.do_rest",
    worry: "life.worry_rest",
  },
  {
    pattern: /נוזלים|שתייה|hydration|מים/i,
    means: "life.visit_fluids",
    do: "life.do_fluids",
    worry: "life.worry_fluids",
  },
  {
    pattern: /אנטיביוט|antibiotic|abx/i,
    means: "life.visit_antibiotic",
    do: "life.do_antibiotic",
    worry: "life.worry_antibiotic",
  },
  {
    pattern: /חום|fever|pyrex/i,
    means: "life.visit_fever",
    do: "life.do_fever",
    worry: "life.worry_fever",
  },
  {
    pattern: /מיון|emergency|ER|חדר מיון/i,
    means: "life.visit_er",
    do: "life.do_er",
    worry: "life.worry_er",
  },
  {
    pattern: /הפניה|referral|מומחה/i,
    means: "life.visit_referral",
    do: "life.do_referral",
    worry: "life.worry_referral",
  },
  {
    pattern: /בדיק(?:ה|ות)|lab|מעבדה/i,
    means: "life.visit_labs",
    do: "life.do_labs",
    worry: "life.worry_labs",
  },
  {
    pattern: /צילום|x.?ray|רנטgen|הדמי|MRI|CT|אולטרה/i,
    means: "life.visit_imaging",
    do: "life.do_imaging",
    worry: "life.worry_imaging",
  },
  {
    pattern: /אשפוז|hospital|אסותא|בית חולים/i,
    means: "life.visit_admit",
    do: "life.do_admit",
    worry: "life.worry_admit",
  },
  {
    pattern: /viral|viral|ויראל|עובר מעצמו/i,
    means: "life.visit_viral",
    do: "life.do_viral",
    worry: "life.worry_viral",
  },
  {
    pattern: /אין מניעה|בסדר|תקין|normal|unremarkable/i,
    means: "life.visit_reassuring",
    do: "life.do_reassuring",
    worry: "life.worry_reassuring",
  },
];

export function translateVisitNotes(rawText, { t = (k) => k } = {}) {
  const text = String(rawText || "").trim();
  if (!text) {
    return { ok: false, reason: "empty" };
  }

  const matched = [];
  for (const rule of RULES_HE) {
    if (rule.pattern.test(text)) {
      matched.push({
        pattern: rule.pattern.source,
        means: t(rule.means),
        doTonight: t(rule.do),
        worryIf: t(rule.worry),
      });
    }
  }

  const summary = matched.length
    ? t("life.visit_summary_found", { n: matched.length })
    : t("life.visit_summary_none");

  return {
    ok: true,
    inputLength: text.length,
    matched,
    summary,
    disclaimer: t("life.visit_disclaimer"),
    /** One-screen parent view */
    plain: {
      headline: matched.length ? matched[0].means : t("life.visit_headline_generic"),
      actions: [...new Set(matched.map((m) => m.doTonight))].slice(0, 5),
      warnings: [...new Set(matched.map((m) => m.worryIf))].slice(0, 5),
    },
  };
}

export const VISIT_NOTES_KEY = "medscan_visit_notes_v1";

export function saveVisitNote(entry, storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  const list = loadVisitNotes(storage);
  const item = {
    id: `vn-${Date.now()}`,
    text: String(entry.text || "").slice(0, 2000),
    createdAt: new Date().toISOString(),
    translation: entry.translation || null,
  };
  list.unshift(item);
  const trimmed = list.slice(0, 20);
  if (store) store.setItem(VISIT_NOTES_KEY, JSON.stringify(trimmed));
  return item;
}

export function loadVisitNotes(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return [];
  try {
    const raw = store.getItem(VISIT_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
