/**
 * Central illustration URLs — Pollinations (free, always works in browser).
 */

import { buildPollinationsUrl } from "../../lib/generators/pollinations.js";

const STYLE = "cute kawaii cartoon, colorful, kids educational book illustration, soft pastel, no text, no watermark, safe for children";

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function topicIllustration(topic, subject = "", opts = {}) {
  const prompt = `${STYLE}, ${subject} ${topic}, friendly characters learning`;
  const seed = opts.seed ?? hashStr(`${subject}-${topic}`);
  return buildPollinationsUrl(prompt, { width: opts.width || 768, height: opts.height || 512, seed });
}

export function cardIllustration(front, subject = "") {
  const prompt = `${STYLE}, visual for: ${front}, subject ${subject}`;
  return buildPollinationsUrl(prompt, { width: 512, height: 512, seed: hashStr(front) });
}

export function subjectHero(subjectId, lang = "he") {
  const heroes = {
    math: "numbers and geometric shapes playground, abacus, colorful",
    hebrew: "hebrew letters aleph bet floating magically, books",
    english: "english alphabet letters ABC with friendly animals",
    science: "microscope, planets, atoms, rainbow, laboratory fun",
    history: "ancient pyramids, castle, timeline, explorer kids",
    geography: "world globe, maps, mountains, oceans, flags",
    civics: "community helpers, city hall, voting, friendship",
    computers: "friendly robot, laptop, coding blocks, pixels",
    art: "paint palette, brushes, rainbow splashes, creativity",
    music: "musical notes, piano, drums, dancing notes",
  };
  const prompt = `${STYLE}, ${heroes[subjectId] || "kids learning adventure"}`;
  return buildPollinationsUrl(prompt, { width: 900, height: 400, seed: hashStr(subjectId) });
}

export function bodyItemThumb(item) {
  return buildPollinationsUrl(`${item.prompt}, square thumbnail`, {
    width: 256,
    height: 256,
    seed: hashStr(item.id),
  });
}

export function storySceneIllustration(sceneText, index = 0) {
  const prompt = `${STYLE}, story scene: ${sceneText.slice(0, 120)}`;
  return buildPollinationsUrl(prompt, { width: 768, height: 512, seed: hashStr(sceneText) + index });
}

export function chatMascotIllustration() {
  return buildPollinationsUrl(
    `${STYLE}, friendly robot teacher mascot waving, purple and pink gradient background`,
    { width: 512, height: 512, seed: 42 }
  );
}

export function dailyLessonBanner(subject, topic) {
  return topicIllustration(topic, subject, { width: 900, height: 360 });
}

/** Attach imageUrl to flashcards */
export function enrichCardsWithImages(cards, subject = "") {
  return (cards || []).map((c) => ({
    ...c,
    imageUrl: c.imageUrl || cardIllustration(c.front || c.q || "learning", subject),
  }));
}
