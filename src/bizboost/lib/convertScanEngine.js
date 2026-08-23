/**
 * ConvertScan — מנוע ביקורת המרה לאתרים (ניתוח HTML/URL)
 */

const CHECKS = [
  { id: 'whatsapp', weight: 15, labelHe: 'קישור WhatsApp', test: (ctx) => /wa\.me|whatsapp|api\.whatsapp/i.test(ctx.html) },
  { id: 'tel', weight: 10, labelHe: 'לחיוג ישיר (tel:)', test: (ctx) => /href=["']tel:/i.test(ctx.html) },
  { id: 'hebrew', weight: 12, labelHe: 'תוכן בעברית', test: (ctx) => /[\u0590-\u05FF]/.test(ctx.html) },
  { id: 'viewport', weight: 10, labelHe: 'Viewport למובייל', test: (ctx) => /name=["']viewport["']/i.test(ctx.html) },
  { id: 'cta', weight: 12, labelHe: 'CTA ברור', test: (ctx) => /ייעוץ|הצטרפ|הזמינ|קבע|signup|contact|book|free|חינם/i.test(ctx.html) },
  { id: 'schema', weight: 8, labelHe: 'Schema markup', test: (ctx) => /application\/ld\+json|schema\.org/i.test(ctx.html) },
  { id: 'og', weight: 5, labelHe: 'Open Graph tags', test: (ctx) => /property=["']og:/i.test(ctx.html) },
  { id: 'short_form', weight: 10, labelHe: 'טופס קצר (≤4 שדות)', test: (ctx) => {
    const inputs = (ctx.html.match(/<input[^>]*>/gi) || []).length;
    const textareas = (ctx.html.match(/<textarea[^>]*>/gi) || []).length;
    return inputs + textareas <= 4 || inputs + textareas === 0;
  }},
  { id: 'ssl_hint', weight: 5, labelHe: 'HTTPS', test: (ctx) => ctx.url.startsWith('https://') },
  { id: 'rtl', weight: 8, labelHe: 'תמיכת RTL', test: (ctx) => /dir=["']rtl["']|direction:\s*rtl/i.test(ctx.html) },
  { id: 'social_proof', weight: 8, labelHe: 'Social proof', test: (ctx) => /לקוחות|testimonial|review|★|⭐|ממליצ|clients|trusted/i.test(ctx.html) },
  { id: 'speed_hint', weight: 7, labelHe: 'אופטימיזציית תמונות', test: (ctx) => /\.webp|loading=["']lazy["']/i.test(ctx.html) || !/<img/i.test(ctx.html) },
];

const RECOMMENDATIONS = {
  whatsapp: { priority: 'critical', textHe: 'הוסיפו כפתור WhatsApp צף — 90%+ מהישראלים משתמשים בו להמרות', impact: '+35% המרות' },
  tel: { priority: 'high', textHe: 'הוסיפו קישור tel: לחיוג בלחיצה — קריטי למובייל', impact: '+20% שיחות' },
  hebrew: { priority: 'high', textHe: '72% מהחיפושים בישראל בעברית — הוסיפו תוכן עברי איכותי', impact: '+40% תנועה אורגנית' },
  viewport: { priority: 'critical', textHe: 'חסר viewport — Google מענish אתרים שלא mobile-first', impact: 'SEO + UX' },
  cta: { priority: 'high', textHe: 'שנו CTA מ"צור קשר" ל"קבעו ייעוץ חינם" — ספציפי = יותר המרות', impact: '+25% קליקים' },
  schema: { priority: 'medium', textHe: 'הוסיפו LocalBusiness schema — מופיעים בתוצאות עשירות', impact: 'SEO מקומי' },
  og: { priority: 'medium', textHe: 'הוסיפו Open Graph — שיתופים ברשתות נראים מקצועיים', impact: 'Social CTR' },
  short_form: { priority: 'high', textHe: 'קצרו טופס — כל שדה נוסף מוריד 10% השלמות', impact: '+30% לידים' },
  ssl_hint: { priority: 'critical', textHe: 'עברו ל-HTTPS — דפדפנים מסמנים HTTP כלא מאובטח', impact: 'אמון + SEO' },
  rtl: { priority: 'medium', textHe: 'הוסיפו dir="rtl" לתוכן עברי — קריאות טובה יותר', impact: 'UX' },
  social_proof: { priority: 'medium', textHe: 'הוסיפו המלצות לקוחות / מספרים — בונה אמון', impact: '+15% המרות' },
  speed_hint: { priority: 'medium', textHe: 'השתמשו ב-WebP ו-lazy loading — אתרים איטיים מאבדים 70% תנועה', impact: 'Core Web Vitals' },
};

/**
 * @param {{ url?: string, html?: string, businessName?: string }} input
 */
export function auditWebsite(input) {
  const url = (input.url || '').trim();
  const html = (input.html || '').trim();
  const businessName = input.businessName || extractTitle(html) || url || 'האתר';

  if (!html && !url) {
    return { error: 'יש להזין URL או להדביק HTML של דף הבית' };
  }

  const ctx = { url: url || 'https://example.com', html: html || '' };

  const results = CHECKS.map((check) => {
    const passed = ctx.html ? check.test(ctx) : null;
    return { id: check.id, labelHe: check.labelHe, weight: check.weight, passed, score: passed ? check.weight : 0 };
  });

  const scorable = results.filter((r) => r.passed !== null);
  const maxScore = scorable.reduce((s, r) => s + r.weight, 0);
  const totalScore = scorable.reduce((s, r) => s + r.score, 0);
  const scorePercent = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;

  const failed = results.filter((r) => r.passed === false);
  const recommendations = failed
    .map((r) => ({ checkId: r.id, ...RECOMMENDATIONS[r.id] }))
    .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  const grade = scoreToGrade(scorePercent);

  return {
    businessName,
    url: ctx.url,
    score: scorePercent,
    grade,
    gradeLabel: grade.labelHe,
    checks: results,
    recommendations,
    quickWins: recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').slice(0, 3),
    estimatedLift: estimateLift(recommendations.length),
    auditedAt: new Date().toISOString(),
  };
}

function priorityOrder(p) {
  return { critical: 0, high: 1, medium: 2, low: 3 }[p] ?? 4;
}

function scoreToGrade(score) {
  if (score >= 85) return { letter: 'A', labelHe: 'מצוין — אתר ממיר' };
  if (score >= 70) return { letter: 'B', labelHe: 'טוב — שיפורים קטנים יביאו תוצאות' };
  if (score >= 50) return { letter: 'C', labelHe: 'בינוני — מפסידים לידים' };
  if (score >= 30) return { letter: 'D', labelHe: 'חלש — דורש שיפור דחוף' };
  return { letter: 'F', labelHe: 'קריטי — אתר שובר המרות' };
}

function estimateLift(failedCount) {
  const lifts = ['+10-15%', '+20-35%', '+35-50%', '+50-70%'];
  return lifts[Math.min(failedCount, lifts.length - 1)];
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

/** Fetch HTML for audit (best-effort; may fail CORS in browser) */
export async function fetchPageHtml(url) {
  try {
    const res = await fetch(url, { mode: 'cors', headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch {
    return null;
  }
}

export { CHECKS, RECOMMENDATIONS };
