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