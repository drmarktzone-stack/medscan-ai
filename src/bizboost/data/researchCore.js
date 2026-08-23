/**
 * BizBoost AI — 3 בעיות משותפות + מחירון
 */

export const COMMON_PROBLEMS = [
  {
    id: 'slow-leads',
    rank: 1,
    titleHe: 'איטיות בתגובה ללידים וחוסר מעקב',
    titleEn: 'Slow lead response & no follow-up',
    stat: '78% מהצרכנים חוקרים אונליין לפני קנייה — מי שלא עונה תוך דקות, מפסיד',
    painPoints: [
      'טופס יצירת קשר ארוך במקום WhatsApp מיידי',
      'אין מענה אוטומטי מחוץ לשעות הפעילות',
      'לידים נופלים בין הכיסאות — אין CRM או רצף מעקב',
      'הודעות גנéricיות שלא מסננות לידים חמים',
    ],
    aiSolution: 'LeadBot — מענה AI מיידי ב-WhatsApp עם סינון לידים ורצף מעקב אוטומטי',
    toolPath: '/bizboost/leadbot',
  },
  {
    id: 'content-gap',
    rank: 2,
    titleHe: 'חוסר אסטרטגיית תוכן דו-לשונית',
    titleEn: 'No bilingual content strategy',
    stat: '68% מהעסקים הקטנים ללא אסטרטגיית תוכן מתועדת; 72% מהחיפושים בישראל בעברית',
    painPoints: [
      'פרסום sporadic ברשתות בלי לוח שנה',
      'אתר באנגלית בלבד — מפספסים קהל מקומי',
      'תרגום מכונה גרוע במקום תוכן מותאם תרבות',
      'אין תוכן שמביא הוכחות חברתיות (social proof)',
    ],
    aiSolution: 'ContentFlow — יצירת תוכן שיווקי בעברית ואנגלית לפי תעשייה וערוץ',
    toolPath: '/bizboost/contentflow',
  },
  {
    id: 'low-conversion',
    rank: 3,
    titleHe: 'אתר שלא ממיר — תנועה בלי המרות',
    titleEn: 'Traffic without conversion',
    stat: '61% מהמשווקים מדווחים שהאתגר #1 הוא יצירת לידים; אתרים איטיים מאבדים 70%+ מהתנועה',
    painPoints: [
      'אין כפתור WhatsApp צף או tel: לחיוג',
      'טקסט קטן וכפתורים לא מותאמים למובייל',
      'CTA לא ברור — "צור קשר" במקום "קבעו ייעוץ חינם"',
      'חוסר Schema / SEO מקומי / עקביות NAP',
    ],
    aiSolution: 'ConvertScan — ביקורת AI לאתר עם ציון המרה והמלצות מיידיות',
    toolPath: '/bizboost/convertscan',
  },
];

/** מחיר לכל שירות בנפרד (standalone) */
export const STANDALONE_SERVICES = [
  {
    id: 'leadbot',
    nameHe: 'LeadBot',
    taglineHe: 'מענה AI מיידי ללידים',
    price: 299,
    currency: '₪',
    period: 'חודש',
    path: '/bizboost/leadbot',
    color: 'from-green-600 to-emerald-600',
    limits: '500 שיחות WhatsApp/חודש',
    features: [
      'מענה מיידי 24/7',
      'סינון לידים (חם/קר)',
      'רצף מעקב 4 שלבים',
      '3 תבניות לפי תעשייה',
      'דוח לידים שבועי',
    ],
    idealFor: 'אינסטלator, רופאים, נדל"ן, כל עסק עם WhatsApp',
  },
  {
    id: 'contentflow',
    nameHe: 'ContentFlow',
    taglineHe: 'תוכן שיווקי דו-לשוני',
    price: 350,
    currency: '₪',
    period: 'חודש',
    path: '/bizboost/contentflow',
    color: 'from-blue-600 to-cyan-600',
    limits: '50 פוסטים/חודש · HE + EN',
    features: [
      'פוסטים ל-Instagram, Facebook, LinkedIn',
      'כותרות Google Ads',
      'מתווה בלוג + SEO',
      'לוח שנה שבועי',
      'התאמה לתעשייה וערוץ',
    ],
    idealFor: 'סוכנויות, CPA, עסקים עם EN-first',
  },
  {
    id: 'convertscan',
    nameHe: 'ConvertScan',
    taglineHe: 'ביקורת AI להמרות באתר',
    price: 450,
    currency: '₪',
    period: 'חודש',
    path: '/bizboost/convertscan',
    color: 'from-orange-600 to-red-600',
    limits: '10 ביקורות אתר/חודש',
    features: [
      'ציון המרה 0–100',
      '12 בדיקות (WhatsApp, CTA, mobile...)',
      'Quick Wins מיידיים',
      'דוח PDF ללקוח',
      'White-label (ב-Pro)',
    ],
    idealFor: 'SEO, בניית אתרים, סוכנויות דיגיטל',
  },
];

/** תוספות וחריגות */
export const PRICING_ADDONS = [
  { id: 'extra-chat', labelHe: 'שיחה נוספת (מעל המכסה)', price: 0.5, unit: '₪/שיחה' },
  { id: 'extra-post', labelHe: 'פוסט תוכן נוסף', price: 15, unit: '₪/פוסט' },
  { id: 'extra-audit', labelHe: 'ביקורת אתר נוספת', price: 99, unit: '₪/ביקורת' },
  { id: 'setup', labelHe: 'הקמה חד-פעמית (התאמה + הדרכה)', price: 499, unit: '₪ חד-פעמי', range: '499–999' },
  { id: 'white-label', labelHe: 'White-label מלא', price: 200, unit: '₪/חודש תוספת', note: 'כלול ב-Pro' },
];

/** חבילות — חיסכון לעומת standalone */
export const PRICING_PLANS = [
  {
    id: 'starter',
    nameHe: 'Starter',
    price: 299,
    currency: '₪',
    period: 'חודש',
    tools: ['LeadBot'],
    standaloneTotal: 299,
    savings: 0,
    limits: '500 שיחות/חודש',
    features: ['LeadBot מלא', '3 תבניות תעשייה', 'דוח לידים שבועי'],
  },
  {
    id: 'growth',
    nameHe: 'Growth',
    price: 599,
    currency: '₪',
    period: 'חודש',
    popular: true,
    tools: ['LeadBot', 'ContentFlow'],
    standaloneTotal: 649,
    savings: 50,
    limits: '2,000 שיחות + 50 פוסטים',
    features: ['LeadBot + ContentFlow', 'תוכן דו-לשוני', 'לוח שנה שבועי', 'A/B לתבניות מענה'],
  },
  {
    id: 'pro',
    nameHe: 'Pro',
    price: 999,
    currency: '₪',
    period: 'חודש',
    tools: ['LeadBot', 'ContentFlow', 'ConvertScan'],
    standaloneTotal: 1099,
    savings: 100,
    limits: 'ללא הגבלה + 10 ביקורות/חודש',
    features: ['כל 3 הכלים', 'White-label', 'API + Webhook', 'ביקורת חודשית'],
  },
];

/** כל אפשרויות המנוי לטופס */
export function allPricingOptions() {
  const standalone = STANDALONE_SERVICES.map((s) => ({
    id: s.id,
    label: `${s.nameHe} — ${s.currency}${s.price}/${s.period}`,
    price: s.price,
    type: 'standalone',
  }));
  const bundles = PRICING_PLANS.map((p) => ({
    id: p.id,
    label: `חבילת ${p.nameHe} — ${p.currency}${p.price}/${p.period}`,
    price: p.price,
    type: 'bundle',
  }));
  return [...standalone, ...bundles];
}
