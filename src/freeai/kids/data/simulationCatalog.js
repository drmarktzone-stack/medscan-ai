/**
 * Interactive simulations catalog — subject → component id.
 */

export const SIMULATIONS = {
  math: [
    { id: "numberline", icon: "📏", name: { he: "ציר מספרים", en: "Number Line", ar: "خط الأعداد" } },
    { id: "fractionpizza", icon: "🍕", name: { he: "שברים — פיצה", en: "Fraction Pizza", ar: "كسور — بيتza" } },
    { id: "multiplication", icon: "✖️", name: { he: "לוח כפל", en: "Times Table", ar: "جدول الضرب" } },
  ],
  science: [
    { id: "solar", icon: "🪐", name: { he: "מערכת השמש", en: "Solar System", ar: "النظام الشمسي" } },
    { id: "plant", icon: "🌱", name: { he: "גידול צמח", en: "Plant Growth", ar: "نمو النبات" } },
    { id: "watercycle", icon: "💧", name: { he: "מחזור המים", en: "Water Cycle", ar: "دورة الماء" } },
  ],
  body: [
    { id: "heartbeat", icon: "❤️", name: { he: "דופק הלב", en: "Heart Beat", ar: "نبض القلب" } },
    { id: "bodyparts", icon: "🧒", name: { he: "מפת הגוף", en: "Body Map", ar: "خريطة الجسم" } },
  ],
  computers: [
    { id: "binary", icon: "💻", name: { he: "0 ו-1", en: "Binary Bits", ar: "ثنائي" } },
  ],
  geography: [
    { id: "globe", icon: "🌍", name: { he: "גלובוס", en: "Spinning Globe", ar: "كرة أرضية" } },
  ],
};

export function simsForSubject(subjectId) {
  return SIMULATIONS[subjectId] || SIMULATIONS.science;
}

export function allSimulationIds() {
  return Object.values(SIMULATIONS).flat().map((s) => s.id);
}
