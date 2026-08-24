export const PRODUCT_NAME = 'AgentReceipt';

export const PRODUCT_TAGLINE_HE = 'הוכחת סיום לסוכני AI — build, tests, handoff.';

export const PRODUCT_TAGLINE_EN = 'Proof-of-done for AI agents — build, tests, handoff.';

/** Pricing in ILS — no payment processor wired yet; waitlist captures intent. */
export const PRICING_PLANS = Object.freeze([
  {
    id: 'oss',
    name_he: 'קוד פתוח',
    name_en: 'Open Source',
    price_ils: 0,
    period_he: 'לנצח',
    features_he: [
      'סכמת Receipt v0',
      'CLI: verify, submit, gate, status',
      'Ledger מקומי (.agentreceipt/)',
      'אינטגרציה ל-prompts/inbox',
    ],
    cta_he: 'התחל בחינם',
    highlight: false,
  },
  {
    id: 'team',
    name_he: 'צוות',
    name_en: 'Team',
    price_ils: 149,
    period_he: 'לחודש',
    features_he: [
      'Ledger משותף (ענן)',
      'Gate ב-CI (GitHub Actions)',
      'דשבורד web',
      'עד 5 סוכנים / repos',
      'תמיכה במייל',
    ],
    cta_he: 'הצטרף ל-waitlist',
    highlight: true,
  },
  {
    id: 'compliance',
    name_he: 'Compliance',
    name_en: 'Compliance',
    price_ils: 490,
    period_he: 'לחודש',
    features_he: [
      'Audit trail מלא',
      'RBAC + retention',
      'Wedge רפואי / MedScan',
      'SLA + onboarding',
    ],
    cta_he: 'דבר איתנו',
    highlight: false,
  },
]);
