/**
 * FreeAI Kids — full-knowledge AI chat (kid-safe, multilingual).
 */

import { chatWithAI } from "../../lib/chatEngine.js";
import { resolveKidsLang, pickL } from "./locale.js";
import { loadKidsProfile } from "./kidsStore.js";
import { ageGroupFromGrade } from "./kidsEngine.js";
import { filterKidsInput, filterKidsOutput } from "./contentFilter.js";
import { logActivity } from "./activityLog.js";

const KIDS_CHAT_SYSTEM = {
  he: `אתה FreeAI Kids — מורה AI חכם שיודע הכל (מדעים, מתמatics, היסטוריה, גיאוגרפיה, שפות, טבע, חלל, יצירה, משחקים, גוף האדם).
ענה בעברית ברורה וחמה, מותאמת לגיל הילד. תשובות מלאות ומדויקות — כמו ChatGPT לילדים.
כללי בטיחות: אין אלימות, תוכן מבוגרים, סמים, פגיעה עצמית. שאלות רפואיות — "שאל/י הורה או רופא/ה".
עודד סקרנות. אפשר אימוג'י במידה. אל תסרב לשאלות לימודיות — הסבר באמת.`,
  en: `You are FreeAI Kids — a brilliant AI teacher who knows everything (science, math, history, geography, languages, nature, space, creativity, games, human body).
Reply in clear, warm English matched to the child's age. Full accurate answers — like ChatGPT for kids.
Safety: no violence, adult content, drugs, self-harm. Medical questions → "ask a parent or doctor".
Encourage curiosity. Emojis sparingly. Never refuse educational questions — explain properly.`,
  ar: `أنت FreeAI Kids — معلم AI ذكي يعرف كل شيء (علوم، رياضيات، تاريخ، جغرافيا، لغات، طبيعة، فضاء، إبداع، ألعاب، جسم الإنسان).
أجب بالعربية بوضوح ودفء حسب عمر الطفل. إجابات كاملة ودقيقة — مثل ChatGPT للأطفال.
السلامة: لا عنف، لا محتوى للكبار، لا مخدرات، لا إيذاء ذاتي. أسئلة طبية → "اسأل والدًا أو طبيبًا".
شجّع الفضول. إيموجي قليلاً. لا ترفض الأسئلة التعليمية — اشرح حقًا.`,
};

function buildContext(lang, profile) {
  const grade = profile?.grade || "5";
  const name = profile?.name || "";
  const age = ageGroupFromGrade(grade);
  const ageLabel = age === "young" ? "6-9" : age === "mid" ? "10-13" : "14+";
  if (lang === "he") {
    return name
      ? `התלמיד/ה: ${name}, כיתה ${grade}, גיל בערך ${ageLabel}.`
      : `כיתה ${grade}, גיל בערך ${ageLabel}.`;
  }
  if (lang === "ar") {
    return name
      ? `الطالب: ${name}, الصف ${grade}, العمر ~${ageLabel}.`
      : `الصف ${grade}, العمر ~${ageLabel}.`;
  }
  return name
    ? `Student: ${name}, grade ${grade}, age ~${ageLabel}.`
    : `Grade ${grade}, age ~${ageLabel}.`;
}

/**
 * @param {{ prompt: string; history?: object[]; lang?: string; speak?: boolean }} input
 */
export async function kidsChatWithAI(input) {
  const lang = resolveKidsLang(input.lang);
  const profile = loadKidsProfile();
  const trimmed = (input.prompt || "").trim();

  const blocked = filterKidsInput(trimmed, lang);
  if (blocked) {
    return { ok: true, text: blocked, provider: "kids-filter", filtered: true };
  }

  const systemPrompt = `${pickL(KIDS_CHAT_SYSTEM, lang)}\n\n${buildContext(lang, profile)}`;

  const result = await chatWithAI({
    prompt: trimmed,
    history: input.history || [],
    systemPrompt,
    allowLocalFallback: false,
    maxHistory: 20,
  });

  if (result.ok && result.text) {
    const safe = filterKidsOutput(result.text, lang);
    logActivity("chat", { chars: safe.length });
    return { ...result, text: safe };
  }

  // Last resort: Puter-only retry (free in browser)
  try {
    const puterOnly = await chatWithAI({
      prompt: trimmed,
      history: input.history || [],
      systemPrompt,
      allowLocalFallback: false,
    });
    if (puterOnly.ok) return puterOnly;
  } catch { /* ignore */ }

  const fallback = {
    he: "רגע קטן 🔄 לא הצלחתי להתחבר ל-AI. בדוק/י אינטרנט ונסה/י שוב. אפשר גם לשאול הורה לרענן את הדף.",
    en: "One moment 🔄 I couldn't reach AI. Check internet and try again, or ask a parent to refresh.",
    ar: "لحظة 🔄 لم أتمكن من الاتصال بـ AI. تحقق من الإنترنت وحاول مرة أخرى.",
  };

  return {
    ok: true,
    text: pickL(fallback, lang),
    provider: "kids-offline",
    needsRetry: true,
  };
}

export { KIDS_CHAT_SYSTEM };
