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

export const PRICING_PLANS = [
  {
    id: 'starter',
    nameHe: 'Starter',
    price: 299,
    currency: '₪',
    period: 'חודש',
    tools: ['LeadBot'],
    limits: '500 שיחות/חודש',
    features: ['מענה WhatsApp אוטומטי', '3 תבניות תעשייה', 'דוח לידים שבועי'],
  },
  {
    id: 'growth',
    nameHe: 'Growth',
    price: 599,
    currency: '₪',
    period: 'חודש',
    popular: true,
    tools: ['LeadBot', 'ContentFlow'],
    limits: '2,000 שיחות + 50 פוסטים',
    features: ['כל Starter', 'תוכן דו-לשוני', 'לוח שנה שבועי', 'A/B לתבניות מענה'],
  },
  {
    id: 'pro',
    nameHe: 'Pro',
    price: 999,
    currency: '₪',
    period: 'חודש',
    tools: ['LeadBot', 'ContentFlow', 'ConvertScan'],
    limits: 'ללא הגבלה + 10 ביקורות/חודש',
    features: ['כל Growth', 'ביקורת אתר חודשית', 'White-label', 'API + Webhook'],
  },
];
