/**
 * Daily 5-minute lesson — subject rotation by weekday + grade.
 */

import { SUBJECTS, getTopicsForGrade } from "../data/curriculum.js";
import { generateFlashcards, generateSummaryQuiz, generateStudyIntro } from "./kidsEngine.js";
import { completeDailyActivity, loadStreak, isTodayComplete } from "./streak.js";
import { pickL } from "./locale.js";

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

export async function runDailyLesson({ grade, lang }) {
  const plan = getDailyPlan(grade, lang);
  const base = {
    subject: plan.subject,
    grade,
    topic: plan.topic,
    lang,
    count: 5,
  };

  const [intro, flash, quiz] = await Promise.all([
    generateStudyIntro(base),
    generateFlashcards({ ...base, count: 5 }),
    generateSummaryQuiz({ ...base, count: 4 }),
  ]);

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

export function markDailyComplete() {
  return completeDailyActivity();
}

export { loadStreak, isTodayComplete };
