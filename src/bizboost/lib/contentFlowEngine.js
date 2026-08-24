/**
 * ContentFlow — מנוע יצירת תוכן שיווקי דו-לשוני
 */

const CHANNEL_SPECS = {
  instagram: { maxChars: 2200, hashtags: 15, tone: 'visual' },
  facebook: { maxChars: 500, hashtags: 5, tone: 'community' },
  linkedin: { maxChars: 1300, hashtags: 5, tone: 'professional' },
  google_ads: { maxChars: 90, hashtags: 0, tone: 'direct' },
  whatsapp_status: { maxChars: 700, hashtags: 3, tone: 'personal' },
  blog: { maxChars: 3000, hashtags: 0, tone: 'educational' },
};

const INDUSTRY_HASHTAGS = {
  marketing: { he: ['#שיווקדיגיטלי', '#עסקיםקטנים', '#ישראל', '#לידים', '#SEO'], en: ['#DigitalMarketing', '#SmallBusiness', '#Israel', '#LeadGen', '#SEO'] },
  clinic: { he: ['#בריאות', '#רפואה', '#משפחה', '#ישראל'], en: ['#Healthcare', '#Family', '#Israel'] },
  ecommerce: { he: ['#קניות', '#מבצע', '#ישראל', '#אונליין'], en: ['#Shopping', '#Sale', '#Online', '#Israel'] },
  services: { he: ['#שירות', '#מקצועי', '#ישראל', '#עסקים'], en: ['#Services', '#Professional', '#Israel', '#Business'] },
  default: { he: ['#עסקים', '#ישראל', '#יזמות'], en: ['#Business', '#Israel', '#Startup'] },
};

const CONTENT_ANGLES = [
  { id: 'pain', labelHe: 'כאב + פתרון', hookHe: 'מכירים את התחושה כש{problem}?', hookEn: 'Ever feel stuck when {problem}?' },
  { id: 'social_proof', labelHe: 'הוכחה חברתית', hookHe: '{number}+ לקוחות כבר {result}', hookEn: '{number}+ clients already {result}' },
  { id: 'tip', labelHe: 'טיפ מעשי', hookHe: 'טיפ #{tip_num}: {tip}', hookEn: 'Tip #{tip_num}: {tip}' },
  { id: 'cta', labelHe: 'קריאה לפעולה', hookHe: 'מוכנים ל{action}? {cta}', hookEn: 'Ready to {action}? {cta}' },
];

function pickAngle(seed) {
  return CONTENT_ANGLES[seed % CONTENT_ANGLES.length];
}

/**
 * @param {object} input
 */
export function generateContent(input) {
  const {
    businessName = 'העסק',
    industry = 'default',
    channel = 'instagram',
    language = 'both',
    topic = '',
    cta = 'לחצו לפרטים',
    socialProofNumber = 150,
    tipText = 'ענו ללידים תוך 5 דקות',
  } = input;

  const spec = CHANNEL_SPECS[channel] || CHANNEL_SPECS.instagram;
  const tags = INDUSTRY_HASHTAGS[industry] || INDUSTRY_HASHTAGS.default;
  const angle = pickAngle(businessName.length + (topic?.length || 0));
  const problem = topic || 'הלידים לא חוזרים אליכם';

  const vars = {
    problem,
    number: socialProofNumber,
    result: 'הגדילו את ההמרות',
    tip_num: 1,
    tip: tipText,
    action: 'לצמוח',
    cta,
    business: businessName,
  };

  const hookHe = angle.hookHe.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  const hookEn = angle.hookEn.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

  const bodyHe = buildBodyHe({ businessName, topic, cta, channel, angle: angle.id });
  const bodyEn = buildBodyEn({ businessName, topic, cta, channel, angle: angle.id });

  const hashtagsHe = tags.he.slice(0, spec.hashtags).join(' ');
  const hashtagsEn = tags.en.slice(0, spec.hashtags).join(' ');

  const postHe = truncate(`${hookHe}\n\n${bodyHe}\n\n${cta} 👇\n\n${hashtagsHe}`, spec.maxChars);
  const postEn = truncate(`${hookEn}\n\n${bodyEn}\n\n${cta} 👇\n\n${hashtagsEn}`, spec.maxChars);

  const adHeadlines = generateAdHeadlines({ businessName, topic, cta });
  const blogOutline = generateBlogOutline({ businessName, topic, industry });
  const calendar = generateWeekCalendar({ businessName, industry, topic });

  return {
    channel,
    spec,
    angle: angle.labelHe,
    hebrew: language === 'en' ? null : { hook: hookHe, body: bodyHe, post: postHe, hashtags: hashtagsHe },
    english: language === 'he' ? null : { hook: hookEn, body: bodyEn, post: postEn, hashtags: hashtagsEn },
    adHeadlines,
    blogOutline,
    calendar,
    generatedAt: new Date().toISOString(),
  };
}

function buildBodyHe({ businessName, topic, cta, channel, angle }) {
  const lines = {
    pain: [`ב-${businessName} אנחנו רואים את זה כל יום.`, topic ? `הנושא: ${topic}` : 'הפתרון מתחיל בשינוי קטן.', `בואו נדבר — ${cta}.`],
    social_proof: [`התוצאות מדברות בעד עצמן.`, `לקוחות שלנו מדווחים על שיפור משמעותי.`, cta],
    tip: [`טיפ שעובד ב-${channel === 'linkedin' ? 'B2B' : 'עסקים קטנים'}:`, topic || 'ענו מהר, סננו נכון, עקבו אחרי כל ליד.', cta],
    cta: [topic || 'הגיע הזמן לקחת את העסק לשלב הבא.', `צוות ${businessName} מחכה לשמוע מכם.`, cta],
  };
  return (lines[angle] || lines.pain).join('\n');
}

function buildBodyEn({ businessName, topic, cta, channel, angle }) {
  void channel;
  const lines = {
    pain: [`At ${businessName}, we see this every day.`, topic ? `Topic: ${topic}` : 'The fix starts with one small change.', `Let's talk — ${cta}.`],
    social_proof: [`Results speak for themselves.`, `Our clients report measurable growth.`, cta],
    tip: [`A tip that works:`, topic || 'Reply fast, qualify well, follow up every lead.', cta],
    cta: [topic || 'Time to take your business to the next level.', `${businessName} is ready when you are.`, cta],
  };
  return (lines[angle] || lines.pain).join('\n');
}

function generateAdHeadlines({ businessName, topic, cta }) {
  return [
    { he: `${businessName} — ${topic || 'פתרון שעובד'}`, en: `${businessName} — ${topic || 'Solutions that work'}`, chars: 30 },
    { he: cta.slice(0, 25), en: 'Book a free consult', chars: 25 },
    { he: 'ייעוץ חינם | תוצאות מדידות', en: 'Free consult | Measurable ROI', chars: 30 },
  ];
}

function generateBlogOutline({ businessName, topic, industry }) {
  const title = topic || `איך ${businessName} עוזרים לעסקים ב${industryLabel(industry)} לצמוח`;
  return {
    titleHe: title,
    titleEn: topic ? `${topic} — A practical guide` : `How ${businessName} helps businesses grow`,
    sections: [
      { he: 'הבעיה שרוב העסקים מתעלמים ממנה', en: 'The problem most businesses ignore' },
      { he: '3 צעדים מעשיים ליישום היום', en: '3 practical steps you can take today' },
      { he: 'דוגמאות מהשטח', en: 'Real-world examples' },
      { he: 'סיכום + CTA', en: 'Summary + next steps' },
    ],
    metaDescriptionHe: `${title} — מדריך מעשי מ-${businessName}.`,
    metaDescriptionEn: `${topic || 'Growth guide'} by ${businessName}.`,
  };
}

function generateWeekCalendar({ businessName, industry, topic }) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
  const themes = ['טיפ מעשי', 'הוכחה חברתית', 'שאלה לקהילה', 'מאחורי הקלעים', 'מבצע/CTA'];
  return days.map((day, i) => ({
    day,
    theme: themes[i],
    suggestionHe: `${themes[i]}: ${topic || businessName} — ${industryLabel(industry)}`,
    channel: i % 2 === 0 ? 'instagram' : 'facebook',
  }));
}

function industryLabel(industry) {
  const map = { marketing: 'שיווק', clinic: 'בריאות', ecommerce: 'מסחר', services: 'שירותים', default: 'עסקים' };
  return map[industry] || map.default;
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

export { CHANNEL_SPECS, CONTENT_ANGLES };
