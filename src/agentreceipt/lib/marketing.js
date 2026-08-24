/**
 * AgentReceipt — public URLs and share copy for outreach.
 */

const DEFAULT_ORIGIN = "https://drmarktzone-stack.github.io/medscan-ai";

function basePath() {
  if (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) {
    return import.meta.env.BASE_URL.replace(/\/$/, "");
  }
  return "/medscan-ai";
}

export function getAgentReceiptOrigin() {
  const env = typeof import.meta !== "undefined" ? import.meta.env : {};
  if (env.VITE_FREEAI_PUBLIC_URL) return env.VITE_FREEAI_PUBLIC_URL.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath()}`.replace(/\/$/, "");
  }
  return DEFAULT_ORIGIN;
}

export const AGENT_RECEIPT_HOME = () => `${getAgentReceiptOrigin()}/agentreceipt`;
export const AGENT_RECEIPT_PRICING = () => `${getAgentReceiptOrigin()}/agentreceipt/pricing`;
export const AGENT_RECEIPT_CHECKOUT = () => `${getAgentReceiptOrigin()}/agentreceipt/checkout`;
export const AGENT_RECEIPT_DOCS = () => `${getAgentReceiptOrigin()}/agentreceipt/docs`;

export function pitchHe() {
  const home = AGENT_RECEIPT_HOME();
  return `AgentReceipt — הוכחת סיום לסוכני AI (Cursor / Cloud / Lovable)

כשסוכן אומר "סיימתי" — אין JSON עם build/tests.
AgentReceipt מריץ verify, שומר Receipt, וחוסם handoff אם נכשל.

חינם (OSS) · Team ₪149/חודש
${home}`;
}

export function pitchEn() {
  const home = AGENT_RECEIPT_HOME();
  return `AgentReceipt — proof-of-done for AI coding agents

Structured receipt after each agent run. Failed build → next agent blocked.
Free OSS · Team ₪149/mo
${home}`;
}

export function whatsAppBroadcastUrl(locale = "he") {
  const text = encodeURIComponent(locale === "en" ? pitchEn() : pitchHe());
  return `https://wa.me/?text=${text}`;
}

export function twitterShareUrl(locale = "he") {
  const text = encodeURIComponent(
    locale === "en"
      ? `AgentReceipt — proof-of-done for AI agents. Failed build → handoff blocked.\n${AGENT_RECEIPT_HOME()}`
      : `AgentReceipt — receipt + gate אחרי כל סוכן AI\n${AGENT_RECEIPT_HOME()}`,
  );
  return `https://twitter.com/intent/tweet?text=${text}`;
}

export const DIRECTORY_SUBMISSIONS = Object.freeze([
  { name: "There's An AI For That", url: "https://theresanaiforthat.com/submit/" },
  { name: "Futurepedia", url: "https://www.futurepedia.io/submit-tool" },
  { name: "Toolify.ai", url: "https://www.toolify.ai/submit" },
  { name: "Product Hunt", url: "https://www.producthunt.com/posts/new" },
  { name: "Hacker News Show", url: "https://news.ycombinator.com/submit" },
]);
