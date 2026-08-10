// עוזר קיצוץ — שומר על פרומפטים רזים כדי שהפענוח יהיה מהיר.
// קיצור טקסט אינו פוגע בדיוק: שלב ההתאמה צריך מזהים ומאפיינים, לא חיבורים שלמים.
function trunc(s, n) {
  const t = String(s ?? "").trim();
  return t.length > n ? t.slice(0, n).trimEnd() + "…" : t;
}

export function buildKnowledgeBaseText(cases) {
  if (!cases || cases.length === 0) {
    return "אין מידע זמין במאגר הידע כרגע.";
  }

  return cases.map((c, i) => {
    let entry = `### ${i + 1}. ${c.title}\n`;
    entry += `- **אבחנה:** ${c.diagnosis}\n`;
    if (c.category) entry += `- **קטגוריה:** ${c.category}\n`;
    if (c.key_features) entry += `- **מאפיינים מרכזיים:** ${c.key_features}\n`;
    if (c.diagnostic_criteria) entry += `- **קריטריוני אבחון:** ${c.diagnostic_criteria}\n`;
    if (c.description) entry += `- **תיאור קליני מפורט:** ${c.description}\n`;
    return entry;
  }).join("\n---\n");
}

/**
 * Compact numbered list (with ids) for the matching/ranking stage.
 * Every case is listed so the model evaluates each one explicitly — but only
 * the identifiers + the hallmark features, trimmed, to keep the prompt light
 * and the match fast. Full detail is added later, for the top matches only.
 */
export function buildCasesForMatching(cases) {
  if (!cases || cases.length === 0) {
    return "אין מידע זמין במאגר הידע כרגע.";
  }

  return cases.map((c, i) => {
    let entry = `#${i + 1} [id:${c.id}] ${c.title}`;
    if (c.diagnosis) entry += ` — ${c.diagnosis}`;
    if (c.category) entry += ` [${c.category}]`;
    if (c.urgent) entry += " ⚠דחוף";
    if (c.key_features) entry += ` | ${trunc(c.key_features, 160)}`;
    return entry;
  }).join("\n");
}

/**
 * Full detail for only the top matched cases — used to ground the diagnosis
 * stage in the most relevant knowledge only. Long free-text is trimmed so the
 * (Opus) diagnosis prompt stays fast; the diagnostic criteria and hallmark
 * features — the parts the reasoning actually needs — are kept.
 */
export function buildMatchedCasesText(cases) {
  if (!cases || cases.length === 0) return "";

  return cases.map((c, i) => {
    let entry = `### מקרה תואם ${i + 1}: ${c.title}\n`;
    entry += `- **אבחנה:** ${c.diagnosis}\n`;
    if (c.category) entry += `- **קטגוריה:** ${c.category}\n`;
    if (c.key_features) entry += `- **מאפיינים מרכזיים:** ${c.key_features}\n`;
    if (c.diagnostic_criteria) entry += `- **קריטריוני אבחון:** ${trunc(c.diagnostic_criteria, 600)}\n`;
    if (c.description) entry += `- **תיאור קליני:** ${trunc(c.description, 300)}\n`;
    return entry;
  }).join("\n---\n");
}
