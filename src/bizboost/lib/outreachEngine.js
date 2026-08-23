/**
 * BizBoost — מנוע הודעות שיווק ומכירה
 */

import { FREE_PAYMENT_CONFIG } from '../data/paymentMethods.js';
import { STANDALONE_SERVICES, PRICING_PLANS } from '../data/researchCore.js';
import { SELLER } from '../data/sellerIdentity.js';
import { BIZBOOST_HOME } from './marketing.js';

const BIT = FREE_PAYMENT_CONFIG.bit.phone;
const BANK = FREE_PAYMENT_CONFIG.bank;

function primaryTool(recommendedTool) {
  if (recommendedTool.includes('ConvertScan')) return 'ConvertScan';
  if (recommendedTool.includes('ContentFlow') && !recommendedTool.includes('LeadBot')) return 'ContentFlow';
  if (recommendedTool.includes('LeadBot') && recommendedTool.includes('ContentFlow')) return 'Growth';
  return 'LeadBot';
}

function priceForTool(tool) {
  if (tool === 'Growth') return PRICING_PLANS.find((p) => p.id === 'growth');
  if (tool === 'ConvertScan') return STANDALONE_SERVICES.find((s) => s.id === 'convertscan');
  if (tool === 'ContentFlow') return STANDALONE_SERVICES.find((s) => s.id === 'contentflow');
  return STANDALONE_SERVICES.find((s) => s.id === 'leadbot');
}

/**
 * @param {object} prospect
 */
export function buildOutreachMessage(prospect) {
  const tool = primaryTool(prospect.recommendedTool || 'LeadBot');
  const pricing = priceForTool(tool);
  const priceLabel = pricing ? `₪${pricing.price}/חודש` : '₪299–999/חודש';
  const productName = tool === 'Growth' ? 'LeadBot + ContentFlow (Growth)' : tool;

  const whatsappBody =
    `שלום ${prospect.name} 👋\n\n` +
    `בדקתי את ${prospect.url} — ${prospect.outreachAngle}.\n\n` +
    `BizBoost AI: ${productName}\n` +
    `• 14 יום ניסיון חינם\n` +
    `• אחר כך ${priceLabel}\n` +
    `• תשלום ב-Bit ל-${BIT} או העברה (הפועלים ${BANK.branch} ח-ן ${BANK.account})\n\n` +
    `רוצים דמו קצר / להתחיל ניסיון?\n` +
    `${SELLER.nameHe} — BizBoost AI\n` +
    `WhatsApp/Bit: ${SELLER.phoneDisplay}\n` +
    `מייל: ${SELLER.email}`;

  const emailSubject = `${prospect.name} — ${productName} ל-${prospect.industry} (14 יום חינם)`;

  const emailBody =
    `שלום צוות ${prospect.name},\n\n` +
    `אני ${SELLER.nameHe} מ-BizBoost AI (${SELLER.email}). בדקתי את ${prospect.url}.\n\n` +
    `הפער שזיהיתי: ${(prospect.gaps || []).join(', ') || 'מענה ללידים / תוכן / המרות'}.\n` +
    `${prospect.outreachAngle}\n\n` +
    `הפתרון המומלץ: ${productName} — ${priceLabel}\n` +
    `14 יום ניסיון חינם, אחר כך תשלום ב-Bit (${BIT}) או העברה בנקאית.\n\n` +
    `פרטי העברה:\n` +
    `${BANK.bankName} · סניף ${BANK.branch} · ח-ן ${BANK.account} · ${BANK.accountHolder}\n\n` +
    `אשמח לשיחה קצרה / שליחת דמו.\n\n` +
    `בברכה,\n${SELLER.nameHe}\nBizBoost AI\n${SELLER.email}\nWhatsApp: ${BIT}`;

  const smsBody =
    `שלום ${prospect.name}, BizBoost AI — ${productName}. ` +
    `14 יום חינם, אחר כך ${priceLabel}. Bit: ${BIT}. ${SELLER.nameHe} ${SELLER.email}`;

  const waPhone = prospect.whatsapp || (prospect.phone ? phoneToWa(prospect.phone) : null);
  const whatsappUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappBody)}`
    : null;
  const mailtoUrl = prospect.email
    ? `mailto:${prospect.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;
  const telUrl = prospect.phone ? `tel:${prospect.phone.replace(/[^\d+]/g, '')}` : null;

  return {
    prospectId: prospect.id,
    name: prospect.name,
    tool: productName,
    priceLabel,
    priority: prospect.priority,
    whatsappBody,
    emailSubject,
    emailBody,
    smsBody,
    whatsappUrl,
    mailtoUrl,
    telUrl,
    hasWhatsApp: Boolean(waPhone),
    hasEmail: Boolean(prospect.email),
    hasPhone: Boolean(prospect.phone),
  };
}

function phoneToWa(phone) {
  let d = String(phone).replace(/\D/g, '');
  if (d.startsWith('0')) d = `972${d.slice(1)}`;
  if (d.length >= 10) return d;
  return null;
}

export function buildOutreachBatch(prospects) {
  return prospects
    .filter((p) => p.email || p.phone || p.whatsapp)
    .map(buildOutreachMessage)
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
    });
}

/**
 * מייל B2B פורמלי לחברות גדולות — לא WhatsApp / לא Facebook
 * @param {object} prospect
 */
export function buildEnterpriseOutreachMessage(prospect) {
  const tool = primaryTool(prospect.recommendedTool || 'LeadBot');
  const pricing = priceForTool(tool);
  const priceLabel = pricing ? `₪${pricing.price}/חודש` : '₪599–999/חודש';
  const productName = tool === 'Growth' ? 'LeadBot + ContentFlow (Growth)' : tool;
  const home = BIZBOOST_HOME();
  const role = prospect.contactRole || 'צוות השותפויות / השיווק';

  const emailSubject =
    `הצעת שיתוף BizBoost AI × ${prospect.name} — ${productName} ל-${prospect.industry}`;

  const emailBody =
    `שלום ${role},\n\n` +
    `שמי ${SELLER.nameHe}, BizBoost AI (${SELLER.email}).\n\n` +
    `עקבתי אחרי ${prospect.name} (${prospect.url}) וזיהיתי הזדמנות:\n` +
    `${prospect.outreachAngle}\n\n` +
    `פערים רלוונטיים: ${(prospect.gaps || []).join(' · ') || 'מענה ללידים / תוכן / המרות'}.\n\n` +
    `BizBoost AI מציע 3 כלי AI לעסקים:\n` +
    `• LeadBot — מענה WhatsApp/טופס תוך 30 שניות\n` +
    `• ContentFlow — תוכן שיווקי דו-לשוני (עברית + אנגלית)\n` +
    `• ConvertScan — ביקורת המרה לאתר (HTML / URL)\n\n` +
    `המוצר המומלץ ל-${prospect.name}: ${productName}\n` +
    `מחיר לעסק בודד: ${priceLabel} · 14 יום ניסיון חינם\n` +
    `לשותפות / white-label / volume — נשמח להציע תמחור מותאם.\n\n` +
    `דמו חי: ${home}\n\n` +
    `אשמח לשיחת Zoom קצרה (15 דק׳) או לשלוח deck.\n\n` +
    `בברכה,\n` +
    `${SELLER.nameHe}\n` +
    `BizBoost AI\n` +
    `${SELLER.email} · WhatsApp ${SELLER.phoneDisplay}\n` +
    `Bit לתשלום: ${BIT}`;

  const mailtoUrl = prospect.email
    ? `mailto:${prospect.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;

  return {
    prospectId: prospect.id,
    name: prospect.name,
    email: prospect.email,
    url: prospect.url,
    employees: prospect.employees,
    tool: productName,
    priceLabel,
    priority: prospect.priority,
    tier: 'enterprise',
    emailSubject,
    emailBody,
    mailtoUrl,
    hasEmail: Boolean(prospect.email),
    hasWhatsApp: false,
    whatsappUrl: null,
  };
}

export function buildEnterpriseOutreachBatch(prospects) {
  return prospects
    .filter((p) => p.email)
    .map(buildEnterpriseOutreachMessage)
    .sort((a, b) => {
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
    });
}

const OUTREACH_STATUS_KEY = 'bizboost_outreach_status';

export function loadOutreachStatus() {
  try {
    return JSON.parse(localStorage.getItem(OUTREACH_STATUS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveOutreachStatus(map) {
  localStorage.setItem(OUTREACH_STATUS_KEY, JSON.stringify(map));
}

export function markOutreach(prospectId, status) {
  const map = loadOutreachStatus();
  map[prospectId] = { status, at: new Date().toISOString() };
  saveOutreachStatus(map);
  return map;
}
