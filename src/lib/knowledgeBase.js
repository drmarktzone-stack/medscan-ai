export function buildKnowledgeBaseText(cases) {
  if (!cases || cases.length === 0) {
    return "אין מידע זמין במאגר הידע כרגע.";
  }

  return cases.map((c, i) => {
    let entry = `### ${i + 1}. ${c.title}\n`;
    entry += `- **אבחנה:** ${c.diagnosis}\n`;
    if (c.category) entry += `- **קטגוריה:** ${c.category}\n`;
    if (c.key_features) entry += `- **מאפיינים מרכזיים:** ${c.key_features}\n`;
    if (c.description) entry += `- **תיאור קליני מפורט:** ${c.description}\n`;
    return entry;
  }).join("\n---\n");
}

/**
 * Compact numbered list (with ids) for the matching/ranking stage.
 * Every case is listed so the model evaluates each one explicitly.
 */
export function buildCasesForMatching(cases) {
  if (!cases || cases.length === 0) {
    return "אין מידע זמין במאגר הידע כרגע.";
  }

  return cases.map((c, i) => {
    let entry = `#${i + 1} [id: ${c.id}]\n`;
    entry += `כותרת: ${c.title}\n`;
    entry += `אבחנה: ${c.diagnosis}\n`;
    if (c.key_features) entry += `מאפיינים: ${c.key_features}\n`;
    if (c.description) entry += `תיאור: ${c.description}\n`;
    return entry;
  }).join("\n");
}

/**
 * Full detail for only the top matched cases — used to ground the
 * diagnosis stage in the most relevant knowledge only.
 */
export function buildMatchedCasesText(cases) {
  if (!cases || cases.length === 0) return "";

  return cases.map((c, i) => {
    let entry = `### מקרה תואם ${i + 1}: ${c.title}\n`;
    entry += `- **אבחנה:** ${c.diagnosis}\n`;
    if (c.category) entry += `- **קטגוריה:** ${c.category}\n`;
    if (c.key_features) entry += `- **מאפיינים מרכזיים:** ${c.key_features}\n`;
    if (c.description) entry += `- **תיאור קליני מפורט:** ${c.description}\n`;
    return entry;
  }).join("\n---\n");
}