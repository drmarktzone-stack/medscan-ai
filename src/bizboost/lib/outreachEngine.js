/**
 * BizBoost — מנוע הודעות שיווק ומכירה
 */

import { FREE_PAYMENT_CONFIG } from '../data/paymentMethods.js';
import { STANDALONE_SERVICES, PRICING_PLANS } from '../data/researchCore.js';

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
    `סאמר — BizBoost AI`;

  const emailSubject = `${prospect.name} — ${productName} ל-${prospect.industry} (14 יום חינם)`;

  const emailBody =
    `שלום צוות ${prospect.name},\n\n` +
    `אני סאמר מ-BizBoost AI. בדקתי את ${prospect.url}.\n\n` +
    `הפער שזיהיתי: ${(prospect.gaps || []).join(', ') || 'מענה ללידים / תוכן / המרות'}.\n` +
    `${prospect.outreachAngle}\n\n` +
    `הפתרון המומלץ: ${productName} — ${priceLabel}\n` +
    `14 יום ניסיון חינם, אחר כך תשלום ב-Bit (${BIT}) או העברה בנקאית.\n\n` +
    `פרטי העברה:\n` +
    `${BANK.bankName} · סניף ${BANK.branch} · ח-ן ${BANK.account} · ${BANK.accountHolder}\n\n` +
    `אשמח לשיחה קצרה / שליחת דמו.\n\n` +
    `בברכה,\nסאמר\nBizBoost AI\nWhatsApp: ${BIT}`;

  const smsBody =
    `שלום ${prospect.name}, BizBoost AI — ${productName} מתאים לכם (${prospect.outreachAngle}). ` +
    `14 יום חינם, אחר כך ${priceLabel}. Bit: ${BIT}. סאמר`;

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
