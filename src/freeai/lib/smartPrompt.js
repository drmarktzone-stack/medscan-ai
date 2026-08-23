/**
 * Smart prompt optimizer — Hebrew input → provider-specific English prompts.
 */

const PROVIDER_STYLES = {
  google_imagefx: "photorealistic, high quality, Imagen 3 style",
  ideogram: "with clear readable text, typography focus",
  leonardo: "cinematic lighting, detailed, 8k",
  pollinations: "flux model, vibrant colors",
  bing_creator: "DALL-E 3 style, clean composition",
  adobe_firefly: "commercial quality, stock photo style",
  bolt_new: "full-stack React app with Tailwind CSS",
  v0_dev: "Shadcn UI component, React, TypeScript",
  lovable: "React app with Supabase, modern UI",
  google_ai_studio: "Generate clean production-ready code",
  groq: "Write efficient, well-commented code",
};

/**
 * @param {string} input — user prompt (Hebrew or English)
 * @param {string} providerId
 * @param {'image'|'code'|'video'|'design'} taskType
 */
export function optimizePromptForProvider(input, providerId, taskType = "image") {
  const style = PROVIDER_STYLES[providerId] || "";
  const translated = translateKeywords(input);
  const typePrefix = {
    image: "Create an image of:",
    code: "Build a web application:",
    video: "Generate a video of:",
    design: "Design a graphic:",
  }[taskType] || "";

  return [typePrefix, translated, style].filter(Boolean).join(" ").trim();
}

/**
 * Generate prompts for all major providers at once (compare quality feature).
 * @param {string} input
 * @param {'image'|'code'} taskType
 */
export function generateAllProviderPrompts(input, taskType = "image") {
  const providers = taskType === "code"
    ? ["bolt_new", "v0_dev", "lovable", "groq", "google_ai_studio"]
    : ["google_imagefx", "ideogram", "leonardo", "pollinations", "bing_creator"];

  return providers.map((id) => ({
    providerId: id,
    prompt: optimizePromptForProvider(input, id, taskType),
  }));
}

const HEbrew_MAP = {
  "כלב": "dog", "חתול": "cat", "תמונה": "photo", "וידאו": "video",
  "עיצוב": "design", "אתר": "website", "חנות": "store", "מסעדה": "restaurant",
  "פizza": "pizza", "מוצר": "product", "לוגו": "logo", "באנר": "banner",
  "מודרני": "modern", "מינימליסטי": "minimalist", "צבעוני": "colorful",
  "מקצועי": "professional", "יפה": "beautiful", "חמוד": "cute",
  "דף נחיתה": "landing page", "תפריט": "menu", "פורטפolio": "portfolio",
  "נדל\"ן": "real estate", "בלוג": "blog", "סטארטאפ": "startup",
  "אינסטגרם": "instagram", "פוסט": "post", "סטורי": "story",
};

function translateKeywords(text) {
  let result = text;
  for (const [he, en] of Object.entries(HEbrew_MAP)) {
    result = result.replace(new RegExp(he, "g"), en);
  }
  if (/[\u0590-\u05FF]/.test(result)) {
    return `${result} (Hebrew context, RTL layout)`;
  }
  return result;
}
