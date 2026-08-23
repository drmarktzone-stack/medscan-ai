/**
 * Brand Kit — save colors, fonts, style for all generations.
 */

const BRAND_KEY = "freeai_brand_kit_v1";

/** @typedef {{ primaryColor: string; secondaryColor: string; fontStyle: string; styleKeywords: string; logoUrl?: string }} BrandKit */

export function loadBrandKit() {
  if (typeof window === "undefined") return defaultBrand();
  try {
    return { ...defaultBrand(), ...JSON.parse(localStorage.getItem(BRAND_KEY) || "{}") };
  } catch {
    return defaultBrand();
  }
}

export function saveBrandKit(kit) {
  if (typeof window !== "undefined") {
    localStorage.setItem(BRAND_KEY, JSON.stringify(kit));
  }
  return kit;
}

function defaultBrand() {
  return {
    primaryColor: "#8b5cf6",
    secondaryColor: "#ec4899",
    fontStyle: "modern",
    styleKeywords: "professional, clean, modern",
  };
}

export function applyBrandToPrompt(prompt, brand) {
  const b = brand || loadBrandKit();
  return `${prompt}. Brand colors: ${b.primaryColor}, ${b.secondaryColor}. Style: ${b.styleKeywords}`;
}
