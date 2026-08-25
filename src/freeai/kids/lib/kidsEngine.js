/**
 * FreeAI Kids — AI engine for study, creation & games (kid-safe prompts).
 */

import { chatWithAI } from "../../lib/chatEngine.js";
import { kidsChatWithAI } from "./kidsChatEngine.js";
import { pickL, resolveKidsLang } from "./locale.js";
import { buildGameFromLibrary } from "./gameLibrary.js";
import { enrichCardsWithImages, subjectHero, storySceneIllustration, topicIllustration } from "./illustrations.js";
import { generateKidsMedia, generateKidsMediaBatch } from "./kidsMediaRouter.js";

const KIDS_SYSTEM = {
  he: `אתה מורה AI ידידותי לילדים. עברית בלבד. תוכן בטוח, חיובי, ללא אלימות או תוכן מבוגרים.
הסבר בפשטות לפי גיל. השתמש באימוג'י במידה. החזר JSON כשמתבקש — בלי markdown.`,
  en: `You are a friendly AI teacher for kids. English only. Safe, positive content — no violence or adult themes.
Explain simply for the child's age. Use emojis sparingly. Return JSON when asked — no markdown fences.`,
  ar: `أنت معلم AI ودود للأطفال. العربية فقط. محتوى آمن وإيجابي — بدون عنف أو محتوى للكبار.
اشرح ببساطة حسب العمر. استخدم إيموجي قليلاً. أرجع JSON عند الطلب — بدون markdown.`,
};

const AGE_HINT = {
  young: { he: "גיל 6-9", en: "age 6-9", ar: "6-9 سنوات" },
  mid: { he: "גיל 10-13", en: "age 10-13", ar: "10-13 سنة" },
  teen: { he: "גיל 14+", en: "age 14+", ar: "14+ سنة" },
};

function ageGroupFromGrade(grade) {
  const g = Number(grade) || 5;
  if (g <= 3) return "young";
  if (g <= 8) return "mid";
  return "teen";
}

function parseJsonBlock(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* fall through */ }
    }
  }
  return null;
}

/** Providers that answer from canned local text rather than a model. */
const OFFLINE_PROVIDERS = new Set(["freeai-local", "kids-offline", "kids-filter"]);

/**
 * Fragments that only ever come from our own instructions. Small free models
 * sometimes restate part of the brief instead of answering it, and that text
 * was reaching children as if it were the lesson.
 */
const INSTRUCTION_MARKERS = [
  /return only .*json/i,
  /no markdown/i,
  /valid json/i,
  /^\s*(subject|grade|topic|age|hero|place|problem)\s*:/im,
  /write a short (fun )?intro/i,
  /console\.groq\.com/i,
  /api keys?/i,
  /system prompt/i,
];

/**
 * Drop any line that restates the brief, and reject the answer outright if
 * almost nothing survives.
 * @param {string} text
 */
export function stripInstructionEcho(text) {
  if (!text) return "";
  const kept = String(text)
    .split("\n")
    .filter((line) => !INSTRUCTION_MARKERS.some((re) => re.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return kept.length < 12 ? "" : kept;
}

/** Usable model output, or "" when the reply was canned or echoed the brief. */
function cleanModelText(result) {
  if (!result || OFFLINE_PROVIDERS.has(result.provider)) return "";
  return stripInstructionEcho(result.text);
}

async function aiJsonWithRetry(prompt, lang) {
  // Content generation runs on page load, so it must never trigger a sign-in
  // window; it silently uses whatever provider is already available.
  const result = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const parsed = parseJsonBlock(result.text);
  if (parsed) return { parsed, provider: result.provider };

  // A canned local reply will never become JSON on a second pass, and retrying
  // just spends the caller's whole time budget before it can fall back.
  if (OFFLINE_PROVIDERS.has(result.provider)) return null;

  const retry = await kidsChatWithAI({
    prompt: `${prompt}\n\nCRITICAL: Reply ONLY with valid JSON. No markdown.`,
    history: [],
    lang,
    allowInteractive: false,
  });
  const retryParsed = parseJsonBlock(retry.text);
  if (retryParsed) return { parsed: retryParsed, provider: retry.provider };
  return null;
}

/**
 * @param {object} input
 * @param {string} input.subject
 * @param {string} input.grade
 * @param {string} input.topic
 * @param {string} input.lang
 * @param {number} [input.count]
 */
export async function generateFlashcards(input) {
  const lang = resolveKidsLang(input.lang);
  const count = input.count || 8;
  const age = AGE_HINT[ageGroupFromGrade(input.grade)];

  const prompt = `Create ${count} flashcards for:
Subject: ${input.subject}
Grade: ${input.grade}
Topic: ${input.topic}
Age: ${pickL(age, lang)}

Return ONLY valid JSON array:
[{"front":"question or term","back":"answer or definition","hint":"optional short hint"}]`;

  const jsonResult = await aiJsonWithRetry(prompt, lang);
  const cards = jsonResult?.parsed;

  if (Array.isArray(cards) && cards.length) {
    return {
      ok: true,
      cards: enrichCardsWithImages(
        cards.slice(0, count).map((c, i) => ({
          id: `fc-${Date.now()}-${i}`,
          front: c.front || c.q || "",
          back: c.back || c.a || "",
          hint: c.hint || "",
        })),
        input.subject
      ),
      provider: jsonResult.provider,
    };
  }

  const explain = await kidsChatWithAI({
    prompt: `Create ${count} educational flashcards about ${input.topic} for grade ${input.grade}. Format each as "Q: ... A: ..." one per line.`,
    lang,
    history: [],
    allowInteractive: false,
  });
  if (explain.text && !explain.needsRetry && !OFFLINE_PROVIDERS.has(explain.provider)) {
    const lines = explain.text.split("\n").filter((l) => l.trim());
    const parsedCards = lines.slice(0, count).map((line, i) => ({
      id: `fc-ai-${i}`,
      front: line.replace(/^Q:\s*/i, "").split(/A:/i)[0]?.trim() || line,
      back: line.split(/A:/i)[1]?.trim() || "",
      hint: "",
    }));
    if (parsedCards.some((c) => c.back)) {
      return { ok: true, cards: enrichCardsWithImages(parsedCards, input.subject), provider: explain.provider };
    }
  }

  return fallbackFlashcards(input, count);
}

export async function generateSummaryQuiz(input) {
  const lang = resolveKidsLang(input.lang);
  const count = input.count || 5;

  const prompt = `Create ${count} summary review questions for chapter/topic:
Subject: ${input.subject} | Grade: ${input.grade} | Topic: ${input.topic}

Return ONLY valid JSON:
{"title":"chapter title","questions":[{"q":"question","choices":["A","B","C","D"],"correct":0,"explanation":"why"}]}`;

  const jsonResult = await aiJsonWithRetry(prompt, lang);
  const data = jsonResult?.parsed;

  if (data?.questions?.length) {
    return { ok: true, quiz: data, provider: jsonResult.provider };
  }

  return fallbackQuiz(input, count);
}

export async function generateStudyIntro(input) {
  const lang = resolveKidsLang(input.lang);
  const prompt = `Write a short fun intro (3-4 sentences) about learning:
Subject: ${input.subject} | Grade: ${input.grade} | Topic: ${input.topic}
Encourage the student. Mention they will get flashcards and a summary quiz.`;

  const result = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const heroMedia = await generateKidsMedia({
    type: "image",
    prompt: `${input.subject} ${input.topic}, kids learning hero banner`,
    count: 1,
  });
  return {
    ok: true,
    // An offline provider answers with setup instructions, not a lesson intro;
    // callers substitute their own copy when this is empty.
    text: cleanModelText(result),
    provider: result.provider,
    heroImage: topicIllustration(input.topic, input.subject),
    heroMedia,
  };
}

/** Story builder */
export async function generateKidsStory(input) {
  const lang = resolveKidsLang(input.lang);
  const { hero, place, problem, ending } = input;

  const prompt = `Write a short story (6-8 paragraphs) for kids:
Hero: ${hero} | Place: ${place} | Problem: ${problem} | Ending style: ${ending || "happy"}
Make it inspiring. Child should feel they created it with AI help.`;

  const result = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const story = cleanModelText(result);
  const chunks = story.split(/\n\n+/).filter(Boolean).slice(0, 4);
  const sceneMediaList = await generateKidsMediaBatch(
    chunks.map((chunk, i) => ({
      type: "animation",
      prompt: `story scene: ${chunk.slice(0, 100)}`,
      count: 1,
    }))
  );
  const scenes = chunks.map((chunk, i) => ({
    text: chunk,
    imageUrl: storySceneIllustration(chunk, i),
    media: sceneMediaList[i],
  }));
  return { ok: true, story, scenes, provider: result.provider };
}

/** Character + drawing */
export async function generateKidsCharacter(input) {
  const lang = resolveKidsLang(input.lang);
  const { name, traits, style } = input;

  const descPrompt = `Describe a kid-friendly character in 2 sentences:
Name: ${name} | Traits: ${traits} | Style: ${style}`;

  const result = await chatWithAI({ prompt: descPrompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const description = cleanModelText(result)
    || `${name}, ${traits}, ${style}, cartoon, colorful, kid-friendly`;

  const imagePrompt = `cute kid-friendly character illustration, ${name}, ${traits}, ${style}, cartoon style, colorful, safe for children, no text`;
  const media = await generateKidsMedia({ type: "image", prompt: imagePrompt, count: 3 });

  return {
    ok: true,
    name,
    description,
    images: media.instant.images,
    media,
    provider: result.provider,
  };
}

/** Drawing from simple choices */
export async function generateKidsDrawing(input) {
  const { template, detail, lang } = input;
  const imagePrompt = `kid-friendly illustration, ${template}, ${detail}, colorful, cute, safe for children, high quality, no text watermark`;
  const media = await generateKidsMedia({ type: "image", prompt: imagePrompt, count: 4 });
  return {
    ok: true,
    images: media.instant.images,
    media,
    prompt: imagePrompt,
    label: template,
  };
}

/** Simple HTML game — uses full game library */
export async function generateKidsGame(input) {
  const lang = resolveKidsLang(input.lang);
  const { gameType, theme, grade } = input;

  const needsQuiz = ["quiz", "word"].includes(gameType);
  let questions = [];
  if (needsQuiz) {
    const prompt = `Suggest 8 fun quiz questions for kids game about: ${theme} (grade ${grade})
Return ONLY JSON array: [{"q":"...","choices":["a","b","c","d"],"correct":0}]`;
    const result = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
    questions = parseJsonBlock(result.text) || fallbackGameQuestions(theme, lang);
  }

  const html = buildGameFromLibrary({
    gameId: gameType || "quiz",
    theme,
    lang,
    questions: Array.isArray(questions) ? questions : [],
  });

  return { ok: true, html, questions, provider: "game-library" };
}

/** Logo design */
export async function generateKidsLogo(input) {
  const { name, style } = input;
  const imagePrompt = `professional kid-friendly logo design, ${name}, ${style}, clean vector style, colorful, no text watermark, centered icon`;
  const media = await generateKidsMedia({ type: "image", prompt: imagePrompt, count: 4 });
  return {
    ok: true,
    name,
    images: media.instant.images,
    media,
    provider: media.provider,
  };
}

/** Sliding tile puzzle game */
export async function generateKidsPuzzle(input) {
  const lang = resolveKidsLang(input.lang);
  const html = buildGameFromLibrary({ gameId: "puzzle", theme: input.theme || "Puzzle", lang });
  return { ok: true, html, provider: "game-library" };
}

/** Body anatomy — cute illustration + kid-friendly explanation */
export async function generateBodyLesson(input) {
  const lang = resolveKidsLang(input.lang);
  const { item, grade } = input;
  const name = pickL(item.name, lang);
  const baseFact = pickL(item.fact, lang);

  const prompt = `Explain to a grade ${grade} child about: ${name}
Category: human body / health. Start with: ${baseFact}
Add 3-4 more simple sentences. Positive, not scary. If illness — add one prevention tip.
${lang === "he" ? "עברית בלבד" : lang === "ar" ? "العربية فقط" : "English only"}`;

  const textResult = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const imagePrompt = `${item.prompt}, ${name}, educational poster for children ages 6-12, soft pastel, no text, no watermark`;
  const media = await generateKidsMedia({ type: "animation", prompt: imagePrompt, count: 2 });

  return {
    ok: true,
    name,
    explanation: cleanModelText(textResult) || baseFact,
    images: media.instant.images,
    media,
    provider: textResult.provider,
  };
}

/** Body flashcards for a category */
export async function generateBodyFlashcards(input) {
  const lang = resolveKidsLang(input.lang);
  const { categoryName, items, grade } = input;
  const names = items.map((i) => pickL(i.name, lang)).join(", ");
  const prompt = `Create ${Math.min(items.length, 10)} flashcards about ${categoryName}: ${names}
Grade ${grade}. Return ONLY JSON array: [{"front":"name","back":"simple fact","hint":"emoji tip"}]`;

  const result = await chatWithAI({ prompt, history: [], systemPrompt: pickL(KIDS_SYSTEM, lang), allowInteractive: false });
  const cards = parseJsonBlock(result.text);
  if (Array.isArray(cards) && cards.length) {
    return {
      ok: true,
      cards: cards.map((c, i) => ({
        id: `body-fc-${i}`,
        front: c.front || c.q,
        back: c.back || c.a,
        hint: c.hint || "",
      })),
      provider: result.provider,
    };
  }
  return {
    ok: true,
    cards: items.map((it, i) => ({
      id: `body-fc-${i}`,
      front: pickL(it.name, lang),
      back: pickL(it.fact, lang),
      hint: it.icon,
    })),
    provider: "kids-local",
  };
}

function fallbackFlashcards(input, count) {
  const lang = resolveKidsLang(input.lang);
  const topic = input.topic || "topic";
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `fc-local-${i}`,
      front: lang === "he" ? `${topic} — שאלה ${i + 1}` : lang === "ar" ? `${topic} — سؤال ${i + 1}` : `${topic} — Q${i + 1}`,
      back: lang === "he" ? "תשובה לדוגמה — חבר/י מפתח AI לתוכן מלא" : lang === "ar" ? "إجابة تجريبية — أضف مفتاح AI" : "Sample answer — connect AI key for full content",
      hint: "",
    });
  }
  return { ok: true, cards, provider: "kids-local", needsApiKey: true };
}

function fallbackQuiz(input, count) {
  const lang = resolveKidsLang(input.lang);
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      q: lang === "he" ? `שאלת סיכום ${i + 1} על ${input.topic}` : lang === "ar" ? `سؤال مراجعة ${i + 1}` : `Review Q${i + 1} on ${input.topic}`,
      choices: lang === "he" ? ["א", "ב", "ג", "ד"] : lang === "ar" ? ["أ", "ب", "ج", "د"] : ["A", "B", "C", "D"],
      correct: 0,
      explanation: "",
    });
  }
  return {
    ok: true,
    quiz: { title: input.topic, questions },
    provider: "kids-local",
    needsApiKey: true,
  };
}

function fallbackGameQuestions(theme, lang) {
  return [
    {
      q: lang === "he" ? `מה הקשר של ${theme}?` : lang === "ar" ? `ما علاقة ${theme}؟` : `What about ${theme}?`,
      choices: lang === "he" ? ["נכון", "לא נכון", "אולי"] : lang === "ar" ? ["صح", "خطأ", "ربما"] : ["Yes", "No", "Maybe"],
      correct: 0,
    },
  ];
}

export { ageGroupFromGrade };
