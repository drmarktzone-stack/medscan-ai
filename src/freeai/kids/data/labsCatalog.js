/**
 * Kids Labs — chemistry, physics, kitchen, design + bonus fun labs.
 */

export const LAB_CATEGORIES = [
  {
    id: "chemistry",
    icon: "🧪",
    motif: "science",
    color: "from-emerald-500 to-teal-400",
    name: { he: "מעבדת כימיה", en: "Chemistry Lab", ar: "مختبر كيمياء" },
    tagline: {
      he: "ערבוב, התפוצצויות בטוחות וגילוי אלements!",
      en: "Mix, safe explosions & discover elements!",
      ar: "امزج واكتشف العناصر!",
    },
    tools: [
      { id: "beakers", icon: "⚗️", name: { he: "בקבוקונים", en: "Beakers", ar: "دورق" } },
      { id: "burner", icon: "🔥", name: { he: "להבה וירטואלית", en: "Virtual burner", ar: "موقد" } },
      { id: "ph", icon: "📊", name: { he: "מד pH", en: "pH meter", ar: "pH" } },
      { id: "goggles", icon: "🥽", name: { he: "משקפי בטיחות", en: "Safety goggles", ar: "نظارات" } },
    ],
    experiments: [
      { id: "color_mix", icon: "🎨", name: { he: "ערבוב צבעים", en: "Color Mixing", ar: "مزج الألوان" }, xp: 15 },
      { id: "volcano", icon: "🌋", name: { he: "הר געש!", en: "Volcano!", ar: "بركان!" }, xp: 20 },
      { id: "ph_scale", icon: "🍋", name: { he: "חמוץ או בסיס?", en: "Acid or Base?", ar: "حمض أم قاعدة؟" }, xp: 15 },
      { id: "states", icon: "❄️", name: { he: "מצבי צבירה", en: "States of Matter", ar: "حالات المادة" }, xp: 15 },
      { id: "elements", icon: "⚛️", name: { he: "משחק יסודות", en: "Element Match", ar: "عناصر" }, xp: 20 },
    ],
  },
  {
    id: "physics",
    icon: "⚡",
    motif: "physics",
    color: "from-blue-600 to-indigo-500",
    name: { he: "מעבדת פיזיקה", en: "Physics Lab", ar: "مختبر فيزياء" },
    tagline: {
      he: "מagnטים, אור, כוח וגלים!",
      en: "Magnets, light, force & waves!",
      ar: "مغناطيس وضوء وقوة!",
    },
    tools: [
      { id: "spring", icon: "🌀", name: { he: "קפיץ", en: "Spring", ar: "زنبرك" } },
      { id: "lens", icon: "🔍", name: { he: "עדשות", en: "Lenses", ar: "عدسة" } },
      { id: "battery", icon: "🔋", name: { he: "סוללה", en: "Battery", ar: "بطارية" } },
      { id: "scale", icon: "⚖️", name: { he: "משקל", en: "Scale", ar: "ميزان" } },
    ],
    experiments: [
      { id: "pendulum", icon: "🎯", name: { he: "מטוטלת", en: "Pendulum", ar: "بندول" }, xp: 15 },
      { id: "magnets", icon: "🧲", name: { he: "מagnטים", en: "Magnets", ar: "مغناطيس" }, xp: 20 },
      { id: "prism", icon: "🌈", name: { he: "מנסרת קשת", en: "Rainbow Prism", ar: "منشور" }, xp: 15 },
      { id: "circuit", icon: "💡", name: { he: "מעגל חשמלי", en: "Electric Circuit", ar: "دارة كهربائية" }, xp: 20 },
      { id: "roller", icon: "🎢", name: { he: "רכבת הרים", en: "Roller Coaster", ar: "قطار" }, xp: 20 },
    ],
  },
  {
    id: "kitchen",
    icon: "👨‍🍳",
    motif: "food",
    color: "from-orange-500 to-amber-400",
    name: { he: "מטבח מדעי", en: "Kitchen Lab", ar: "مطبخ علمي" },
    tagline: {
      he: "מתכונים, מדידות וכימיה בבישול!",
      en: "Recipes, measuring & cooking science!",
      ar: "وصفات وقياسات!",
    },
    tools: [
      { id: "cups", icon: "🥄", name: { he: "כוסות מדידה", en: "Measuring cups", ar: "أكواب" } },
      { id: "blender", icon: "🫐", name: { he: "בלנדר", en: "Blender", ar: "خلاط" } },
      { id: "oven", icon: "🍞", name: { he: "תנור", en: "Oven", ar: "فرن" } },
      { id: "timer", icon: "⏱️", name: { he: "טיימר", en: "Timer", ar: "مؤقت" } },
    ],
    experiments: [
      { id: "smoothie", icon: "🥤", name: { he: "שייק קסם", en: "Magic Smoothie", ar: "سموذي" }, xp: 15 },
      { id: "measure", icon: "📐", name: { he: "מדידות חכמות", en: "Smart Measuring", ar: "قياس" }, xp: 15 },
      { id: "food_groups", icon: "🥗", name: { he: "קבוצות מזון", en: "Food Groups", ar: "مجموعات غذائية" }, xp: 15 },
      { id: "bread_rise", icon: "🍞", name: { he: "למה הלחם עולה?", en: "Why Bread Rises", ar: "لماذا يرتفع الخبز؟" }, xp: 20 },
      { id: "recipe_builder", icon: "📝", name: { he: "בנה מתכון", en: "Build a Recipe", ar: "ابنِ وصفة" }, xp: 20 },
    ],
  },
  {
    id: "design",
    icon: "💌",
    motif: "art",
    color: "from-pink-500 to-fuchsia-500",
    name: { he: "סטודיו עיצוב", en: "Design Studio", ar: "استوديو تصميم" },
    tagline: {
      he: "ברכות, כרטיסים, פונטים ויצירה!",
      en: "Cards, greetings, fonts & art!",
      ar: "بطاقات وتهاني!",
    },
    tools: [
      { id: "brush", icon: "🖌️", name: { he: "מברשות", en: "Brushes", ar: "فرش" } },
      { id: "stickers", icon: "⭐", name: { he: "מדבקות", en: "Stickers", ar: "ملصقات" } },
      { id: "fonts", icon: "🔤", name: { he: "פונטים", en: "Fonts", ar: "خطوط" } },
      { id: "frames", icon: "🖼️", name: { he: "מסגרות", en: "Frames", ar: "إطارات" } },
    ],
    experiments: [
      { id: "greeting_card", icon: "🎂", name: { he: "כרטיס ברכה", en: "Greeting Card", ar: "بطاقة تهنئة" }, xp: 20 },
      { id: "typography", icon: "✨", name: { he: "משחק פונטים", en: "Font Playground", ar: "خطوط" }, xp: 15 },
      { id: "sticker_scene", icon: "🎪", name: { he: "סצנת מדבקות", en: "Sticker Scene", ar: "ملصقات" }, xp: 20 },
      { id: "mad_libs", icon: "📖", name: { he: "סיפור מטורף", en: "Mad Libs Story", ar: "قصة مجنونة" }, xp: 15 },
      { id: "banner", icon: "🎉", name: { he: "באנר חגיגי", en: "Party Banner", ar: "لافتة" }, xp: 20 },
    ],
  },
  {
    id: "music",
    icon: "🎵",
    motif: "spark",
    color: "from-violet-500 to-purple-600",
    name: { he: "מעבדת מוזיקה", en: "Music Lab", ar: "مختبر موسيقى" },
    tagline: { he: "קצב, גלים וצלילים!", en: "Beat, waves & sounds!", ar: "إيقاع وأمواج!" },
    tools: [
      { id: "drums", icon: "🥁", name: { he: "תופים", en: "Drums", ar: "طبول" } },
      { id: "piano", icon: "🎹", name: { he: "פסנתר", en: "Piano", ar: "بiano" } },
    ],
    experiments: [
      { id: "rhythm", icon: "👏", name: { he: "משחק קצב", en: "Rhythm Tap", ar: "إيقاع" }, xp: 15 },
      { id: "sound_wave", icon: "〰️", name: { he: "גל קול", en: "Sound Wave", ar: "موجة صوت" }, xp: 15 },
    ],
  },
  {
    id: "nature",
    icon: "🌿",
    motif: "nature",
    color: "from-green-500 to-lime-500",
    name: { he: "מעבדת טבע", en: "Nature Lab", ar: "مختبر طبيعة" },
    tagline: { he: "מזג אוויר, צמחים וחיות!", en: "Weather, plants & animals!", ar: "طقس ونباتات!" },
    tools: [
      { id: "microscope", icon: "🔬", name: { he: "מיקרוסקופ", en: "Microscope", ar: "مجهر" } },
      { id: "binoculars", icon: "🔭", name: { he: "משקפת", en: "Binoculars", ar: "منظار" } },
    ],
    experiments: [
      { id: "weather", icon: "⛅", name: { he: "יוצר מזג אוויר", en: "Weather Maker", ar: "صنع الطقس" }, xp: 15 },
      { id: "ecosystem", icon: "🦋", name: { he: "מערכת אקולוגית", en: "Ecosystem", ar: "نظام بيئي" }, xp: 20 },
    ],
  },
];

export function getLabCategory(id) {
  return LAB_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function allExperiments() {
  return LAB_CATEGORIES.flatMap((c) =>
    c.experiments.map((e) => ({ ...e, categoryId: c.id, categoryName: c.name }))
  );
}
