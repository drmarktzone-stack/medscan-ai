import {
  getPaymentConfig,
  getBitOpenUrl,
  formatBitPhone,
  toWhatsAppIntl,
} from "@/freeai/lib/paymentConfig.js";
import { PRICING_PLANS } from "@/lib/agentreceipt/browser.js";

export const TEAM_PLAN = PRICING_PLANS.find((p) => p.id === "team") ?? { price_ils: 149 };
export const COMPLIANCE_PLAN = PRICING_PLANS.find((p) => p.id === "compliance") ?? { price_ils: 490 };

/**
 * WhatsApp deep link — customer initiates Team purchase.
 */
export function buildTeamSalesWhatsApp({ email = "", note = "", planId = "team" } = {}) {
  const cfg = getPaymentConfig();
  const phone = toWhatsAppIntl(cfg.whatsapp || cfg.bitPhone);
  if (!phone) return null;
  const plan = planId === "compliance" ? COMPLIANCE_PLAN : TEAM_PLAN;
  const lines = [
    "שלום, אני רוצה AgentReceipt",
    `חבילה: ${planId === "compliance" ? "Compliance" : "Team"} — ₪${plan.price_ils}/חודש`,
    email ? `מייל: ${email}` : null,
    note ? `שימוש: ${note}` : null,
    "",
    "אשלח אישור Bit אחרי ההעברה.",
  ].filter(Boolean);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export { getPaymentConfig, getBitOpenUrl, formatBitPhone };
