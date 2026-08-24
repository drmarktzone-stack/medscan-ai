/**
 * Marketing & share utilities for FreeAI Hub outreach.
 */

const DEFAULT_PUBLIC_ORIGIN = "https://drmarktzone-stack.github.io/medscan-ai";

function basePath() {
  if (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) {
    return import.meta.env.BASE_URL.replace(/\/$/, "");
  }
  return "/medscan-ai";
}

export function getPublicOrigin() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_FREEAI_PUBLIC_URL) {
    return import.meta.env.VITE_FREEAI_PUBLIC_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath()}`.replace(/\/$/, "");
  }
  return DEFAULT_PUBLIC_ORIGIN;
}

export const PRODUCT_URL = `${getPublicOrigin()}/freeai`;
export const CREATE_URL = `${PRODUCT_URL}/create`;
export const PRICING_URL = `${PRODUCT_URL}/pricing`;
export const CHECKOUT_URL = `${PRODUCT_URL}/checkout`;
export const MARKETING_URL = `${PRODUCT_URL}/marketing`;

export function shareMessage(locale = "he") {
  if (locale === "he") {
    return `🚀 FreeAI Hub — כל כלי ה-AI בחינם + Pro ב-₪20/חודש בלבד!

✅ תמונות, קוד, עיצוב, וידאו
✅ 30+ ספקים (Google Labs, Bolt, Leonardo...)
✅ ממשק אחד — בלי לשלם ₪500 ל-ChatGPT+Midjourney

נסו חינם: ${CREATE_URL}
Pro ₪20/חודש: ${PRICING_URL}`;
  }
  return `🚀 FreeAI Hub — all AI tools free + Pro for only ₪20/month!\n\nTry free: ${CREATE_URL}`;
}

export function whatsAppShareUrl(locale = "he") {
  const text = encodeURIComponent(shareMessage(locale));
  return `https://wa.me/?text=${text}`;
}

export function telegramShareUrl(locale = "he") {
  const text = encodeURIComponent(shareMessage(locale));
  return `https://t.me/share/url?url=${encodeURIComponent(CREATE_URL)}&text=${text}`;
}

export function twitterShareUrl(locale = "he") {
  const text = encodeURIComponent(
    locale === "he"
      ? `FreeAI Hub — כל כלי ה-AI בממשק אחד, Pro רק ₪20/חודש 🚀 ${CREATE_URL}`
      : `FreeAI Hub — all AI tools, Pro only ₪20/month 🚀 ${CREATE_URL}`
  );
  return `https://twitter.com/intent/tweet?text=${text}`;
}

export function linkedInShareUrl() {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CREATE_URL)}`;
}

export function emailShareUrl(locale = "he") {
  const subject = encodeURIComponent(
    locale === "he" ? "FreeAI Hub — כל כלי ה-AI ב-₪20/חודש" : "FreeAI Hub — all AI for ₪20/month"
  );
  const body = encodeURIComponent(shareMessage(locale));
  return `mailto:?subject=${subject}&body=${body}`;
}

export async function nativeShare(locale = "he") {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({
      title: "FreeAI Hub",
      text: shareMessage(locale),
      url: CREATE_URL,
    });
    return { ok: true };
  }
  return { ok: false, reason: "not_supported" };
}

/** Target segments for outreach — copy-paste ready */
export const OUTREACH_TARGETS = [
  {
    segment: "קבוצות פייסבוק — עסקים קטנים",
    segmentEn: "Facebook groups — small business",
    examples: ["עסקים קטנים בישראל", "יזמים ישראלים", "שיווק דיגיטלי ישראל", "פרילancers ישראל"],
    channel: "facebook",
  },
  {
    segment: "קבוצות WhatsApp / Telegram",
    segmentEn: "WhatsApp / Telegram groups",
    examples: ["קבוצות עיצוב", "קבוצות פיתוח", "קבוצות AI ישראל"],
    channel: "whatsapp",
  },
  {
    segment: "פורומים וקהילות",
    segmentEn: "Forums & communities",
    examples: ["Reddit r/Israel", "Reddit r/sideproject", "Indie Hackers", "Product Hunt"],
    channel: "forum",
  },
  {
    segment: "בלוגרים / יoutubers טכנולוגיה",
    segmentEn: "Tech bloggers / YouTubers",
    examples: ["ערוצי AI בעברית", "ערוצי עיצוב", "Podcasts יזמות"],
    channel: "email",
  },
  {
    segment: "סוכנויות שיווק / פרילancers",
    segmentEn: "Marketing agencies / freelancers",
    examples: ["סוכנויות דיגיטל", "מעצבים גרפיים", "מפתחי אתרים"],
    channel: "email",
  },
  {
    segment: "חנויות e-commerce",
    segmentEn: "E-commerce stores",
    examples: ["מוכרי Etsy", "חנויות Shopify", "מוכרי Wolt/Instagram"],
    channel: "dm",
  },
  {
    segment: "Product directories",
    segmentEn: "Product directories",
    examples: ["Product Hunt", "AlternativeTo", "There's An AI For That", "Futurepedia", "Toolify.ai"],
    channel: "submit",
  },
];

export const OUTREACH_EMAILS = {
  smb_he: {
    subject: "כל כלי ה-AI ב-₪20/חודש — FreeAI Hub",
    body: `שלום,

גיליתי כלי שמאגד את כל שירותי ה-AI החינמיים + Pro במחיר של כוס קפה:

🚀 FreeAI Hub — ${CREATE_URL}

מה זה נותן:
• תמונות AI (Google Labs, Leonardo, Ideogram)
• בניית אתרים וקוד (Bolt, v0, Lovable)
• עיצוב, וידאו, deploy — הכל בממשק אחד
• Credit Passport — אוסף קרדיטים חינמיים מ-30+ platforms

💰 Pro: ₪20/חודש (חינם לנסות — 2 פרויקטים)

בהשוואה: ChatGPT Plus ₪70 + Midjourney ₪40 + Canva Pro ₪50 = ₪160/חודש
FreeAI Hub Pro: ₪20/חודש

נסו: ${CREATE_URL}

בברכה,
[שמך]`,
  },
  agency_he: {
    subject: "כלי AI לסוכנות — Pro ₪20/חודש, white-label potential",
    body: `שלום,

FreeAI Hub מאגד 30+ כלי AI (Google Labs, Bolt, Leonardo, Runway...) בממשק אחד.

לסוכנות שלכם:
• יצירת תמונות/עיצוב/קוד ללקוחות
• Pipeline מלא: קוד → עיצוב → deploy
• CSV import — קטלוג מוצרים שלם בלחיצה
• Pro: ₪20/חודש (unlimited projects)

דמו חינם: ${CREATE_URL}

מעוניינים לשמוע על white-label?`,
  },
  influencer_he: {
    subject: "שיתוף פעולה — FreeAI Hub (AI aggregator, ₪20/חודש)",
    body: `היי [שם],

בנינו FreeAI Hub — כלי שמאגד את כל AI החינמיים + Pro ב-₪20/חודש.

רעיון לתוכן:
• "איך יוצרים אתר + תמונות + deploy ב-₪0"
• "ChatGPT + Midjourney + Bolt — הכל ב-₪20"

לינק affiliate / קוד קופון — נשמח לדבר.

דמו: ${CREATE_URL}`,
  },
  product_hunt_en: {
    subject: "FreeAI Hub — All AI tools in one interface for ₪20/month",
    body: `Tagline: Stop paying for 5 AI subscriptions. One hub, all tools, ₪20/month.

FreeAI Hub aggregates 30+ free AI providers (Google Labs, Bolt.new, Leonardo, Runway...) into a single ChatGPT-style interface.

Features:
- Image, code, video, design generation
- Full project pipeline: code → design → deploy
- Credit Passport: harvest free credits from all platforms
- Pro: ₪20/month (~$5)

Try free: ${CREATE_URL}`,
  },
};
