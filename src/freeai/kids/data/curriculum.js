/**
 * School curriculum — subjects & grade-appropriate topic seeds (he/en/ar).
 * Users can always type a custom topic; these are quick picks.
 */

/** @typedef {{ id: string; he: string; en: string; ar: string }} Trilingual */

/** @type {Trilingual[]} */
export const GRADES = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return {
    id: String(n),
    he: `כיתה ${n}`,
    en: `Grade ${n}`,
    ar: `الصف ${n}`,
  };
});

/** @type {{ id: string; icon: string; color: string; name: Trilingual; topicsByGrade: Record<string, Trilingual[]> }[]} */
export const SUBJECTS = [
  {
    id: "math",
    icon: "🔢",
    motif: "math",
    color: "from-blue-500 to-cyan-500",
    name: { he: "מתמטיקה", en: "Math", ar: "رياضيات" },
    topicsByGrade: {
      "1": [{ he: "חיבור וחיסור עד 20", en: "Addition & subtraction to 20", ar: "جمع وطرح حتى 20" }],
      "2": [{ he: "כפל וחילוק בסיסי", en: "Basic multiplication & division", ar: "ضرب وقسمة أساسية" }],
      "3": [{ he: "שברים פשוטים", en: "Simple fractions", ar: "كسور بسيطة" }],
      "4": [{ he: "היקף ושטח", en: "Perimeter & area", ar: "محيط ومساحة" }],
      "5": [{ he: "אחוזים", en: "Percentages", ar: "نسب مئوية" }],
      "6": [{ he: "יחס ופרופורציה", en: "Ratio & proportion", ar: "نسبة وتناسب" }],
      "7": [{ he: "משוואות לינאריות", en: "Linear equations", ar: "معادلات خطية" }],
      "8": [{ he: "פונקציות", en: "Functions", ar: "دوال" }],
      "9": [{ he: "גאומטריה אנליטית", en: "Analytic geometry", ar: "هندسة تحليلية" }],
      "10": [{ he: "טריגונומטריה", en: "Trigonometry", ar: "مثلثات" }],
      "11": [{ he: "חדו״א בסיס", en: "Intro calculus", ar: "تفاضل وتكامل مقدم" }],
      "12": [{ he: "הכנה לבגרות", en: "Matriculation prep", ar: "تحضير للبجروت" }],
    },
  },
  {
    id: "hebrew",
    icon: "📖",
    motif: "language",
    color: "from-amber-500 to-orange-500",
    name: { he: "עברית", en: "Hebrew", ar: "عبري" },
    topicsByGrade: {
      "1": [{ he: "אותיות וקריאה", en: "Letters & reading", ar: "حروف وقراءة" }],
      "3": [{ he: "כתיבה וניקוד", en: "Writing & vowels", ar: "كتابة وتشكيل" }],
      "5": [{ he: "הבנת הנקרא", en: "Reading comprehension", ar: "فهم المقروء" }],
      "7": [{ he: "ניתוח טקסט", en: "Text analysis", ar: "تحليل نص" }],
      "9": [{ he: "חיבור דעת", en: "Opinion essay", ar: "مقال رأي" }],
      "12": [{ he: "הכנה לבגרות", en: "Bagrut prep", ar: "تحضير بجروت" }],
    },
  },
  {
    id: "english",
    icon: "🇬🇧",
    motif: "language",
    color: "from-emerald-500 to-teal-500",
    name: { he: "אנגלית", en: "English", ar: "إنجليزي" },
    topicsByGrade: {
      "1": [{ he: "אותיות A-Z", en: "Letters A-Z", ar: "حروف A-Z" }],
      "3": [{ he: "Present Simple", en: "Present Simple", ar: "المضارع البسيط" }],
      "5": [{ he: "Past Simple", en: "Past Simple", ar: "الماضي البسيط" }],
      "7": [{ he: "Vocabulary & reading", en: "Vocabulary & reading", ar: "مفردات وقراءة" }],
      "9": [{ he: "Essay writing", en: "Essay writing", ar: "كتابة مقال" }],
      "12": [{ he: "Bagrut / IELTS basics", en: "Bagrut / IELTS basics", ar: "بجروت / IELTS" }],
    },
  },
  {
    id: "science",
    icon: "🔬",
    motif: "science",
    color: "from-violet-500 to-purple-500",
    name: { he: "מדעים", en: "Science", ar: "علوم" },
    topicsByGrade: {
      "1": [{ he: "גוף האדם", en: "Human body", ar: "جسم الإنسان" }],
      "3": [{ he: "צמחים ובעלי חיים", en: "Plants & animals", ar: "نباتات وحيوانات" }],
      "5": [{ he: "מערכת השמש", en: "Solar system", ar: "المجموعة الشمسية" }],
      "7": [{ he: "תא וגנטיקה", en: "Cell & genetics", ar: "الخلية والوراثة" }],
      "9": [{ he: "פיזיקה בסיסית", en: "Basic physics", ar: "فيزياء أساسية" }],
      "11": [{ he: "כימיה — מבנה האטום", en: "Chemistry — atom structure", ar: "كيمياء — بنية الذرة" }],
    },
  },
  {
    id: "history",
    icon: "🏛️",
    motif: "history",
    color: "from-stone-500 to-amber-700",
    name: { he: "היסטוריה", en: "History", ar: "تاريخ" },
    topicsByGrade: {
      "4": [{ he: "עולם קדmon", en: "Ancient world", ar: "العالم القديم" }],
      "6": [{ he: "ימי הביניים", en: "Middle Ages", ar: "العصور الوسطى" }],
      "8": [{ he: "המהפכה הצרפתית", en: "French Revolution", ar: "الثورة الفرنسية" }],
      "10": [{ he: "מלחמת העולם השנייה", en: "World War II", ar: "الحرب العالمية الثانية" }],
      "12": [{ he: "היסטוריה של ישראל", en: "History of Israel", ar: "تاريخ إسرائيل" }],
    },
  },
  {
    id: "geography",
    icon: "🌍",
    motif: "geography",
    color: "from-sky-500 to-blue-600",
    name: { he: "גאוגרפיה", en: "Geography", ar: "جغرافيا" },
    topicsByGrade: {
      "3": [{ he: "יבשות ואוקיינוסים", en: "Continents & oceans", ar: "قارات ومحيطات" }],
      "5": [{ he: "מזג אוויר", en: "Weather & climate", ar: "طقس ومناخ" }],
      "7": [{ he: "מפות וקoordinates", en: "Maps & coordinates", ar: "خرائط وإحداثيات" }],
      "9": [{ he: "גאוגרפיה של המזרח התיכון", en: "Middle East geography", ar: "جغرافيا الشرق الأوسط" }],
    },
  },
  {
    id: "civics",
    icon: "⚖️",
    motif: "history",
    color: "from-rose-500 to-pink-600",
    name: { he: "אזrחות", en: "Civics", ar: "تربية مدنية" },
    topicsByGrade: {
      "5": [{ he: "דמוקרטיה", en: "Democracy basics", ar: "أساسيات الديمقراطية" }],
      "8": [{ he: "זכויות וחובות", en: "Rights & duties", ar: "حقوق وواجبات" }],
      "10": [{ he: "מערכת הממשל", en: "Government system", ar: "نظام الحكم" }],
    },
  },
  {
    id: "computers",
    icon: "💻",
    motif: "computers",
    color: "from-indigo-500 to-violet-600",
    name: { he: "מחשבים", en: "Computers", ar: "حاسوب" },
    topicsByGrade: {
      "3": [{ he: "מה זה AI?", en: "What is AI?", ar: "ما هو الذكاء الاصطناعي؟" }],
      "5": [{ he: "אלגorithm בסיסי", en: "Basic algorithms", ar: "خوارزميات أساسية" }],
      "7": [{ he: "Scratch / block coding", en: "Scratch / block coding", ar: "برمجة بالبلوكات" }],
      "9": [{ he: "HTML & CSS", en: "HTML & CSS", ar: "HTML و CSS" }],
      "11": [{ he: "Python basics", en: "Python basics", ar: "أساسيات Python" }],
    },
  },
  {
    id: "art",
    icon: "🎨",
    motif: "art",
    color: "from-fuchsia-500 to-pink-500",
    name: { he: "אמנות", en: "Art", ar: "فن" },
    topicsByGrade: {
      "1": [{ he: "צבעים וצורות", en: "Colors & shapes", ar: "ألوان وأشكال" }],
      "4": [{ he: "פרspектiva", en: "Perspective", ar: "منظور" }],
      "7": [{ he: "היסטוריה של אמנות", en: "Art history", ar: "تاريخ الفن" }],
    },
  },
  {
    id: "music",
    icon: "🎵",
    motif: "music",
    color: "from-yellow-500 to-amber-500",
    name: { he: "מוזיקה", en: "Music", ar: "موسيقى" },
    topicsByGrade: {
      "2": [{ he: "קצב ותווים", en: "Rhythm & notes", ar: "إيقاع ونوتات" }],
      "5": [{ he: "כלי נגינה", en: "Musical instruments", ar: "آلات موسيقية" }],
      "8": [{ he: "תיאוריה מוזיקלית", en: "Music theory", ar: "نظرية موسيقية" }],
    },
  },
];

export function getTopicsForGrade(subjectId, gradeId) {
  const sub = SUBJECTS.find((s) => s.id === subjectId);
  if (!sub) return [];
  const g = String(gradeId);
  const exact = sub.topicsByGrade[g] || [];
  const nearby = sub.topicsByGrade[String(Math.max(1, Number(g) - 1))] || [];
  const fallback = [{ he: "נושא חופשי", en: "Custom topic", ar: "موضوع حر" }];
  return exact.length ? exact : nearby.length ? nearby : fallback;
}

export function findSubject(id) {
  return SUBJECTS.find((s) => s.id === id);
}
