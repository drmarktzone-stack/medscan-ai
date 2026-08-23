/**
 * Savings calculator — shows how much money user saved.
 */

const MARKET_PRICES_ILS = {
  image: 15,
  video: 80,
  design: 25,
  code: 200,
  deploy: 50,
  edit: 10,
  upscale: 12,
  text: 5,
  landing: 1500,
  ecommerce: 4500,
  restaurant: 2800,
  realestate: 6000,
  instagram_week: 2000,
  portfolio: 3500,
  school: 800,
  startup: 5000,
  blog: 2500,
};

/** @param {string} templateId */
export function calcProjectSavings(templateId) {
  return MARKET_PRICES_ILS[templateId] || MARKET_PRICES_ILS.landing;
}

/** @param {{ type: string; count: number }[]} tasks */
export function calcTasksSavings(tasks) {
  let total = 0;
  for (const t of tasks) {
    const unitPrice = MARKET_PRICES_ILS[t.type] || 10;
    total += unitPrice * (t.count || 1);
  }
  return total;
}

const STORAGE_KEY = "freeai_total_savings_v1";

export function getTotalSavings() {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

export function addSavings(amount) {
  const current = getTotalSavings();
  const next = current + amount;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(next));
  }
  return next;
}

export function formatSavings(ils, locale = "he") {
  if (locale === "he") {
    return `₪${ils.toLocaleString("he-IL")}`;
  }
  return `$${Math.round(ils / 3.5).toLocaleString()}`;
}
