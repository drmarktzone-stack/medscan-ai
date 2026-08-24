/**
 * Detect creation intents from chat & run step-by-step builds.
 */

import { pickL } from "./locale.js";
import { loadKidsProfile } from "./kidsStore.js";
import {
  generateKidsGame,
  generateKidsStory,
  generateKidsCharacter,
  generateKidsDrawing,
  generateKidsLogo,
  generateKidsPuzzle,
} from "./kidsEngine.js";
import {
  startBuildSession,
  updateBuildSteps,
  defaultStepsForType,
  setStepStatus,
  advanceSteps,
} from "./kidsBuildSession.js";
import { saveCreation } from "./kidsStore.js";

function tr(he, en, ar) {
  return { he, en, ar };
}

export function detectBuildIntent(prompt) {
  const p = (prompt || "").toLowerCase();
  if (/פתח|open|go to|עבור/.test(p)) {
    if (/כימיה|chemistry/.test(p)) return { type: "navigate", path: "/kids/labs/chemistry" };
    if (/מטבח|kitchen/.test(p)) return { type: "navigate", path: "/kids/labs/kitchen" };
    if (/מעבד|lab/.test(p)) return { type: "navigate", path: "/kids/labs" };
    if (/משחק|game/.test(p)) return { type: "navigate", path: "/kids/game" };
    if (/יציר|create|studio/.test(p)) return { type: "navigate", path: "/kids/create" };
    if (/לימוד|study/.test(p)) return { type: "navigate", path: "/kids/study" };
    if (/גוף|body/.test(p)) return { type: "navigate", path: "/kids/body" };
    if (/יומי|daily/.test(p)) return { type: "navigate", path: "/kids/daily" };
  }
  if (/משחק|game|לשחק|\bplay\b/.test(p)) return { type: "build", buildType: "game", gameType: detectGameType(p) };
  if (/לוגו|logo|סמל|brand/.test(p)) return { type: "build", buildType: "logo" };
  if (/פאזל|puzzle|אהידה|jigsaw/.test(p)) return { type: "build", buildType: "puzzle" };
  if (/סיפור|story|אגדה|fairy/.test(p)) return { type: "build", buildType: "story" };
  if (/דמות|character|גיבור|hero|avatar/.test(p)) return { type: "build", buildType: "character" };
  if (/ציור|צייר|draw|picture|illustration|paint/.test(p)) return { type: "build", buildType: "drawing" };
  if (/צורה|shape|geometry|גיאומטר/.test(p)) return { type: "build", buildType: "drawing" };
  return null;
}

function detectGameType(p) {
  if (/נחש|snake/.test(p)) return "snake";
  if (/זיכרון|memory/.test(p)) return "memory";
  if (/ריצ|runner/.test(p)) return "runner";
  if (/תפוס|catch/.test(p)) return "catch";
  if (/צבע|color/.test(p)) return "colors";
  if (/חשב|math|כפל|plus/.test(p)) return "math";
  if (/בוע|bubble/.test(p)) return "bubble";
  if (/הרפתק|adventure/.test(p)) return "adventure";
  if (/פאזל|puzzle/.test(p)) return "puzzle";
  return "quiz";
}

function extractTheme(prompt) {
  return prompt
    .replace(/^(צור|תיצור|בנה|עשה|create|make|build|draw)\s*(לי|me|a)?\s*/i, "")
    .replace(/(משחק|game|לוגו|logo|פאזל|puzzle|סיפור|story|דמות|character|ציור|drawing)\s*( על | about |of )?/gi, "")
    .trim() || prompt.slice(0, 80);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Run build pipeline; calls onUpdate(steps, result) after each step.
 * @param {string|{ buildType: string; gameType?: string }} typeOrIntent
 */
export async function runChatBuild(typeOrIntent, prompt, lang, onUpdate) {
  const buildType = typeof typeOrIntent === "object" ? typeOrIntent.buildType : typeOrIntent;
  const gameTypeOverride = typeof typeOrIntent === "object" ? typeOrIntent.gameType : null;

  startBuildSession(buildType, prompt);
  let steps = defaultStepsForType(buildType, lang);
  onUpdate(steps, null);

  await delay(400);
  steps = advanceSteps(steps, "think");
  onUpdate(steps, null);

  const profile = loadKidsProfile();
  const grade = profile.grade || "5";
  const theme = extractTheme(prompt);

  steps = advanceSteps(setStepStatus(steps, "think", "done"), "create");
  onUpdate(steps, null);

  let result = null;

  try {
    switch (buildType) {
      case "game": {
        const gameType = gameTypeOverride || detectGameType(prompt.toLowerCase());
        const res = await generateKidsGame({ gameType: gameType || "quiz", theme, grade, lang });
        const blob = new Blob([res.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        result = { type: "game", theme, previewUrl: url, html: res.html };
        saveCreation({ type: "game", title: theme, data: { html: res.html, gameType: gameType || "quiz" } });
        break;
      }
      case "logo": {
        const res = await generateKidsLogo({ name: theme, style: "colorful modern kid brand", lang });
        result = { type: "logo", theme, media: res.media, images: res.images };
        saveCreation({ type: "drawing", title: `Logo: ${theme}`, preview: res.images?.[0]?.url, data: res });
        break;
      }
      case "puzzle": {
        const res = await generateKidsPuzzle({ theme, lang, grade });
        const blob = new Blob([res.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        result = { type: "puzzle", theme, previewUrl: url, html: res.html };
        saveCreation({ type: "game", title: `Puzzle: ${theme}`, data: { html: res.html, gameType: "puzzle" } });
        break;
      }
      case "story": {
        const res = await generateKidsStory({
          hero: theme.split(" ")[0] || "Hero",
          place: theme,
          problem: pickL(tr("אתגר", "challenge", "تحدي"), lang),
          ending: "happy",
          lang,
        });
        result = { type: "story", story: res.story, scenes: res.scenes };
        saveCreation({ type: "story", title: theme, preview: res.story?.slice(0, 80), data: res });
        break;
      }
      case "character": {
        const res = await generateKidsCharacter({
          name: theme.split(" ")[0] || "Hero",
          traits: theme,
          style: "cartoon colorful",
          lang,
        });
        result = { type: "character", ...res };
        saveCreation({ type: "character", title: res.name, preview: res.description, data: res });
        break;
      }
      default: {
        const res = await generateKidsDrawing({ template: theme, detail: prompt, lang });
        result = { type: "drawing", ...res };
        saveCreation({ type: "drawing", title: theme, preview: res.images?.[0]?.url, data: res });
      }
    }

    steps = advanceSteps(setStepStatus(steps, "create", "done"), "polish");
    onUpdate(steps, null);
    await delay(500);
    steps = advanceSteps(setStepStatus(steps, "polish", "done"), "ready");
    steps = setStepStatus(steps, "ready", "done");
    updateBuildSteps(steps, result);
    onUpdate(steps, result);
    return { ok: true, steps, result };
  } catch (err) {
    steps = setStepStatus(steps, "create", "error");
    updateBuildSteps(steps, null);
    onUpdate(steps, null);
    return { ok: false, error: err?.message };
  }
}
