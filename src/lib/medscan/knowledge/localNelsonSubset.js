/**
 * תת-קבוצת נלסון שכבר במאגר (JSON חילוץ) — לא הספר השלם, לא PDF.
 * משמשת כש-NelsonChapter ב-Base44 ריק (GitHub Pages / מצב עצמאי).
 */

function text(value) {
  return String(value || "").trim();
}

function topicRows(topic, file) {
  const rows = [];
  if (text(topic.summary_he)) rows.push(["סיכום (טיוטה לאימות)", text(topic.summary_he)]);
  if (text(topic.source_quote_he)) rows.push(["ציטוט מקור", text(topic.source_quote_he)]);
  const flags = (file.red_flags || []).filter((rf) => !rf.source_anchor || rf.source_anchor === topic.topic_key);
  for (const rf of flags) {
    const line = [text(rf.label_he), text(rf.action_he) || text(rf.reason_he)].filter(Boolean);
    if (line.length) rows.push(["דגל", line.join(" — ")]);
  }
  return rows;
}

export function extractionFileToChapter(raw, fallbackNo = 0) {
  const file = raw && typeof raw === "object" ? raw : {};
  const first = (file.topics || [])[0] || {};
  const chapter_no = Number(first.chapter_number) > 0 ? Number(first.chapter_number) : fallbackNo;
  const topics = [];

  for (const tp of file.topics || []) {
    const rows = topicRows(tp, file);
    if (!rows.length) continue;
    topics.push({
      t: text(tp.topic_title_he) || text(tp.topic_key) || "נושא",
      k: text(tp.topic_key),
      pg: [tp.page_start, tp.page_end].filter((n) => n != null && n !== "").join("–") || null,
      tb: [{ p: tp.page_start ?? null, r: rows }],
    });
  }

  return {
    chapter_no,
    title_he: text(file.chapter_title_he) || text(first.chapter_title_he) || `פרק ${chapter_no}`,
    topic_count: topics.length,
    cell_count: topics.reduce((n, tp) => n + tp.tb.reduce((m, tbl) => m + tbl.r.length, 0), 0),
    topics,
    source_note_he: text(file._provenance_he) || text(file._note_he)
      || "תת-קבוצה מחילוץ מקומי במאגר. אינו הספר השלם. טיוטה לאימות מול Nelson Textbook.",
    local_subset: true,
  };
}

export function chaptersFromExtractions(files) {
  const byKey = new Map();
  (files || []).forEach((raw, i) => {
    const ch = extractionFileToChapter(raw, i + 1);
    if (!ch.topics.length) return;
    const key = ch.chapter_no || ch.title_he;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, ch);
      return;
    }
    prev.topics.push(...ch.topics);
    prev.topic_count = prev.topics.length;
    prev.cell_count += ch.cell_count;
  });
  return [...byKey.values()].sort((a, b) => Number(a.chapter_no) - Number(b.chapter_no));
}

export function loadLocalNelsonSubset() {
  try {
    const mods = import.meta.glob("../../../../scripts/extractions/**/*.json", { eager: true });
    const files = Object.values(mods).map((m) => m?.default ?? m).filter(Boolean);
    return chaptersFromExtractions(files);
  } catch {
    return [];
  }
}
