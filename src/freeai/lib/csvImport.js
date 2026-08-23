/**
 * CSV import — batch product image generation from spreadsheet.
 */

/**
 * Parse CSV text into rows.
 * @param {string} csvText
 */
export function parseCsv(csvText) {
  const lines = csvText.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { ok: false, reason: "too_few_rows" };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
    rows.push(row);
  }

  return { ok: true, headers, rows, count: rows.length };
}

/**
 * Convert CSV rows to design tasks.
 * @param {object[]} rows
 */
export function csvToTasks(rows) {
  return rows.map((row) => {
    const name = row.name || row.שם || row.title || "product";
    const desc = row.description || row.תיאור || row.desc || "";
    const category = row.category || row.קטגוריה || "";
    return {
      type: "image",
      count: 1,
      prompt: `product photo: ${name}. ${desc}. ${category}. white background, ecommerce`,
      meta: row,
    };
  });
}

/**
 * Generate CSV template for download.
 */
export function csvTemplate() {
  return "name,description,category\nחולצה כחולה,100% כותנה,bg\nנעליים ספורט,נוחות מקסימלית,shoes";
}

export function downloadCsv(content, filename = "products.csv") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
