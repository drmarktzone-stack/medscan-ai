/**
 * DoctorPedAI — עוגני ספרות מאושרת (Nelson Textbook / חוזרי משרד הבריאות)
 *
 * כל פלט דיאגנוסטי, המלצה טיפולית או מעבדתית חייב להצביע על פרק וסעיף
 * ספציפיים בנלסון, או על חוזר משרד הבריאות. ציטוט שאינו בצורת העוגן
 * הזו אינו "מקור" — הוא הזיה של סמכות.
 *
 * אין כאן תוכן קליני מועתק מהספר. רק מזהי עוגן + פירוק לפרק/סעיף.
 */

export const APPROVED_LITERATURE_PREFIXES = Object.freeze(['nelson.', 'nelson22.', 'moh.']);

/** טיוטות שצורתן ספרותית (נלסון/חוזר) אך טרם אומתו מול המקור. */
export const DRAFT_LITERATURE_PREFIXES = Object.freeze([
  'needs_verification.nelson.',
  'needs_verification.nelson22.',
  'needs_verification.moh.',
]);

const DRAFT_HEAD = 'needs_verification.';

export function isApprovedLiteratureAnchor(anchor) {
  const a = String(anchor ?? '').trim();
  if (!a) return false;
  if (a.startsWith(DRAFT_HEAD)) return false;
  return APPROVED_LITERATURE_PREFIXES.some((p) => a.startsWith(p));
}

/**
 * עוגן בצורת נלסון/חוזר — כולל טיוטות `needs_verification.nelson.*` /
 * `needs_verification.moh.*`. אינו מאשר את *התוכן*, רק את צורת הציטוט.
 */
export function isLiteratureShapedAnchor(anchor) {
  const a = String(anchor ?? '').trim();
  if (!a) return false;
  if (isApprovedLiteratureAnchor(a)) return true;
  return DRAFT_LITERATURE_PREFIXES.some((p) => a.startsWith(p));
}

/**
 * מפרק עוגן לפרק וסעיף.
 *
 * צורות נתמכות:
 *   nelson.{chapter}.{section}[.{rest}]
 *   nelson22.{chapter}.{section}
 *   moh.{circular}.{section}
 *   needs_verification.nelson.{chapter}.{section}
 *   needs_verification.moh.{circular}.{section}
 *
 * @returns {object|null}
 */
export function parseLiteratureCitation(anchor) {
  const raw = String(anchor ?? '').trim();
  if (!raw || !isLiteratureShapedAnchor(raw)) return null;

  const draft = raw.startsWith(DRAFT_HEAD);
  const body = draft ? raw.slice(DRAFT_HEAD.length) : raw;

  let corpus = null;
  let rest = body;
  if (body.startsWith('nelson22.')) {
    corpus = 'nelson22';
    rest = body.slice('nelson22.'.length);
  } else if (body.startsWith('nelson.')) {
    corpus = 'nelson';
    rest = body.slice('nelson.'.length);
  } else if (body.startsWith('moh.')) {
    corpus = 'moh';
    rest = body.slice('moh.'.length);
  } else {
    return null;
  }

  const parts = rest.split('.').filter(Boolean);
  if (!parts.length) return null;

  const chapter = parts[0];
  const section = parts.length > 1 ? parts.slice(1).join('.') : null;
  if (!section) return null;

  const corpusLabelHe = corpus === 'moh'
    ? 'חוזר משרד הבריאות'
    : corpus === 'nelson22'
      ? 'Nelson Textbook of Pediatrics, 22e'
      : 'Nelson Textbook of Pediatrics';

  const display_he = corpus === 'moh'
    ? `${corpusLabelHe} — ${chapter} / ${section}`
    : `${corpusLabelHe} — פרק ${chapter}, סעיף ${section}`;

  return {
    canonical: raw,
    corpus,
    chapter,
    section,
    draft,
    approved: !draft && isApprovedLiteratureAnchor(raw),
    display_he,
    verification_status: draft ? 'draft_needs_verification' : 'verified_shape',
  };
}

/**
 * דורש שלפריט KB/פלט יהיה עוגן ספרותי עם פרק וסעיף.
 * כישלון → null (אין ניחוש של פרק).
 */
export function requireLiteratureCitation(anchor) {
  return parseLiteratureCitation(anchor);
}

/** מוסיף שדה literature_citation לפריט KB אם העוגן ניתן לפירוק. */
export function attachLiteratureCitation(item) {
  if (!item || typeof item !== 'object') return item;
  const anchor = item.source_anchor ?? item.topic_key ?? null;
  const citation = parseLiteratureCitation(anchor);
  if (!citation) {
    return { ...item, literature_citation: null, literature_ok: false };
  }
  return { ...item, literature_citation: citation, literature_ok: citation.approved || citation.draft };
}

export function describeLiteratureAnchor(anchor) {
  const c = parseLiteratureCitation(anchor);
  return c ? c.display_he : null;
}
