/**
 * BizBoost — URLs, פוסטים ושיתופים לשיווק
 */

const DEFAULT_ORIGIN = 'https://drmarktzone-stack.github.io/medscan-ai';

function basePath() {
  try {
    if (import.meta?.env?.BASE_URL) return import.meta.env.BASE_URL.replace(/\/$/, '');
  } catch { /* */ }
  return '/medscan-ai';
}

export function getBizBoostOrigin() {
  try {
    const env = import.meta?.env || {};
    if (env.VITE_FREEAI_PUBLIC_URL) return env.VITE_FREEAI_PUBLIC_URL.replace(/\/$/, '');
  } catch { /* */ }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${basePath()}`.replace(/\/$/, '');
  }
  return DEFAULT_ORIGIN;
}

export const BIZBOOST_HOME = () => `${getBizBoostOrigin()}/bizboost`;
export const BIZBOOST_PRICING = () => `${getBizBoostOrigin()}/bizboost/pricing`;
export const BIZBOOST_LEADBOT = () => `${getBizBoostOrigin()}/bizboost/leadbot`;
export const BIZBOOST_MARKETING = () => `${getBizBoostOrigin()}/bizboost/marketing`;

export function pitchHe() {
  return `BizBoost AI — 3 כלי AI לעסקים בישראל

⚡ LeadBot — מענה WhatsApp ללידים תוך שניות
✍️ ContentFlow — תוכן עברית+אנגלית
🔍 ConvertScan — ציון המרה לאתר

מ־₪299/חודש · 14 יום חינם
Bit: 052-888-5800

${BIZBOOST_HOME()}`;
}

export function pitchEn() {
  return `BizBoost AI — 3 AI tools for Israeli SMBs

⚡ LeadBot — instant WhatsApp lead replies
✍️ ContentFlow — HE+EN marketing content
🔍 ConvertScan — website conversion score

From ₪299/mo · 14-day free trial
${BIZBOOST_HOME()}`;
}

export function socialPosts() {
  const home = BIZBOOST_HOME();
  const pricing = BIZBOOST_PRICING();
  return {
    facebook_he:
      `עסקים מפסידים לידים כי אף אחד לא עונה בלילה.\n\n` +
      `BizBoost AI בנוי בדיוק לזה:\n` +
      `✅ LeadBot — מענה WhatsApp אוטומטי\n` +
      `✅ ContentFlow — פוסטים בעברית ובאנגלית\n` +
      `✅ ConvertScan — למה האתר לא ממיר\n\n` +
      `14 יום חינם · מ־₪299\n${home}\n\n#עסקיםקטנים #שיווקדיגיטלי #AI #ישראל`,

    linkedin_he:
      `3 בעיות שחוזרות בכל עסק קטן בישראל (והפתרון ב-AI):\n\n` +
      `1. לידים שלא מקבלים מענה תוך דקות\n` +
      `2. אין תוכן דו-לשוני עקבי\n` +
      `3. אתר שמביא תנועה בלי המרות\n\n` +
      `BizBoost AI: LeadBot · ContentFlow · ConvertScan\n` +
      `ניסיון 14 יום: ${pricing}`,

    whatsapp_status_he:
      `🚀 BizBoost AI\nמענה ללידים + תוכן + ביקורת אתר\n14 יום חינם\n${home}`,

    instagram_he:
      `הליד כתב ב-23:40.\nהמתחרה ענה.\nאתם? מחר בבוקר.\n\nLeadBot של BizBoost עונה תוך שניות — גם בלילה.\n\nניסיון חינם ← לינק בביו / ${home}`,

    twitter_en:
      `Israeli SMBs lose deals to slow WhatsApp replies.\n\nBizBoost AI: LeadBot + bilingual content + conversion audit.\nFrom ₪299/mo. Free 14 days.\n${home}`,

    email_subject_he: '3 כלי AI שסוגרים לידים לעסק שלכם',
    email_body_he:
      `שלום,\n\nשמתי לב שעסקים כמו שלכם מפסידים לידים בגלל מענה איטי ותוכן לא עקבי.\n\n` +
      `BizBoost AI נותן:\n- LeadBot (WhatsApp)\n- ContentFlow (עברית+אנגלית)\n- ConvertScan (ציון המרה)\n\n` +
      `14 יום חינם: ${pricing}\n\nסאמר · drmarktzone@gmail.com · 052-888-5800`,
  };
}

export function whatsAppBroadcastUrl(locale = 'he') {
  const text = encodeURIComponent(locale === 'en' ? pitchEn() : pitchHe());
  return `https://wa.me/?text=${text}`;
}

export function twitterShareUrl() {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialPosts().twitter_en)}`;
}

export function linkedInShareUrl() {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BIZBOOST_HOME())}`;
}

export function facebookShareUrl() {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(BIZBOOST_HOME())}`;
}

export function telegramShareUrl() {
  return `https://t.me/share/url?url=${encodeURIComponent(BIZBOOST_HOME())}&text=${encodeURIComponent(pitchHe())}`;
}

export function emailShareUrl() {
  const p = socialPosts();
  return `mailto:?subject=${encodeURIComponent(p.email_subject_he)}&body=${encodeURIComponent(p.email_body_he)}`;
}

export const DIRECTORY_SUBMISSIONS = Object.freeze([
  { name: "There's An AI For That", url: 'https://theresanaiforthat.com/submit/' },
  { name: 'Futurepedia', url: 'https://www.futurepedia.io/submit-tool' },
  { name: 'Toolify.ai', url: 'https://www.toolify.ai/submit' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com/posts/new' },
  { name: 'AlternativeTo', url: 'https://alternativeto.net/manage/new/' },
  { name: 'Startup Nation Finder', url: 'https://finder.startupnationcentral.org/' },
]);

export const VALUE_STATS = Object.freeze([
  { value: '30 שנ׳', label: 'זמן מענה LeadBot' },
  { value: '₪299', label: 'התחלה מחודש' },
  { value: '14 יום', label: 'ניסיון חינם' },
  { value: '3 כלים', label: 'לידים · תוכן · המרות' },
]);
