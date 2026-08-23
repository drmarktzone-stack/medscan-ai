/**
 * LeadBot — מנוע מענה AI ללידים (עובד במכשיר, ללא שרת)
 */

const INDUSTRY_TEMPLATES = {
  marketing: {
    greeting: 'שלום {name}! 👋 תודה שפניתם ל-{business}. קיבלנו את הפנייה שלכם.',
    qualify: ['מה השירות שמעניין אתכם?', 'מה גודל העסק (עובדים)?', 'מתי נוח לשיחת ייעוץ קצרה?'],
    urgency: 'high',
  },
  clinic: {
    greeting: 'שלום {name}, תודה שפניתם ל-{business}. נשמח לעזור.',
    qualify: ['מה סיבת הפנייה?', 'האם זו פנייה דחופה?', 'מתי נוח לתיאום תור?'],
    urgency: 'medium',
  },
  ecommerce: {
    greeting: 'היי {name}! 🛒 תודה שפניתם ל-{business}.',
    qualify: ['מה המוצר שמעניין אתכם?', 'יש לכם שאלה לגבי משלוח/החזרה?', 'רוצים קישור ישיר להזמנה?'],
    urgency: 'medium',
  },
  services: {
    greeting: 'שלום {name}, תודה על הפנייה ל-{business}.',
    qualify: ['באיזה אזור אתם נמצאים?', 'מה היקף הפרויקט?', 'מתי תרצו להתחיל?'],
    urgency: 'medium',
  },
  default: {
    greeting: 'שלום {name}! תודה שפניתם ל-{business}.',
    qualify: ['מה מטרת הפנייה?', 'איך נוח לכם שנחזור — WhatsApp או טלפון?', 'מתי נוח לכם?'],
    urgency: 'medium',
  },
};

const FOLLOW_UP_SEQUENCE = [
  { day: 0, label: 'מיידי (0–5 דקות)', template: '{greeting}\n\n{qualify_q1}\n\nנחזור אליכם תוך {sla}.' },
  { day: 1, label: 'יום +1', template: 'היי {name}, רק מוודאים שקיבלתם את ההודעה שלנו 😊\nעדיין רלוונטי? {qualify_q2}' },
  { day: 3, label: 'יום +3', template: 'שלום {name},\nרצינו לשתף: {social_proof}\nמוכנים לשיחה קצרה? {cta}' },
  { day: 7, label: 'יום +7 (סגירה רכה)', template: 'היי {name}, נראה שהתזמון לא מתאים כרגע — אין בעיה!\nכשתרצו, אנחנו כאן. {cta}' },
];

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function scoreLead({ budget, urgency, responseTime, hasPhone }) {
  let score = 50;
  if (budget === 'high') score += 25;
  if (budget === 'medium') score += 10;
  if (urgency === 'urgent') score += 20;
  if (urgency === 'this_week') score += 10;
  if (responseTime === 'immediate') score += 15;
  if (hasPhone) score += 10;
  return Math.min(100, score);
}

function leadTier(score) {
  if (score >= 80) return { tier: 'hot', label: '🔥 ליד חם', color: 'text-red-600' };
  if (score >= 60) return { tier: 'warm', label: '🌡️ ליד חמים', color: 'text-amber-600' };
  return { tier: 'cold', label: '❄️ ליד קר', color: 'text-slate-500' };
}

/**
 * @param {object} input
 * @param {string} input.businessName
 * @param {string} input.industry
 * @param {string} input.leadName
 * @param {string} input.leadMessage
 * @param {string} input.budget - low|medium|high
 * @param {string} input.urgency - low|this_week|urgent
 * @param {string} input.responseTime - immediate|hours|next_day
 * @param {boolean} input.hasPhone
 * @param {string} [input.socialProof]
 * @param {string} [input.cta]
 */
export function generateLeadResponse(input) {
  const {
    businessName = 'העסק שלכם',
    industry = 'default',
    leadName = 'לקוח',
    leadMessage = '',
    budget = 'medium',
    urgency = 'this_week',
    responseTime = 'immediate',
    hasPhone = true,
    socialProof = '150+ לקוחות מרוצים',
    cta = 'לחצו כאן לתיאום שיחה',
    slaMinutes = 15,
  } = input;

  const tpl = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES.default;
  const vars = {
    name: leadName,
    business: businessName,
    sla: `${slaMinutes} דקות`,
    social_proof: socialProof,
    cta,
    qualify_q1: tpl.qualify[0],
    qualify_q2: tpl.qualify[1] || tpl.qualify[0],
    qualify_q3: tpl.qualify[2] || tpl.qualify[0],
  };

  const greeting = fill(tpl.greeting, vars);
  const score = scoreLead({ budget, urgency, responseTime, hasPhone });
  const tier = leadTier(score);

  const instantReply = fill(FOLLOW_UP_SEQUENCE[0].template, { ...vars, greeting });

  const followUps = FOLLOW_UP_SEQUENCE.map((step) => ({
    day: step.day,
    label: step.label,
    message: fill(step.template, { ...vars, greeting }),
  }));

  const whatsappUrl = buildWhatsAppLink({
    phone: input.businessPhone || '972500000000',
    message: instantReply,
  });

  const insights = [];
  if (!hasPhone) insights.push('הוסיפו שדה טלפון — לידים עם טלפון נסגרים פי 3 מהר יותר');
  if (responseTime !== 'immediate') insights.push('הגדירו מענה אוטומטי מיידי — 78% מהלקוחות בוחרים במי שעונה ראשון');
  if (leadMessage.length < 10) insights.push('בקשו פרט נוסף בהודעה הראשונה — מסנן לידים רלוונטיים');

  return {
    score,
    tier,
    instantReply,
    qualificationQuestions: tpl.qualify,
    followUps,
    whatsappUrl,
    insights,
    detectedIntent: detectIntent(leadMessage),
    generatedAt: new Date().toISOString(),
  };
}

function detectIntent(message) {
  const m = (message || '').toLowerCase();
  if (/מחיר|עלות|כמה|price|cost/.test(m)) return { intent: 'pricing', confidence: 0.9 };
  if (/דחוף|urgent|היום|עכשיו/.test(m)) return { intent: 'urgent', confidence: 0.85 };
  if (/ייעוץ|consult|שיחה|call/.test(m)) return { intent: 'consultation', confidence: 0.8 };
  if (/מידע|info|פרטים/.test(m)) return { intent: 'info', confidence: 0.7 };
  return { intent: 'general', confidence: 0.5 };
}

export function buildWhatsAppLink({ phone, message }) {
  const clean = String(phone).replace(/\D/g, '');
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}

export { INDUSTRY_TEMPLATES, FOLLOW_UP_SEQUENCE };
