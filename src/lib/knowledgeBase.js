// עוזר קיצוץ — שומר על פרומפטים ממוקדים. קיצוץ אינו פוגע בדיוק:
// שלב ההתאמה צריך את המאפיינים והקריטריונים המבחינים, לא חיבורים שלמים.
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
 * Every case is evaluated by the model. Each entry carries BOTH the hallmark
 * features AND a short slice of the formal diagnostic criteria — so retrieval
 * ranks against the actual clinical knowledge, not the title alone. Trimmed to
 * keep the (fast-model) matching prompt light; full detail is added later for
 * the top matches only.
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
    // שלב-האחזור רץ על מאפיינים בלבד (קל ומהיר); הקריטריונים המלאים נבדקים בשלב-האימות על המובילים בלבד.
    if (c.key_features) entry += ` | ${trunc(c.key_features, 130)}`;
    return entry;
  }).join("\n");
}

/**
 * Full detail for only the top matched cases — grounds the diagnosis stage in
 * the most relevant knowledge only. Diagnostic criteria and hallmark features
 * (what the reasoning needs) are kept nearly whole; only long free-text prose
 * is trimmed, to keep the (Opus) diagnosis prompt responsive.
 */
export function buildMatchedCasesText(cases) {
  if (!cases || cases.length === 0) return "";

  return cases.map((c, i) => {
    let entry = `### מקרה תואם ${i + 1}: ${c.title}\n`;
    entry += `- **אבחנה:** ${c.diagnosis}\n`;
    if (c.category) entry += `- **קטגוריה:** ${c.category}\n`;
    if (c.key_features) entry += `- **מאפיינים מרכזיים:** ${c.key_features}\n`;
    if (c.diagnostic_criteria) entry += `- **קריטריוני אבחון:** ${trunc(c.diagnostic_criteria, 900)}\n`;
    if (c.description) entry += `- **תיאור קליני:** ${trunc(c.description, 320)}\n`;
    return entry;
  }).join("\n---\n");
}
