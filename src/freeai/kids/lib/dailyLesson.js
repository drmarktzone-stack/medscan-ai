/**
 * Daily 5-minute lesson — subject rotation by weekday + grade.
 */

import { SUBJECTS, getTopicsForGrade } from "../data/curriculum.js";
import { generateFlashcards, generateSummaryQuiz, generateStudyIntro } from "./kidsEngine.js";
import { completeDailyActivity, loadStreak, isTodayComplete } from "./streak.js";
import { pickL } from "./locale.js";
import { withTimeout } from "../../lib/withTimeout.js";
import { topicIllustration } from "./illustrations.js";
import { emojiForTopic } from "../../lib/visualFallback.js";

const WEEKDAY_SUBJECT = ["math", "hebrew", "english", "science", "history", "geography", "computers"];

export function getDailyPlan(grade, lang) {
  const day = new Date().getDay();
  const subjectId = WEEKDAY_SUBJECT[day] || "science";
  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const topics = getTopicsForGrade(subjectId, grade);
  const topicObj = topics[0];
  const topic = topicObj ? pickL(topicObj, lang) : pickL({ he: "נושא כללי", en: "General topic", ar: "موضوع عام" }, lang);

  return {
    subjectId,
    subject: pickL(subject.name, lang),
    topic,
    grade,
  };
}

function offlineDailyContent(plan, lang) {
  const emoji = emojiForTopic(`${plan.subject} ${plan.topic}`);
  const intro = pickL({
    he: `${emoji} שלום! היום נלמד על **${plan.topic}** ב${plan.subject}.\n\nיש לך פלאשקארדס, חידון בוס, ו-XP — בוא נתחיל!`,
    en: `${emoji} Hi! Today we learn **${plan.topic}** in ${plan.subject}. Flashcards + boss quiz await!`,
    ar: `${emoji} مرحبًا! اليوم نتعلم **${plan.topic}**.`,
  }, lang);

  const cards = [
    { id: "d1", front: plan.topic, back: pickL({ he: "נושא היום", en: "Today's topic", ar: "!" }, lang), hint: plan.subject },
    { id: "d2", front: "⭐", back: pickL({ he: "כל יום = XP + רצף!", en: "Daily = XP + streak!", ar: "!" }, lang), hint: "" },
    { id: "d3", front: emoji, back: plan.subject, hint: "" },
  ].map((c) => ({ ...c, imageUrl: topicIllustration(c.front, plan.subject) }));

  const quiz = {
    title: plan.topic,
    questions: [
      {
        q: pickL({ he: `מה הנושא של היום?`, en: `What is today's topic?`, ar: "?" }, lang),
        choices: [plan.topic, plan.subject, "Games", "Music"],
        correct: 0,
        explanation: plan.topic,
      },
      {
        q: pickL({ he: `באיזה מקצוע?`, en: `Which subject?`, ar: "?" }, lang),
        choices: [plan.subject, "Sports", "Cooking", "Sleep"],
        correct: 0,
        explanation: plan.subject,
      },
    ],
  };

  return { intro, cards, quiz, offline: true };
}

export async function runDailyLesson({ grade, lang }) {
  const plan = getDailyPlan(grade, lang);
  const base = {
    subject: plan.subject,
    grade,
    topic: plan.topic,
    lang,
    count: 5,
  };

  const aiResult = await withTimeout(
    Promise.all([
      generateStudyIntro(base),
      generateFlashcards({ ...base, count: 5 }),
      generateSummaryQuiz({ ...base, count: 4 }),
    ]),
    22000,
    null,
  );

  if (aiResult) {
    const [intro, flash, quiz] = aiResult;
    return {
      ok: true,
      plan,
      intro: intro.text,
      heroImage: intro.heroImage,
      heroMedia: intro.heroMedia,
      cards: flash.cards,
      quiz: quiz.quiz,
      providers: [intro.provider, flash.provider, quiz.provider],
    };
  }

  const offline = offlineDailyContent(plan, lang);
  return {
    ok: true,
    plan,
    intro: offline.intro,
    heroImage: topicIllustration(plan.topic, plan.subject),
    heroMedia: null,
    cards: offline.cards,
    quiz: offline.quiz,
    providers: ["offline-fallback"],
    offline: true,
  };
}

export function markDailyComplete() {
  return completeDailyActivity();
}

export { loadStreak, isTodayComplete };
