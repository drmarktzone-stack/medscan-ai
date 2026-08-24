/**
 * מנוע הרחבת יעדים — תבניות תעשייה ליצירת מאות לידים פוטנציאליים
 * לידים מורחבים מסומנים source:'generated' — דורשים אימות פרטי קשר לפני שליחה.
 */

const CITIES = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'נתניה', 'ראשון לציון', 'פתח תקווה',
  'אשדוד', 'חולון', 'בני ברק', 'רמת גן', 'רחובות', 'כפר סבא', 'הרצליה', 'מודיעין',
  'חדרה', 'נהריה', 'עפולה', 'אילת', 'רעננה', 'גבעתיים', 'בת ים', 'לוד', 'רמלה',
];

const NICHES = [
  { prefix: 'מרפאת שיניים', category: 'health', tool: 'LeadBot', industry: 'שיניים' },
  { prefix: 'קליניקת פיזיותרפיה', category: 'health', tool: 'LeadBot', industry: 'פיזיותרפיה' },
  { prefix: 'משרד עורכי דין', category: 'professional', tool: 'LeadBot', industry: 'משפט' },
  { prefix: 'רואי חשבון', category: 'professional', tool: 'LeadBot', industry: 'ראיית חשבון' },
  { prefix: 'סוכנות נדל"ן', category: 'realestate', tool: 'LeadBot', industry: 'נדל"ן' },
  { prefix: 'אינסטלטור', category: 'trades', tool: 'LeadBot', industry: 'אינסטלציה' },
  { prefix: 'חשמלאי', category: 'trades', tool: 'LeadBot', industry: 'חשמל' },
  { prefix: 'סטודיו כושר', category: 'fitness', tool: 'LeadBot', industry: 'כושר' },
  { prefix: 'סוכנות דיגיטל', category: 'marketing', tool: 'ContentFlow', industry: 'שיווק' },
  { prefix: 'בניית אתרים', category: 'marketing', tool: 'ConvertScan', industry: 'אתרים' },
  { prefix: 'מספרה', category: 'ecommerce', tool: 'LeadBot', industry: 'יופי' },
  { prefix: 'מסעדה', category: 'ecommerce', tool: 'ContentFlow', industry: 'מסעדנות' },
];

/**
 * @param {number} targetCount
 * @returns {object[]}
 */
export function generateProspectSeeds(targetCount = 200) {
  const out = [];
  let n = 0;
  for (const niche of NICHES) {
    for (const city of CITIES) {
      if (out.length >= targetCount) return out;
      n += 1;
      const id = `gen_${niche.category}_${n}`;
      out.push({
        id,
        name: `${niche.prefix} ${city}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${niche.prefix} ${city}`)}`,
        category: niche.category,
        industry: niche.industry,
        email: null,
        phone: null,
        whatsapp: null,
        recommendedTool: niche.tool,
        gaps: ['פרטי קשר לבדיקה', 'צריך לאמת אתר'],
        outreachAngle: `${niche.tool} ל${niche.prefix} ב${city} — מענה מהיר ללידים מקומיים`,
        status: 'prospect',
        priority: 'low',
        source: 'generated',
        needsContactResearch: true,
      });
    }
  }
  return out;
}

export function mergeCatalog(base, generated) {
  const ids = new Set(base.map((p) => p.id));
  return [...base, ...generated.filter((g) => !ids.has(g.id))];
}
