/**
 * Category symbol keyboards — each key: emoji + label + optional chat prompt fragment.
 */

/** @typedef {{ id: string; emoji: string; label: { he: string; en: string; ar: string }; prompt?: { he: string; en: string; ar: string }; action?: string }} SymbolKey */

/** @typedef {{ id: string; icon: string; label: { he: string; en: string; ar: string }; keys: SymbolKey[] }} SymbolKeyboard */

const key = (id, emoji, he, en, ar, promptHe, action) => ({
  id,
  emoji,
  label: { he, en, ar },
  ...(promptHe ? { prompt: { he: promptHe, en: promptHe, ar: promptHe } } : {}),
  ...(action ? { action } : {}),
});

export const KEYBOARDS = {
  letters: {
    id: "letters",
    icon: "🔤",
    label: { he: "אותיות", en: "Letters", ar: "حروف" },
    keys: [
      ..."אבגדהוזחטיכלמנסעפצקרשת".split("").map((c, i) => key(`he-${i}`, c, c, c, c)),
      key("space", "␣", "רווח", "Space", "مسافة", " ", "space"),
      key("back", "⌫", "מחק", "Delete", "حذف", "", "backspace"),
    ],
  },
  lettersEn: {
    id: "lettersEn",
    icon: "🔡",
    label: { he: "ABC", en: "ABC", ar: "ABC" },
    keys: [
      ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => key(`en-${c}`, c, c, c, c)),
      key("space-en", "␣", "רווח", "Space", "مسافة", " ", "space"),
      key("back-en", "⌫", "מחק", "Delete", "حذف", "", "backspace"),
    ],
  },
  numbers: {
    id: "numbers",
    icon: "🔢",
    label: { he: "מספרים", en: "Numbers", ar: "أرقام" },
    keys: "0123456789".split("").map((c) => key(`num-${c}`, c, c, c, c)),
  },
  animals: {
    id: "animals",
    icon: "🐾",
    label: { he: "חיות", en: "Animals", ar: "حيوانات" },
    keys: [
      key("cat", "🐱", "חתול", "Cat", "قطة", "חתול", "animal"),
      key("dog", "🐶", "כלב", "Dog", "كلب", "כלב", "animal"),
      key("bird", "🐦", "ציפור", "Bird", "طائر", "ציפור", "animal"),
      key("fish", "🐟", "דג", "Fish", "سمكة", "דג", "animal"),
      key("lion", "🦁", "אריה", "Lion", "أسد", "אריה", "animal"),
      key("frog", "🐸", "צפרדע", "Frog", "ضفدع", "צפרדע", "animal"),
      key("rabbit", "🐰", "ארנב", "Rabbit", "أرنب", "ארנב", "animal"),
      key("bear", "🐻", "דוב", "Bear", "دب", "דוב", "animal"),
      key("horse", "🐴", "סוס", "Horse", "حصان", "סוס", "animal"),
      key("dino", "🦕", "דינוזאור", "Dinosaur", "ديناصور", "דינוזאור", "animal"),
      key("butterfly", "🦋", "פרפר", "Butterfly", "فراشة", "פרפר", "animal"),
      key("whale", "🐋", "לווייתן", "Whale", "حوت", "לווייתן", "animal"),
    ],
  },
  shapes: {
    id: "shapes",
    icon: "🔺",
    label: { he: "צורות", en: "Shapes", ar: "أشكال" },
    keys: [
      key("circle", "⭕", "עיגול", "Circle", "دائرة", "עיגול", "shape"),
      key("square", "⬜", "ריבוע", "Square", "مربع", "ריבוע", "shape"),
      key("triangle", "🔺", "משולש", "Triangle", "مثلث", "משולש", "shape"),
      key("star", "⭐", "כוכב", "Star", "نجمة", "כוכב", "shape"),
      key("heart", "❤️", "לב", "Heart", "قلب", "לב", "shape"),
      key("diamond", "💎", "יהלום", "Diamond", "ماس", "יהלום", "shape"),
      key("moon", "🌙", "ירח", "Moon", "قمر", "ירח", "shape"),
      key("sun", "☀️", "שמש", "Sun", "شمس", "שמש", "shape"),
    ],
  },
  games: {
    id: "games",
    icon: "🎮",
    label: { he: "משחקים", en: "Games", ar: "ألعاب" },
    keys: [
      key("quiz", "🎯", "חידון", "Quiz", "اختبار", "משחק חידון", "gameType"),
      key("snake", "🐍", "נחש", "Snake", "ثعبان", "משחק נחש", "gameType"),
      key("memory", "🧠", "זיכרון", "Memory", "ذاكرة", "משחק זיכרון", "gameType"),
      key("runner", "🏃", "ריצה", "Runner", "جري", "משחק ריצה", "gameType"),
      key("catch", "🎈", "תפוס", "Catch", "امسك", "משחק תפוס", "gameType"),
      key("colors", "🎨", "צבעים", "Colors", "ألوان", "משחק צבעים", "gameType"),
      key("math", "➕", "חשבון", "Math", "رياضيات", "משחק חשבון", "gameType"),
      key("puzzle", "🧩", "פאזל", "Puzzle", "أحجية", "פאזל", "gameType"),
      key("bubble", "🫧", "בועות", "Bubbles", "فقاعات", "משחק בועות", "gameType"),
      key("adventure", "🗺️", "הרפתקה", "Adventure", "مغامرة", "משחק הרפתקה", "gameType"),
    ],
  },
  create: {
    id: "create",
    icon: "✨",
    label: { he: "יצירה", en: "Create", ar: "إبداع" },
    keys: [
      key("story", "📖", "סיפור", "Story", "قصة", "צור סיפור על", "intent"),
      key("character", "🦸", "דמות", "Character", "شخصية", "צור דמות של", "intent"),
      key("drawing", "🖍️", "ציור", "Drawing", "رسم", "צור ציור של", "intent"),
      key("logo", "🏷️", "לוגו", "Logo", "شعار", "עצב לוגו ל", "intent"),
      key("card", "💌", "ברכה", "Card", "بطاقة", "צור כרטיס ברכה ל", "intent"),
      key("game-make", "🎮", "משחק", "Game", "لعبة", "צור משחק על", "intent"),
    ],
  },
  chemistry: {
    id: "chemistry",
    icon: "🧪",
    label: { he: "כימיה", en: "Chemistry", ar: "كيمياء" },
    keys: [
      key("beaker", "⚗️", "בקבוקון", "Beaker", "دورق", "ניסוי ערבוב צבעים", "lab"),
      key("volcano", "🌋", "הר געש", "Volcano", "بركان", "ניסוי הר געש", "lab"),
      key("ph", "🍋", "חומצה", "Acid", "حمض", "מה זה pH", "lab"),
      key("fire", "🔥", "להבה", "Fire", "نار", "מה קורה בשריפה", "lab"),
      key("atom", "⚛️", "אטום", "Atom", "ذرة", "ספר על יסודות", "lab"),
      key("goggles", "🥽", "משקפיים", "Goggles", "نظارات", "בטיחות במעבדה", "lab"),
    ],
  },
  kitchen: {
    id: "kitchen",
    icon: "🍳",
    label: { he: "מטבח", en: "Kitchen", ar: "مطبخ" },
    keys: [
      key("pizza", "🍕", "פיצה", "Pizza", "بيتza", "מתכון פיצה", "lab"),
      key("cake", "🎂", "עוגה", "Cake", "كعكة", "מתכון עוגה", "lab"),
      key("egg", "🥚", "ביצה", "Egg", "بيضة", "מה קורה לביצה", "lab"),
      key("smoothie", "🥤", "שייק", "Smoothie", "عصير", "מתכון שייק", "lab"),
      key("cookie", "🍪", "עוגייה", "Cookie", "بسكويت", "מתכון עוגיות", "lab"),
      key("salad", "🥗", "סלט", "Salad", "سلطة", "מתכון סלט", "lab"),
    ],
  },
  body: {
    id: "body",
    icon: "🫀",
    label: { he: "גוף", en: "Body", ar: "جسم" },
    keys: [
      key("heart", "❤️", "לב", "Heart", "قلب", "ספר על הלב", "body"),
      key("brain", "🧠", "מוח", "Brain", "دماغ", "ספר על המוח", "body"),
      key("lung", "🫁", "ריאות", "Lungs", "رئتين", "ספר על הריאות", "body"),
      key("bone", "🦴", "עצם", "Bone", "عظم", "ספר על העצמות", "body"),
      key("eye", "👁️", "עין", "Eye", "عين", "ספר על העין", "body"),
      key("hand", "✋", "יד", "Hand", "يد", "ספר על היד", "body"),
    ],
  },
};

/** Route → default keyboard + tabs available */
export function keyboardsForPath(pathname, lang = "he") {
  const p = pathname || "";
  if (p.includes("/kids/chat")) {
    return { defaultId: "animals", tabs: ["animals", "shapes", "create", "games", lang === "he" ? "letters" : "lettersEn", "numbers"] };
  }
  if (p.includes("/kids/game")) {
    return { defaultId: "games", tabs: ["games", "animals", "shapes", lang === "he" ? "letters" : "lettersEn"] };
  }
  if (p.includes("/kids/create")) {
    return { defaultId: "create", tabs: ["create", "animals", "shapes", lang === "he" ? "letters" : "lettersEn"] };
  }
  if (p.includes("/kids/labs/chemistry")) {
    return { defaultId: "chemistry", tabs: ["chemistry", "shapes", lang === "he" ? "letters" : "lettersEn"] };
  }
  if (p.includes("/kids/labs/kitchen")) {
    return { defaultId: "kitchen", tabs: ["kitchen", lang === "he" ? "letters" : "lettersEn"] };
  }
  if (p.includes("/kids/body")) {
    return { defaultId: "body", tabs: ["body", lang === "he" ? "letters" : "lettersEn"] };
  }
  if (p.includes("/kids/study") || p.includes("/kids/daily")) {
    return { defaultId: lang === "he" ? "letters" : "lettersEn", tabs: [lang === "he" ? "letters" : "lettersEn", "numbers", "shapes"] };
  }
  if (p.includes("/kids")) {
    return { defaultId: "animals", tabs: ["animals", "games", "create", lang === "he" ? "letters" : "lettersEn"] };
  }
  return null;
}

export function getKeyboard(id) {
  return KEYBOARDS[id] || KEYBOARDS.animals;
}
