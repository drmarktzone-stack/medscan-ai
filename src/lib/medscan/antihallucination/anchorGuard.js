/**
 * MedScan — Anchor & Entity Guard
 * חיזוק מנגנון 1 (Grounding) ומנגנון 5 (Source Attribution)
 *
 * שני חורים שנותרו פתוחים אחרי `validators.js`, ושניהם מייצרים בדיוק
 * את סוג ההזיה המסוכן ביותר — כזו שנשמעת סמכותית:
 *
 * 1. **עוגן מומצא.** בדקנו ש-F# קיים, אך לא ש-`source_anchor` מצביע
 *    לנושא שקיים באמת. מודל שכותב `nelson.id.kawasaki` על נושא שלא
 *    יובא מייצר ציטוט מזויף — והציטוט הוא בדיוק מה שגורם לרופא/ה
 *    להאמין לטענה בלי לבדוק.
 *
 * 2. **ישות מומצאת.** שם תרופה, שם חיידק, שם קריטריון או שם סקאלה
 *    שאינו במקור. "לפי קריטריוני X" נשמע מבוסס לחלוטין גם כשקריטריוני X
 *    אינם קיימים או אינם רלוונטיים. numericGuard תופס מספרים; הוא אינו
 *    תופס שמות.
 */

import { collectProseStrings } from './numericGuard.js';

/* ═══════════════════════════════════════════════════════════════════════
 * 1. עוגנים — כל source_anchor חייב להיפתר לפריט שקיים
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * @param {object} output
 * @param {object} factBlock  תוצר buildFactBlock() — factBlock.anchors הוא הקבוצה המותרת
 * @param {Set<string>|string[]} [knownTopicKeys] topic_key מלא מ-KnowledgeTopic (אופציונלי, מרחיב)
 */
export function validateAnchors(output, factBlock, knownTopicKeys = null) {
  const allowed = new Set(factBlock?.anchors ?? []);
  // נושאים מוכרים מה-KB מותרים גם אם לא נכנסו ל-FACT BLOCK בריצה הזו,
  // אך רק אם הועברו במפורש. ברירת המחדל היא הקבוצה הסגורה — מחמירה יותר.
  if (knownTopicKeys) for (const k of knownTopicKeys) allowed.add(k);

  const violations = [];

  const check = (anchors, where) => {
    for (const a of anchors ?? []) {
      if (!a) continue;
      if (allowed.has(a)) continue;
      violations.push({
        code: 'fabricated_anchor',
        severity: 'block',
        anchor: a,
        path: where,
        message_he:
          `הפלט מייחס טענה למקור "${a}" ב-${where}, אך עוגן זה אינו קיים ` +
          `ב-Knowledge Base ולא סופק בהקשר. ציטוט מקור שאינו קיים מסוכן ` +
          `יותר מהיעדר ציטוט, כי הוא מונע בדיקה.`,
      });
    }
  };

  for (const c of output?.claims ?? []) check(c.source_anchors, `claims.${c.claim_id}`);
  for (const d of output?.directions ?? []) check(d.source_anchors, `directions.${d.direction_id}`);
  for (const d of output?.differential ?? []) check(d.source_anchors, `differential.${d.direction_id}`);
  for (const t of output?.recommended_tests ?? []) check([t.source_anchor], 'recommended_tests');
  for (const p of output?.patterns_detected ?? []) check([p.source_anchor], 'patterns_detected');
  for (const f of output?.red_flags ?? []) {
    // דגל שהמודל הציע כבר מסומן בנפרד; לא כופלים עליו הפרה
    if (f.unverified_model_flag) continue;
    check([f.source_anchor], 'red_flags');
  }
  check([output?.source_anchor], 'root');

  return violations;
}

/* ═══════════════════════════════════════════════════════════════════════
 * 2. ישויות — שמות שלא הופיעו במקור
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * מונחי מערכת ומונחים גנריים שמותרים תמיד.
 * שמור בכוונה קצר — כל תוספת כאן היא הרחבה של משטח-ההזיה.
 */
const ALLOWED_TERMS = new Set([
  'medscan', 'nelson', 'json', 'llm',
]);

/**
 * הקשרים שהופכים ישות מומצאת מאזהרה לחסימה.
 * שם שמופיע בהקשר של מתן טיפול או קריטריון אבחוני הוא הסיכון האמיתי.
 */
const CRITICAL_ENTITY_CONTEXT = [
  /לפי\s+קריטריוני/, /קריטריוני\s+/, /criteria/i,
  /סקאלת|סקור|score\b/i, /לפי\s+מדד/,
  /טיפול\s+ב|לשקול\s+מתן|אנטיביוטיק|antibiotic/i,
  /תרופ|drug|medication/i,
  /לפי\s+הנחיות|guideline/i,
];

/**
 * מחלץ אסימוני-שם בכתב לטיני. שמות תרופות, חיידקים, קריטריונים
 * וסקאלות נכתבים כמעט תמיד בלטינית גם בתוך טקסט עברי — וזה מה
 * שהופך את הבדיקה הזו לישימה למרות שהפלט עברי.
 */
function extractLatinTerms(text) {
  const out = [];
  const re = /[A-Za-z][A-Za-z'-]{3,}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ term: m[0], index: m.index });
  }
  return out;
}

function buildAllowedTermSet(factBlock, extraTerms = []) {
  const allowed = new Set(ALLOWED_TERMS);

  const harvest = (text) => {
    for (const { term } of extractLatinTerms(String(text ?? ''))) {
      allowed.add(term.toLowerCase());
    }
  };

  for (const f of factBlock?.facts ?? []) {
    harvest(f.text);
    if (f.source_anchor) harvest(f.source_anchor);
    if (f.entity_key) harvest(f.entity_key);
  }
  for (const t of extraTerms) harvest(t);

  return allowed;
}

/**
 * @param {object} output
 * @param {object} factBlock
 * @param {object} [opts]
 * @param {string[]} [opts.extraTerms] מונחים נוספים מותרים — למשל שמות
 *        תרופות מ-DoseRecord מאומתות שסופקו לריצה
 */
export function entityGuard(output, factBlock, opts = {}) {
  const allowed = buildAllowedTermSet(factBlock, opts.extraTerms ?? []);
  const violations = [];
  const seen = new Set();

  for (const { path, text } of collectProseStrings(output)) {
    for (const { term, index } of extractLatinTerms(text)) {
      const key = term.toLowerCase();
      if (allowed.has(key)) continue;

      const dedupeKey = `${key}|${path}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const start = Math.max(0, index - 40);
      const context = text.slice(start, Math.min(text.length, index + term.length + 40));
      const critical = CRITICAL_ENTITY_CONTEXT.some((re) => re.test(context));

      violations.push({
        code: 'unsourced_entity',
        severity: critical ? 'block' : 'warn_high',
        term,
        path,
        context: context.trim(),
        message_he:
          `השם "${term}" מופיע בפלט אך אינו מופיע באף מקור שסופק. ` +
          (critical
            ? 'ההקשר הוא טיפולי/אבחוני — שם מומצא בהקשר זה נשמע מבוסס ולכן מסוכן במיוחד.'
            : 'ייתכן שזהו מונח לגיטימי, אך הוא אינו מעוגן.'),
      });
    }
  }

  const blocked = violations.filter((v) => v.severity === 'block');
  return { ok: blocked.length === 0, violations, blocked };
}

/** הרצה משולבת. */
export function runAnchorGuards({ output, factBlock, knownTopicKeys = null, extraTerms = [] }) {
  const anchorViolations = validateAnchors(output, factBlock, knownTopicKeys);
  const entity = entityGuard(output, factBlock, { extraTerms });

  const violations = [...anchorViolations, ...entity.violations];
  return {
    violations,
    blocking: violations.filter((v) => v.severity === 'block'),
    ok: !violations.some((v) => v.severity === 'block'),
  };
}
