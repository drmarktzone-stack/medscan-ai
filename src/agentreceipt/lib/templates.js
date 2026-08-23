/**
 * Ready-to-copy sales & outreach templates for AgentReceipt.
 * Used by marketing page and LAUNCH docs.
 */

export const LIVE = {
  home: "https://drmarktzone-stack.github.io/medscan-ai/agentreceipt",
  checkout: "https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/checkout",
  marketing: "https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/marketing",
  docs: "https://drmarktzone-stack.github.io/medscan-ai/agentreceipt/docs",
  bitPhone: "052-888-5800",
  bitPhoneRaw: "0528885800",
};

/** Dr replies AFTER customer sends Bit screenshot */
export const WHATSAPP_REPLIES = Object.freeze([
  {
    id: "ack_payment",
    titleHe: "1. קיבלתי תשלום",
    text: `קיבלתי את אישור ה-Bit ✅
תודה!

מפעיל לך AgentReceipt Team עכשיו.
מייל לחשבון: (אשר/י את המייל ששלחת)

תיעוד להתחלה:
${LIVE.docs}

CLI:
npm run agentreceipt:verify -- --task my-task --agent cursor-cloud

אם משהו לא ברור — כתוב/י כאן.`,
  },
  {
    id: "ask_email",
    titleHe: "2. חסר מייל",
    text: `קיבלתי את ה-Bit ✅
רק חסר לי המייל לחשבון Team — שלח/י בבקשה.`,
  },
  {
    id: "onboard_team",
    titleHe: "3. Onboarding אחרי הפעלה",
    text: `Team הופעל ✅

צעדים:
1. פתח: ${LIVE.docs}
2. אחרי כל סוכן AI:
   node scripts/agentreceipt.mjs verify --task NAME --agent AGENT
3. לפני handoff לסוכן הבא:
   node scripts/agentreceipt.mjs gate --task NEXT --requires PREV

שאלות? כאן.`,
  },
  {
    id: "wrong_amount",
    titleHe: "4. סכום לא מדויק",
    text: `קיבלתי העברה — הסכום לא תואם לחבילה.
Team = ₪149 · Compliance = ₪490

מה התכוונת לרכוש? אשלים / אחזיר הפרש לפי הצורך.`,
  },
  {
    id: "not_yet_paid",
    titleHe: "5. פנייה בלי תשלום",
    text: `היי! לשדרוג Team:
1. ${LIVE.checkout}
2. העבר/י ₪149 ב-Bit ל-${LIVE.bitPhone}
3. שלח/י צילום מסך כאן

חינם להתחלה: ${LIVE.docs}`,
  },
]);

/** Broadcast to groups / friends */
export const BROADCASTS = Object.freeze([
  {
    id: "wa_he_short",
    titleHe: "WhatsApp קצר",
    text: `AgentReceipt — כשסוכן AI אומר "סיימתי", יש סוף סוף הוכחה.

Receipt + gate אחרי Cursor / Cloud.
build נכשל → handoff חסום.

חינם: ${LIVE.home}
Team ₪149: ${LIVE.checkout}`,
  },
  {
    id: "wa_he_long",
    titleHe: "WhatsApp מפורט",
    text: `היי 👋

בניתי כלי קטן אבל כואב: AgentReceipt.

הבעיה: Cursor / Cloud Agent אומרים "סיימתי" — בלי JSON, בלי build, בלי gate לסוכן הבא.

הפתרון:
• מריצים verify
• שומרים Receipt מובנה
• סוכן B לא מתחיל אם A נכשל

חינם (OSS): ${LIVE.home}
Team (Bit): ${LIVE.checkout}

אשמח לפידבק / שיתוף.`,
  },
  {
    id: "x_he",
    titleHe: "X / Twitter עברית",
    text: `AgentReceipt — proof-of-done לסוכני AI.

Receipt אחרי כל סוכן. build נכשל → handoff חסום.

${LIVE.home}`,
  },
  {
    id: "x_en",
    titleHe: "X / Twitter English",
    text: `AgentReceipt — proof-of-done for AI coding agents (Cursor/Cloud).

Structured JSON receipt + verification gate. Failed build → next agent blocked.

Free OSS: ${LIVE.home}`,
  },
  {
    id: "linkedin_en",
    titleHe: "LinkedIn English",
    text: `Shipping AgentReceipt — a small but painful gap in multi-agent workflows.

When a Cursor/Cloud agent says "done", there's often no machine-readable proof that build/tests passed. The next agent (or human) inherits broken work.

AgentReceipt:
• runs verification
• stores a structured receipt
• blocks handoff on failure

Free OSS + Team plan.
${LIVE.home}`,
  },
  {
    id: "show_hn",
    titleHe: "Show HN",
    text: `Show HN: AgentReceipt – proof-of-done receipts for AI coding agents

URL: ${LIVE.home}

When Cursor/Cloud agents say "done", there's no structured build/test proof. AgentReceipt runs verification, writes a JSON receipt, and gates the next agent handoff.

CLI:
npm run agentreceipt:verify -- --task my-task --agent cursor-cloud

Feedback welcome.`,
  },
  {
    id: "reddit_cursor",
    titleHe: "Reddit r/cursor",
    text: `Built a tiny tool after getting burned by "agent said done" but build was red.

AgentReceipt — structured receipt + gate after each agent run.
Failed build → next agent can't start.

Free OSS: ${LIVE.home}
Would love feedback from people running multi-agent / Cloud Agent workflows.`,
  },
]);

/** Directory submission fields */
export const DIRECTORY_PACK = Object.freeze({
  name: "AgentReceipt",
  tagline: "Proof-of-done for AI coding agents",
  url: LIVE.home,
  category: "Developer Tools, AI Agents, CI/CD",
  descriptionEn: `When your Cursor or Cloud agent says "done", there's no structured proof that build/tests passed. AgentReceipt runs verification, stores a machine-readable JSON receipt, and blocks the next agent handoff on failure. Free open-source CLI; Team plan available.`,
  descriptionHe: `כשסוכן AI אומר "סיימתי" — אין הוכחה מובנית ש-build עבר. AgentReceipt מריץ אימות, שומר Receipt ב-JSON, וחוסם handoff לסוכן הבא אם נכשל. חינם + חבילת Team.`,
});
