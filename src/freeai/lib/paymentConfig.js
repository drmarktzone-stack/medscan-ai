/**
 * Payment methods config — reads from env, no secrets in frontend except publishable keys.
 */

/** Default Bit / WhatsApp (Dr. Samer) — overridden by VITE_FREEAI_* env vars */
export const DEFAULT_BIT_PHONE = "0528885800";
export const DEFAULT_WHATSAPP = "972528885800";

export function formatBitPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("05")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone || "";
}

export function toWhatsAppIntl(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

export const PAYMENT_METHODS = {
  stripe: {
    id: "stripe",
    nameHe: "כרטיס אשראי",
    nameEn: "Credit card",
    icon: "💳",
    descHe: "Visa, Mastercard, Apple Pay — חיוב חודשי אוטומטי",
    descEn: "Visa, Mastercard, Apple Pay — auto monthly billing",
    recurring: true,
    recommended: true,
  },
  bit: {
    id: "bit",
    nameHe: "Bit",
    nameEn: "Bit",
    icon: "🟣",
    descHe: "תשלום מהיר בישראל — העבר ₪20 + שלח אישור",
    descEn: "Fast payment in Israel — send ₪20 + confirmation",
    recurring: false,
  },
  paypal: {
    id: "paypal",
    nameHe: "PayPal",
    nameEn: "PayPal",
    icon: "🅿️",
    descHe: "PayPal / חשבון בינלאומי",
    descEn: "PayPal / international account",
    recurring: true,
  },
  whatsapp: {
    id: "whatsapp",
    nameHe: "WhatsApp + Bit",
    nameEn: "WhatsApp + Bit",
    icon: "💬",
    descHe: "שלם ב-Bit ושלח צילום — נפעיל תוך שעה",
    descEn: "Pay via Bit, send screenshot — activated within 1 hour",
    recurring: false,
  },
};

export function getPaymentConfig() {
  const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
  const bitPhone = env.VITE_FREEAI_BIT_PHONE || DEFAULT_BIT_PHONE;
  const whatsapp = env.VITE_FREEAI_SUPPORT_WHATSAPP || DEFAULT_WHATSAPP;
  return {
    stripeUrl: env.VITE_FREEAI_STRIPE_URL || env.VITE_FREEAI_PAYMENT_URL || null,
    bitUrl: env.VITE_FREEAI_BIT_URL || null,
    bitPhone,
    bitPhoneFormatted: formatBitPhone(bitPhone),
    paypalUrl: env.VITE_FREEAI_PAYPAL_URL || null,
    whatsapp: toWhatsAppIntl(whatsapp || bitPhone),
    supportEmail: env.VITE_FREEAI_SUPPORT_EMAIL || null,
    priceIls: 20,
  };
}

/** Opens Bit app on mobile or bit.co.il on desktop */
export function getBitOpenUrl() {
  return "https://bit.co.il/";
}

export function getAvailableMethods() {
  const cfg = getPaymentConfig();
  const available = [];

  if (cfg.stripeUrl) available.push({ ...PAYMENT_METHODS.stripe, url: cfg.stripeUrl });
  if (cfg.bitUrl || cfg.bitPhone) {
    available.push({
      ...PAYMENT_METHODS.bit,
      url: cfg.bitUrl || `https://bit.co.il/`,
      phone: cfg.bitPhone,
    });
  }
  if (cfg.paypalUrl) available.push({ ...PAYMENT_METHODS.paypal, url: cfg.paypalUrl });
  if (cfg.whatsapp || cfg.bitPhone) {
    available.push({ ...PAYMENT_METHODS.whatsapp, phone: cfg.whatsapp || cfg.bitPhone });
  }

  return available;
}

export function isPaymentConfigured() {
  return getAvailableMethods().length > 0;
}

/** WhatsApp message after Bit payment */
export function buildPaymentConfirmWhatsApp(email, method = "bit") {
  const cfg = getPaymentConfig();
  const phone = toWhatsAppIntl(cfg.whatsapp || cfg.bitPhone);
  const text = encodeURIComponent(
    `שלום! שילמתי ₪20 ל-FreeAI Hub Pro.\nמייל: ${email}\nאמצעי: ${method}\nאנא הפעילו את Pro שלי 🙏`
  );
  return phone ? `https://wa.me/${phone}?text=${text}` : null;
}

/** mailto for payment support */
export function buildPaymentSupportEmail(email) {
  const cfg = getPaymentConfig();
  if (!cfg.supportEmail) return null;
  const subject = encodeURIComponent("FreeAI Hub Pro — אישור תשלום ₪20");
  const body = encodeURIComponent(`שילמתי ₪20 עבור Pro.\nמייל: ${email}\n`);
  return `mailto:${cfg.supportEmail}?subject=${subject}&body=${body}`;
}

export function getSetupInstructions(locale = "he") {
  if (locale === "he") {
    return {
      title: "איך להפעיל תשלום (5 דקות)",
      steps: [
        { n: 1, text: "צור חשבון Stripe חינם: stripe.com/il" },
        { n: 2, text: "Products → Add product → ₪20/month recurring" },
        { n: 3, text: "Payment Links → Create link → העתק URL" },
        { n: 4, text: "הוסף ל-.env.local: VITE_FREEAI_STRIPE_URL=https://buy.stripe.com/..." },
        { n: 5, text: "npm run build && deploy" },
      ],
      bitSteps: [
        "פתח Bit → קבל תשלום → צור קישור ₪20",
        "הוסף: VITE_FREEAI_BIT_PHONE=0501234567",
        "הוסף: VITE_FREEAI_SUPPORT_WHATSAPP=972501234567",
      ],
    };
  }
  return {
    title: "How to enable payments (5 min)",
    steps: [
      { n: 1, text: "Create free Stripe account: stripe.com" },
      { n: 2, text: "Products → Add product → ₪20/month recurring" },
      { n: 3, text: "Payment Links → Create link → Copy URL" },
      { n: 4, text: "Add to .env.local: VITE_FREEAI_STRIPE_URL=https://buy.stripe.com/..." },
      { n: 5, text: "npm run build && deploy" },
    ],
  };
}
