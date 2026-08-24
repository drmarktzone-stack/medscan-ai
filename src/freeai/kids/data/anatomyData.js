/**
 * Human body — parts, organs & kid-friendly health topics (he/en/ar).
 * Cute illustration prompts for Pollinations AI.
 */

/** @typedef {{ id: string; icon: string; name: Trilingual; prompt: string; fact: Trilingual }} BodyItem */
/** @typedef {{ he: string; en: string; ar: string }} Trilingual */

export const BODY_CATEGORIES = [
  {
    id: "parts",
    icon: "🧒",
    name: { he: "חלקי הגוף", en: "Body Parts", ar: "أجزاء الجسم" },
    color: "from-rose-400 to-pink-500",
    items: [
      { id: "head", icon: "😊", name: { he: "ראש", en: "Head", ar: "رأس" }, prompt: "cute cartoon child head face smiling, kawaii style, colorful, kids educational book illustration", fact: { he: "הראש מגן על המוח ומכיל את הפנים שלנו", en: "The head protects our brain and holds our face", ar: "الرأس يحمي الدماغ ويحمل الوجه" } },
      { id: "eyes", icon: "👀", name: { he: "עיניים", en: "Eyes", ar: "عيون" }, prompt: "cute kawaii cartoon eyes, big and friendly, colorful, children science book", fact: { he: "העיניים עוזרות לנו לראות את העולם", en: "Eyes help us see the world", ar: "العيون تساعدنا على رؤية العالم" } },
      { id: "ears", icon: "👂", name: { he: "אוזניים", en: "Ears", ar: "آذان" }, prompt: "cute cartoon ears, kawaii child anatomy, soft pastel colors, educational", fact: { he: "האוזניים שומעות צלילים ועוזרות לשיווי משקל", en: "Ears hear sounds and help balance", ar: "الآذان تسمع الأصوات وتساعد على التوازن" } },
      { id: "nose", icon: "👃", name: { he: "אף", en: "Nose", ar: "أنف" }, prompt: "cute cartoon nose sniffing flowers, kawaii style, kids illustration", fact: { he: "האף מריח ועוזר לנו לנשום", en: "The nose smells and helps us breathe", ar: "الأنف يشم ويساعدنا على التنفس" } },
      { id: "mouth", icon: "👄", name: { he: "פה ושיניים", en: "Mouth & Teeth", ar: "فم وأسنان" }, prompt: "cute smiling mouth with healthy white teeth, kawaii cartoon, dental health for kids", fact: { he: "הפה עוזר לאכול, לדבר ולחייך", en: "The mouth helps us eat, talk and smile", ar: "الفم يساعدنا على الأكل والكلام والابتسام" } },
      { id: "hands", icon: "🤲", name: { he: "ידיים", en: "Hands", ar: "يدين" }, prompt: "cute cartoon hands waving hello, colorful kawaii, children anatomy", fact: { he: "הידיים תופסות, כותבות ומחבקות", en: "Hands grab, write and hug", ar: "اليدان تمسكان وتكتبان وتحتضنان" } },
      { id: "feet", icon: "🦶", name: { he: "רגליים", en: "Feet & Legs", ar: "قدمين وساقين" }, prompt: "cute cartoon feet and legs running happily, kawaii kids anatomy", fact: { he: "הרגליים נושאות אותנו לכל מקום", en: "Legs carry us everywhere", ar: "الساقان تحملاننا إلى كل مكان" } },
      { id: "skin", icon: "✋", name: { he: "עור", en: "Skin", ar: "جلد" }, prompt: "cute cartoon skin layer cross section friendly, soft colors, kids science", fact: { he: "העור מגן על הגוף מפני חיידקים ושמש", en: "Skin protects us from germs and sun", ar: "الجلد يحمينا من الجراثيم والشمس" } },
    ],
  },
  {
    id: "organs",
    icon: "❤️",
    name: { he: "איברים", en: "Organs", ar: "أعضاء" },
    color: "from-red-400 to-rose-500",
    items: [
      { id: "heart", icon: "❤️", name: { he: "לב", en: "Heart", ar: "قلب" }, prompt: "cute kawaii human heart character smiling, pink red, cartoon anatomy for kids, friendly not scary", fact: { he: "הלב שואב דם לכל הגוף — הוא עובד כל הזמן!", en: "The heart pumps blood everywhere — it never stops!", ar: "القلب يضخ الدم — لا يتوقف أبداً!" } },
      { id: "lungs", icon: "🫁", name: { he: "ריאות", en: "Lungs", ar: "رئتان" }, prompt: "cute cartoon lungs breathing fresh air, kawaii pink, children educational illustration", fact: { he: "הריאות מכניסות חמצן ומוציאות גז פחמן", en: "Lungs bring in oxygen and push out CO2", ar: "الرئتان تجلبان الأكسجين" } },
      { id: "brain", icon: "🧠", name: { he: "מוח", en: "Brain", ar: "دماغ" }, prompt: "cute kawaii brain character with glasses thinking, pink purple, friendly kids science", fact: { he: "המוח חושב, זוכר ולומד — הוא המחשב שלנו!", en: "The brain thinks, remembers and learns!", ar: "الدماغ يفكر ويتذكر ويتعلم!" } },
      { id: "stomach", icon: "🫃", name: { he: "קיבה", en: "Stomach", ar: "معدة" }, prompt: "cute cartoon stomach digesting healthy food, kawaii friendly, kids anatomy", fact: { he: "הקיבה מעכלת את האוכל ונותנת לנו אנרגיה", en: "The stomach digests food and gives us energy", ar: "المعدة تهضم الطعام وتعطينا طاقة" } },
      { id: "bones", icon: "🦴", name: { he: "עצמות", en: "Bones", ar: "عظام" }, prompt: "cute cartoon skeleton friendly dancing, kawaii not scary, kids anatomy fun", fact: { he: "העצמות מחזיקות אותנו זקופים ומגנות על האיברים", en: "Bones keep us upright and protect organs", ar: "العظام تبقينا منتصبين وتحمي الأعضاء" } },
      { id: "muscles", icon: "💪", name: { he: "שרירים", en: "Muscles", ar: "عضلات" }, prompt: "cute cartoon arm muscles flexing happily, kawaii colorful, kids fitness fun", fact: { he: "שרירים עוזרים לנו לזוז, לרוץ ולחייך", en: "Muscles help us move, run and smile", ar: "العضلات تساعدنا على الحركة والجري" } },
      { id: "blood", icon: "🩸", name: { he: "דם", en: "Blood", ar: "دم" }, prompt: "cute cartoon red blood cells as happy characters, kawaii microscopic, kids science", fact: { he: "הדם מביא חמצן ומזון לכל הגוף", en: "Blood carries oxygen and food to the body", ar: "الدم ينقل الأكسجين والغذاء" } },
      { id: "kidneys", icon: "🫘", name: { he: "כליות", en: "Kidneys", ar: "كليتان" }, prompt: "cute kawaii kidney bean shaped organs smiling, cartoon anatomy kids", fact: { he: "הכליות מסננות ומנקות את הדם", en: "Kidneys filter and clean the blood", ar: "الكليتان تنقيان الدم" } },
    ],
  },
  {
    id: "health",
    icon: "🩺",
    name: { he: "בריאות ומחלות", en: "Health & Illness", ar: "صحة وأمراض" },
    color: "from-teal-400 to-emerald-500",
    items: [
      { id: "cold", icon: "🤧", name: { he: "הצטננות", en: "Common Cold", ar: "زكام" }, prompt: "cute cartoon child with tissue and warm soup, kawaii getting better, friendly not scary", fact: { he: "מנוחה, מים חמים ומרק — חוזרים לבריאות מהר!", en: "Rest, warm fluids — you'll feel better soon!", ar: "راحة وسوائل دافئة — ستتحسن قريباً!" } },
      { id: "flu", icon: "🤒", name: { he: "שפעת", en: "Flu", ar: "إنفluenza" }, prompt: "cute child resting in bed with thermometer, kawaii caring mom, soft colors", fact: { he: "שפעת גורמת לחום ועייפות — חשוב לנוח", en: "Flu causes fever and tiredness — rest is key", ar: "الإنfluenza تسبب حمى — الراحة مهمة" } },
      { id: "allergy", icon: "🌸", name: { he: "אלרגיה", en: "Allergy", ar: "حساسية" }, prompt: "cute cartoon pollen and flowers with sneeze cloud, kawaii allergy education kids", fact: { he: "אלרגיה = הגוף מגיב חזק מדי לאבק או לפרחים", en: "Allergy = body reacts strongly to pollen or dust", ar: "حساسية = الجسم يتفاعل بقوة مع حبوب اللقاح" } },
      { id: "stomachache", icon: "🤢", name: { he: "כאב בטן", en: "Stomach Ache", ar: "ألم بطن" }, prompt: "cute cartoon stomach ache with healthy food vs junk food, kawaii educational", fact: { he: "לפעמים אכלנו יותר מדי — מים ומנוחה עוזרים", en: "Sometimes we ate too much — water and rest help", ar: "أحياناً أكلنا كثيراً — الماء والراحة يساعدان" } },
      { id: "toothache", icon: "🦷", name: { he: "כאב שיניים", en: "Toothache", ar: "ألم أسنان" }, prompt: "cute cartoon tooth with toothbrush and dentist friendly, kawaii dental care kids", fact: { he: "צחצוח פעמיים ביום מונע כאבי שיניים!", en: "Brushing twice a day prevents toothaches!", ar: "تنظيف الأسنان مرتين يومياً يمنع الألم!" } },
      { id: "brokenbone", icon: "🩹", name: { he: "שבר בעצם", en: "Broken Bone", ar: "كسر عظم" }, prompt: "cute cartoon arm in colorful cast with stars stickers, kawaii healing, friendly", fact: { he: "גבס נותן לעצם להתרפא — העצמות חזקות ומתחדשות!", en: "A cast lets bones heal — bones are strong and renew!", ar: "الجبيرة تسمح للعظم بالشفاء!" } },
      { id: "sunburn", icon: "☀️", name: { he: "כוויית שמש", en: "Sunburn", ar: "حروق شمس" }, prompt: "cute cartoon sun with sunscreen and hat on child, kawaii sun safety kids", fact: { he: "קרם הגנה וכובע מגנים מהשמש!", en: "Sunscreen and hats protect from the sun!", ar: "واقي الشمس والقبعة يحميان من الشمس!" } },
      { id: "cough", icon: "😷", name: { he: "שיעול", en: "Cough", ar: "سعال" }, prompt: "cute cartoon child coughing politely into elbow, kawaii hygiene education", fact: { he: "שיעול מנקה את הריאות — כסו את הפה ושתו מים", en: "Cough clears lungs — cover mouth and drink water", ar: "السعال ينظف الرئتين — غطِّ فمك واشرب ماء" } },
      { id: "fever", icon: "🌡️", name: { he: "חום", en: "Fever", ar: "حمى" }, prompt: "cute thermometer and cool cloth on forehead, kawaii fever care kids friendly", fact: { he: "חום = הגוף נלחם בחיידקים — פנו לרופא אם גבוה מדי", en: "Fever = body fighting germs — see doctor if too high", ar: "الحمى = الجسم يحارب الجراثيم — راجع الطبيب إن كانت عالية" } },
    ],
  },
];

export function findBodyItem(categoryId, itemId) {
  const cat = BODY_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.items.find((i) => i.id === itemId) || null;
}

export function getCategory(id) {
  return BODY_CATEGORIES.find((c) => c.id === id);
}
