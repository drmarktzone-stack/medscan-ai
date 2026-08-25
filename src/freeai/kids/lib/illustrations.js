/**
 * Illustrations for Kids screens.
 *
 * Decorative and educational artwork is generated locally (see `artwork.js`) so
 * it paints instantly and never depends on a third-party CDN staying up. Remote
 * AI image generation is reserved for content the child explicitly asks for,
 * which lives in `kidsMediaRouter.js`.
 */

import { sceneDataUrl } from "../../lib/artwork.js";

/** Hero/banner artwork for a lesson or topic. */
export function topicIllustration(topic, subject = "", opts = {}) {
  return sceneDataUrl({
    topic,
    subject,
    width: opts.width || 768,
    height: opts.height || 480,
    variant: opts.seed || 0,
  });
}

/** Square artwork for a flashcard face. */
export function cardIllustration(front, subject = "") {
  return sceneDataUrl({ topic: front, subject, width: 512, height: 512 });
}

const SUBJECT_HINTS = {
  math: "math numbers geometry",
  hebrew: "hebrew language letters",
  english: "english language letters",
  science: "science lab experiment",
  history: "history ancient",
  geography: "geography map globe",
  civics: "history community",
  computers: "computers code robot",
  art: "art paint drawing",
  music: "music notes sound",
};

/** Wide banner for a subject landing screen. */
export function subjectHero(subjectId) {
  return sceneDataUrl({
    topic: SUBJECT_HINTS[subjectId] || "learning",
    subject: subjectId,
    width: 960,
    height: 400,
  });
}

/** Square thumbnail for a body/anatomy item. */
export function bodyItemThumb(item) {
  return sceneDataUrl({
    topic: `body ${item?.id || ""}`,
    subject: "body",
    width: 320,
    height: 320,
  });
}

/** Illustration for one scene of a generated story. */
export function storySceneIllustration(sceneText, index = 0) {
  return sceneDataUrl({
    topic: `story ${String(sceneText).slice(0, 60)}`,
    subject: "story",
    width: 768,
    height: 480,
    variant: index,
  });
}

/** Mascot shown on the chat screen. */
export function chatMascotIllustration() {
  return sceneDataUrl({ topic: "computers robot", subject: "computers", width: 512, height: 512 });
}

/** Banner for the daily lesson card. */
export function dailyLessonBanner(subject, topic) {
  return topicIllustration(topic, subject, { width: 960, height: 400 });
}

/** Attach artwork to any flashcards that don't already have an image. */
export function enrichCardsWithImages(cards, subject = "") {
  return (cards || []).map((c) => ({
    ...c,
    imageUrl: c.imageUrl || cardIllustration(c.front || c.q || "learning", subject),
  }));
}
