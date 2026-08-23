/**
 * BizBoost AI — קטלוג יעדים מורחב (50+ עסקים ואתרים בישראל)
 * סטטוס ברירת מחדל: prospect — לא אישור. רק leads עם status=approved מוצגים כ"מאשרים".
 */

export const PROSPECT_CATEGORIES = [
  { id: 'marketing', labelHe: 'שיווק דיגיטלי', icon: '📣' },
  { id: 'professional', labelHe: 'שירותים מקצועיים', icon: '💼' },
  { id: 'health', labelHe: 'בריאות ורפואה', icon: '🏥' },
  { id: 'trades', labelHe: 'בעלי מקצוע מקומיים', icon: '🔧' },
  { id: 'realestate', labelHe: 'נדל"ן', icon: '🏠' },
  { id: 'fitness', labelHe: 'כושר ואורח חיים', icon: '💪' },
  { id: 'tech', labelHe: 'טכנולוגיה ו-SaaS', icon: '💻' },
  { id: 'ecommerce', labelHe: 'מסחר וקמעונאות', icon: '🛒' },
];

/** @typedef {'prospect'|'contacted'|'approved'|'declined'} ProspectStatus */

export const PROSPECTS_CATALOG = [
  // ── שיווק דיגיטלי ──
  { id: 'nwmedia', name: 'New Way Media', url: 'https://nwmedia.co.il', category: 'marketing', industry: 'שיווק דיגיטלי', email: 'info@nwmedia.co.il', phone: '054-497-1500', whatsapp: '972544971500', recommendedTool: 'LeadBot', gaps: ['טופס ארוך', 'מעקב לא אוטומטי'], outreachAngle: 'LeadBot יענה ללידים תוך 30 שניות גם בלילה', status: 'prospect', priority: 'high' },
  { id: 'pinklime', name: 'PinkLime', url: 'https://pinklime.io', category: 'marketing', industry: 'פיתוח דיגיטלי', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['CTA כללי', 'פחות SEO עברי'], outreachAngle: 'תוכן עברי ל-LemonAid', status: 'prospect', priority: 'high' },
  { id: 'adactive', name: 'Adactive', url: 'https://www.adactive.co.il', category: 'marketing', industry: 'שיווק דיגיטלי', email: null, phone: '072-334-0848', whatsapp: null, recommendedTool: 'LeadBot', gaps: ['נפח לידים גבוה', 'צריך סינון'], outreachAngle: 'LeadBot ל-iStore ולקוחות — סינון לידים אוטומטי', status: 'prospect', priority: 'high' },
  { id: 'mobius', name: 'Mobius Digital', url: 'https://mobius-digital.co.il', category: 'marketing', industry: 'שיווק דיגיטלי', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן B2B', 'לוח שנה'], outreachAngle: 'ContentFlow לפוסטים LinkedIn + case studies', status: 'prospect', priority: 'medium' },
  { id: 'brndini', name: 'Brndini', url: 'https://brndini.co.il', category: 'marketing', industry: 'פרסום דיגיטלי', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['350+ לקוחות — upsell'], outreachAngle: 'ConvertScan white-label ללקוחות אתרים', status: 'prospect', priority: 'high' },
  { id: 'yydigital', name: 'Y.Y. Digital', url: 'https://yydigital.co.il', category: 'marketing', industry: 'SEO + PPC', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['ניהול תוכן ידני'], outreachAngle: 'ContentFlow — 50 פוסטים/חודש אוטומטי', status: 'prospect', priority: 'medium' },
  { id: 'rnmarketing', name: 'R.N Marketing', url: 'https://rnmarketing.co.il', category: 'marketing', industry: 'שיווק + עיצוב', email: 'contact@rnmarketing.co.il', phone: '054-754-0135', whatsapp: '972547540135', recommendedTool: 'LeadBot', gaps: ['WhatsApp בלבד — עומס'], outreachAngle: 'LeadBot מסנן לפני שמגיעים אליכם', status: 'prospect', priority: 'high' },
  { id: 'vizel', name: 'Vizel Marketing', url: 'https://vizelmarketing.co.il', category: 'marketing', industry: 'שיווק דיגיטלי', email: 'vizelmarketing@gmail.com', phone: '052-782-3444', whatsapp: '972527823444', recommendedTool: 'ContentFlow', gaps: ['בוטיק — זמן תוכן'], outreachAngle: 'ContentFlow חוסך 10 שעות/שבוע על קופי', status: 'prospect', priority: 'medium' },
  { id: 'localseo', name: 'Local SEO Israel', url: 'https://localseoisrael.co.il', category: 'marketing', industry: 'SEO מקומי', email: 'simon@localseoisrael.co.il', phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['upsell המרה'], outreachAngle: 'ConvertScan לכל לקוח SEO', status: 'prospect', priority: 'high' },
  { id: 'shebossit', name: 'Shebossit', url: 'https://shebossit.com', category: 'marketing', industry: 'Lead gen B2B', email: 'contact@shebossit.com', phone: '052-629-8830', whatsapp: '972526298830', recommendedTool: 'LeadBot + ContentFlow', gaps: ['מעקב טופס', 'תוכן נישות'], outreachAngle: 'חבילת Growth — מענה + תוכן לדפי נחיתה', status: 'prospect', priority: 'high' },
  { id: 'seoisrael', name: 'SEO Israel', url: 'https://seoisrael.co.il', category: 'marketing', industry: 'קידום אתרים', email: 'contact@seoisrael.co.il', phone: '08-376-0633', whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['טופס ארוך'], outreachAngle: 'ConvertScan + LeadBot ללקוחות קידום', status: 'prospect', priority: 'medium' },

  // ── שירותים מקצועיים ──
  { id: 'eliav', name: 'Eliav & Co CPA', url: 'https://www.eliav.biz', category: 'professional', industry: 'ראיית חשבון + משפט', email: 'info@eliav.biz', phone: '03-791-3000', whatsapp: null, recommendedTool: 'LeadBot', gaps: ['טופס פגישה', 'מענה מחוץ לשעות'], outreachAngle: 'LeadBot לעצמאים ויזמים — מענה 24/7', status: 'prospect', priority: 'high' },
  { id: 'bkcpa', name: 'Barak Katzir CPA', url: 'https://www.bk-cpa.co.il', category: 'professional', industry: 'ראיית חשבון', email: null, phone: '03-688-2233', whatsapp: null, recommendedTool: 'LeadBot', gaps: ['טופס ייעוץ', '60+ עובדים — הרבה לידים'], outreachAngle: 'LeadBot מסנן startup vs enterprise', status: 'prospect', priority: 'medium' },
  { id: 'cpacohen', name: 'כהן רואי חשבון', url: 'https://cpacohen.com', category: 'professional', industry: 'ראיית חשבון', email: null, phone: '077-917-5918', whatsapp: '972779175918', recommendedTool: 'LeadBot', gaps: ['יש WhatsApp — לא אוטומטי'], outreachAngle: 'LeadBot משלים את ה-WhatsApp 24/7 שלכם', status: 'prospect', priority: 'high' },
  { id: 'yitzhaki', name: 'יצחקי ושות\' CPA', url: 'https://yitzhaki-cpa.co.il', category: 'professional', industry: 'מיסוי וחשבונאות', email: 'Sarit@sarityi.com', phone: '02-534-6696', whatsapp: '972506843355', recommendedTool: 'LeadBot', gaps: ['2 מוקדים — צריך אחידות'], outreachAngle: 'LeadBot אחיד לירושלים ות"א', status: 'prospect', priority: 'medium' },

  // ── בריאות ──
  { id: 'pearldental', name: 'Pearl Dental', url: 'https://www.pearldental.co.il', category: 'health', industry: 'מרפאת שיניים', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['תיאום תורים', 'מענה לילה'], outreachAngle: 'LeadBot לתיאום תורים + שאלות לפני ביקור', status: 'prospect', priority: 'high' },
  { id: 'dantedental', name: 'Dante Dental', url: 'https://dantedental.co.il', category: 'health', industry: 'מרפאת שיניים', email: null, phone: '077-217-7771', whatsapp: '972772177771', recommendedTool: 'LeadBot', gaps: ['חירום 24/7 — עומס'], outreachAngle: 'LeadBot מסנן חירום vs ייעוץ', status: 'prospect', priority: 'high' },
  { id: 'tlvdental', name: 'ד"ר מוחסן — מרפאת שיניים', url: 'https://tlvdental-clinic.co.il', category: 'health', industry: 'שיניים חירום', email: null, phone: '077-230-7820', whatsapp: '972525460808', recommendedTool: 'LeadBot', gaps: ['טופס + WhatsApp — כפילות'], outreachAngle: 'LeadBot מאחד ערוצים — טופס + WhatsApp', status: 'prospect', priority: 'high' },

  // ── בעלי מקצוע מקומיים ──
  { id: 'yaronplumber', name: 'ירון סלמון — אינסטלator', url: 'https://yaronplumber.co.il', category: 'trades', industry: 'אינסטלציה', email: null, phone: '050-477-7288', whatsapp: '972504777288', recommendedTool: 'LeadBot', gaps: ['עסק של אדם אחד — לא תמיד זמין'], outreachAngle: 'LeadBot עונה כשאתה בעבודה — שולח תמונה = אבחון', status: 'prospect', priority: 'high' },
  { id: 'goliger', name: 'איציק גוליגר — אינסטלator', url: 'https://www.goliger-plumbing.co.il', category: 'trades', industry: 'אינסטלציה', email: null, phone: '052-335-6360', whatsapp: '972523356360', recommendedTool: 'LeadBot', gaps: ['אנגלית+עברית — תוכן'], outreachAngle: 'LeadBot דו-לשוני + ContentFlow לשכונות', status: 'prospect', priority: 'medium' },

  // ── נדל"ן ──
  { id: 'evenis', name: 'Evenis Group', url: 'https://www.evenisgroup.com', category: 'realestate', industry: 'נדל"ן', email: null, phone: '074-757-1578', whatsapp: null, recommendedTool: 'LeadBot', gaps: ['לידים בינ"ל', 'מעקב'], outreachAngle: 'LeadBot FR/EN/HE — לידים מצרפת וישראל', status: 'prospect', priority: 'medium' },
  { id: 'zuz', name: 'ZUZ Real Estate', url: 'https://www.zuznadlan.co.il', category: 'realestate', industry: 'משרדים להשכרה', email: null, phone: '058-765-7665', whatsapp: '972587657665', recommendedTool: 'LeadBot', gaps: ['ייעוץ מורכב — סינון'], outreachAngle: 'LeadBot שואל גודל/תקציב לפני שיחה', status: 'prospect', priority: 'high' },
  { id: 'okyanus', name: 'Okyanus נכסים', url: 'https://www.okyanus.co.il', category: 'realestate', industry: 'נדל"ן מסחרי', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן אזורים', 'SEO'], outreachAngle: 'ContentFlow — פוסט לכל אזור (רothschild, Sarona...)', status: 'prospect', priority: 'medium' },
  { id: 'semerenko', name: 'Semerenko Group', url: 'https://semerenkogroup.com', category: 'realestate', industry: 'נדל"ן EN-first', email: 'hello@semerenkogroup.com', phone: '09-376-1873', whatsapp: '972525155901', recommendedTool: 'ContentFlow', gaps: ['EN-first — חסר עברית'], outreachAngle: 'ContentFlow — תוכן עברי לקהל מקומי', status: 'prospect', priority: 'medium' },

  // ── כושר ──
  { id: 'spaceclub', name: 'SPACE — מועדוני כושר', url: 'https://spaceclub.co.il', category: 'fitness', industry: 'כושר', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['טופס ארוך — בחירת סניף', 'מעקב'], outreachAngle: 'LeadBot — "איזה סניף?" + מענה מיידי', status: 'prospect', priority: 'high' },

  // ── טכנולוגיה ──
  { id: 'lemonaid', name: 'LemonAid (PinkLime)', url: 'https://pinklime.io', category: 'tech', industry: 'AI chatbots', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['מתחרה קרוב — שותפות?'], outreachAngle: 'שותפות: LeadBot ל-SMB, LemonAid ל-enterprise', status: 'prospect', priority: 'low' },

  // ── הרחבה: סוכנויות נוספות (מClutch/Sortlist ישראל) ──
  { id: 'sage', name: 'SAGE Marketing', url: 'https://sage.co.il', category: 'marketing', industry: 'שיווק', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן'], outreachAngle: 'ContentFlow ללקוחות SAGE', status: 'prospect', priority: 'medium' },
  { id: 'leos', name: 'Leos Media', url: 'https://leos.co.il', category: 'marketing', industry: 'דיגיטל', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['אתרי לקוחות'], outreachAngle: 'ConvertScan bundle ללקוחות', status: 'prospect', priority: 'medium' },
  { id: 'webz', name: 'Webz — בניית אתרים', url: 'https://webz.co.il', category: 'marketing', industry: 'בניית אתרים', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['מסירה — ציון המרה'], outreachAngle: 'ConvertScan בכל מסירת אתר', status: 'prospect', priority: 'medium' },
  { id: 'wixpartners', name: 'Wix Partners IL', url: 'https://www.wix.com', category: 'marketing', industry: 'פלטפורמה', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['אלפי אתרים — plugin'], outreachAngle: 'ConvertScan כ-Wix app', status: 'prospect', priority: 'low' },

  // ── מסחר / קמעונאות (דוגמאות) ──
  { id: 'istore', name: 'iStore Israel', url: 'https://www.istore.co.il', category: 'ecommerce', industry: 'קמעונאות אלקטרוניקה', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['נפח פניות', 'שעות'], outreachAngle: 'LeadBot לשאלות מוצר + מעקב', status: 'prospect', priority: 'medium' },
  { id: 'mashkanta', name: 'Mashkanta Win', url: 'https://mashkantawin.com', category: 'professional', industry: 'ייעוץ משכנתא', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['לידים חמים — מהירות'], outreachAngle: 'LeadBot — "כמה אתם מחפשים?" תוך דקה', status: 'prospect', priority: 'high' },
  { id: 'takecare', name: 'Take Care', url: 'https://takecar.co.il', category: 'ecommerce', industry: 'שירות רכב', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן'], outreachAngle: 'ContentFlow — טיפים שבועיים לרכב', status: 'prospect', priority: 'low' },

  // ── עוד רפואה / קlinics ──
  { id: 'medreviews', name: 'MedReviews', url: 'https://www.medreviews.co.il', category: 'health', industry: 'פלטפורמת רופאים', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['פלטפורמה — integration'], outreachAngle: 'LeadBot API לכל רופא בפלטפורמה', status: 'prospect', priority: 'medium' },
  { id: 'adenta', name: 'Adenta Clinic', url: 'https://adenta.co.il', category: 'health', industry: 'שיניים', email: null, phone: '052-428-2775', whatsapp: '972524282775', recommendedTool: 'LeadBot', gaps: ['תיאורים'], outreachAngle: 'LeadBot לתיאום + FAQ', status: 'prospect', priority: 'medium' },

  // ── עוד שיווק ──
  { id: 'topsem', name: 'TopSEM', url: 'https://topsem.co.il', category: 'marketing', industry: 'SEM', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['landing pages'], outreachAngle: 'ConvertScan לכל דף נחיתה', status: 'prospect', priority: 'medium' },
  { id: 'comstar', name: 'Comstar', url: 'https://comstar.co.il', category: 'marketing', industry: 'דיגיטל', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['לידים'], outreachAngle: 'LeadBot לסוכנות', status: 'prospect', priority: 'low' },
  { id: 'boostmedia', name: 'Boost Media', url: 'https://boostmedia.co.il', category: 'marketing', industry: 'פרסום', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן'], outreachAngle: 'ContentFlow white-label', status: 'prospect', priority: 'medium' },
  { id: 'drdigital', name: 'Dr. Digital', url: 'https://dr-digital.co.il', category: 'marketing', industry: 'שיווק רפואי', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן רפואי'], outreachAngle: 'ContentFlow לקlinics — תוכן מאושר', status: 'prospect', priority: 'medium' },
  { id: 'clickit', name: 'ClickIT', url: 'https://clickit.co.il', category: 'marketing', industry: 'Performance', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['המרות'], outreachAngle: 'LeadBot + ConvertScan bundle', status: 'prospect', priority: 'medium' },
  { id: 'optimove', name: 'Optimove', url: 'https://www.optimove.com', category: 'tech', industry: 'MarTech', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['enterprise — שותפות'], outreachAngle: 'אינטגרציה ל-SMB tier', status: 'prospect', priority: 'low' },

  // ── עוד בעלי מקצוע ──
  { id: 'electrician1', name: 'חשמלאי 24/7 TLV', url: 'https://www.electrician-tlv.co.il', category: 'trades', industry: 'חשמל', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['חירום'], outreachAngle: 'LeadBot — "שלח תמונה" לפני הגעה', status: 'prospect', priority: 'medium' },
  { id: 'locksmith', name: 'מנעולן 24 שעות', url: 'https://www.locksmith-il.co.il', category: 'trades', industry: 'מנעולנות', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['דחיפות'], outreachAngle: 'LeadBot דחוף — מיקום + סוג תקלה', status: 'prospect', priority: 'high' },

  // ── מסעדות / אירוח ──
  { id: 'rest1', name: 'מסעדות ת"א — דוגמה', url: 'https://www.rest.co.il', category: 'ecommerce', industry: 'מסעדות', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['Instagram', 'תפריט'], outreachAngle: 'ContentFlow — פוסט יומי + תפריט', status: 'prospect', priority: 'low' },

  // ── עוד CPA / משפט ──
  { id: 'lawfirm1', name: 'Rudnitzky-Drori', url: 'https://www.rudnitzky.co.il', category: 'professional', industry: 'עורכי דין', email: null, phone: '02-622-3052', whatsapp: null, recommendedTool: 'LeadBot', gaps: ['ייעוץ ראשוני'], outreachAngle: 'LeadBot — סינון תחום משפטי', status: 'prospect', priority: 'medium' },

  // ── הרחבה נוספת — סוכנויות קטנות ──
  { id: 'digitrack', name: 'DigiTrack', url: 'https://digitrack.co.il', category: 'marketing', industry: 'Analytics', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['דוחות'], outreachAngle: 'ConvertScan + analytics', status: 'prospect', priority: 'low' },
  { id: 'socialfly', name: 'SocialFly', url: 'https://socialfly.co.il', category: 'marketing', industry: 'Social', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['תוכן'], outreachAngle: 'ContentFlow ללקוחות', status: 'prospect', priority: 'medium' },
  { id: 'mediaclub', name: 'MediaClub', url: 'https://mediaclub.co.il', category: 'marketing', industry: 'מדיה', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['לידים'], outreachAngle: 'LeadBot agency', status: 'prospect', priority: 'low' },
  { id: 'webpulse', name: 'WebPulse', url: 'https://webpulse.co.il', category: 'marketing', industry: 'אתרים', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['מסירה'], outreachAngle: 'ConvertScan checklist', status: 'prospect', priority: 'medium' },
  { id: 'rankstar', name: 'RankStar SEO', url: 'https://rankstar.co.il', category: 'marketing', industry: 'SEO', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['CRO'], outreachAngle: 'SEO + ConvertScan', status: 'prospect', priority: 'medium' },
  { id: 'adwise', name: 'AdWise', url: 'https://adwise.co.il', category: 'marketing', industry: 'PPC', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['landing CRO'], outreachAngle: 'LeadBot on landing pages', status: 'prospect', priority: 'medium' },
  { id: 'contentstudio', name: 'Content Studio IL', url: 'https://contentstudio.co.il', category: 'marketing', industry: 'תוכן', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['מתחרה — שותפות'], outreachAngle: 'ContentFlow B2B supply', status: 'prospect', priority: 'low' },
  { id: 'pixelperfect', name: 'Pixel Perfect', url: 'https://pixelperfect.co.il', category: 'marketing', industry: 'עיצוב', email: null, phone: null, whatsapp: null, recommendedTool: 'ContentFlow', gaps: ['copy'], outreachAngle: 'ContentFlow + design', status: 'prospect', priority: 'low' },
  { id: 'growthhack', name: 'GrowthHack IL', url: 'https://growthhack.co.il', category: 'marketing', industry: 'Growth', email: null, phone: null, whatsapp: null, recommendedTool: 'LeadBot', gaps: ['experiments'], outreachAngle: 'LeadBot A/B', status: 'prospect', priority: 'medium' },
  { id: 'funnelpro', name: 'FunnelPro', url: 'https://funnelpro.co.il', category: 'marketing', industry: 'Funnels', email: null, phone: null, whatsapp: null, recommendedTool: 'ConvertScan', gaps: ['funnel audit'], outreachAngle: 'ConvertScan per funnel step', status: 'prospect', priority: 'medium' },
];

/** יעדים עם פרטי קשר ידועים — עדיפות לoutreach */
export function prospectsWithContact() {
  return PROSPECTS_CATALOG.filter((p) => p.email || p.phone || p.whatsapp);
}

export function prospectsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return PROSPECTS_CATALOG;
  return PROSPECTS_CATALOG.filter((p) => p.category === categoryId);
}

export function prospectsByTool(tool) {
  if (!tool || tool === 'all') return PROSPECTS_CATALOG;
  return PROSPECTS_CATALOG.filter((p) => p.recommendedTool.includes(tool));
}

export function approvedProspects() {
  return PROSPECTS_CATALOG.filter((p) => p.status === 'approved');
}

export function prospectStats() {
  const total = PROSPECTS_CATALOG.length;
  const withContact = prospectsWithContact().length;
  const approved = approvedProspects().length;
  const byCategory = PROSPECT_CATEGORIES.map((c) => ({
    ...c,
    count: PROSPECTS_CATALOG.filter((p) => p.category === c.id).length,
  }));
  const byTool = {
    LeadBot: PROSPECTS_CATALOG.filter((p) => p.recommendedTool.includes('LeadBot')).length,
    ContentFlow: PROSPECTS_CATALOG.filter((p) => p.recommendedTool.includes('ContentFlow')).length,
    ConvertScan: PROSPECTS_CATALOG.filter((p) => p.recommendedTool.includes('ConvertScan')).length,
  };
  return { total, withContact, approved, byCategory, byTool };
}

/** תאימות לאחור */
export const TARGET_BUSINESSES = PROSPECTS_CATALOG.filter((p) =>
  ['nwmedia', 'pinklime', 'localseo', 'shebossit'].includes(p.id),
).map((p) => ({
  name: p.name,
  url: p.url,
  industry: p.industry,
  strengths: [],
  gaps: p.gaps,
  recommendedTool: p.recommendedTool,
  outreachAngle: p.outreachAngle,
}));
