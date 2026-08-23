/**
 * Community prompts — rated prompts from users.
 */

const PROMPTS_KEY = "freeai_community_prompts_v1";

const SEED_PROMPTS = [
  { id: "p1", prompt: "product photo white background ecommerce", type: "image", provider: "ideogram", rating: 4.8, uses: 127, tags: ["ecommerce", "product"] },
  { id: "p2", prompt: "pizza menu dark background warm lighting", type: "image", provider: "google_imagefx", rating: 4.7, uses: 98, tags: ["restaurant", "food"] },
  { id: "p3", prompt: "React landing page SaaS startup gradient hero", type: "code", provider: "bolt_new", rating: 4.9, uses: 215, tags: ["startup", "landing"] },
  { id: "p4", prompt: "instagram post aesthetic pastel colors", type: "image", provider: "leonardo", rating: 4.6, uses: 156, tags: ["social", "instagram"] },
  { id: "p5", prompt: "school project poster colorful kids", type: "design", provider: "canva_ai", rating: 4.5, uses: 89, tags: ["school", "kids"] },
  { id: "p6", prompt: "modern apartment interior real estate luxury", type: "image", provider: "google_imagefx", rating: 4.8, uses: 73, tags: ["realestate"] },
  { id: "p7", prompt: "portfolio website dark theme developer", type: "code", provider: "v0_dev", rating: 4.7, uses: 112, tags: ["portfolio"] },
  { id: "p8", prompt: "logo minimalist tech startup purple", type: "design", provider: "ideogram", rating: 4.4, uses: 64, tags: ["logo", "startup"] },
];

export function loadCommunityPrompts() {
  if (typeof window === "undefined") return SEED_PROMPTS;
  try {
    const stored = JSON.parse(localStorage.getItem(PROMPTS_KEY) || "[]");
    return [...SEED_PROMPTS, ...stored].sort((a, b) => b.rating - a.rating);
  } catch {
    return SEED_PROMPTS;
  }
}

export function ratePrompt(id, rating) {
  const prompts = loadCommunityPrompts();
  const p = prompts.find((x) => x.id === id);
  if (p) {
    p.rating = (p.rating + rating) / 2;
    p.uses += 1;
  }
  return p;
}

export function addCommunityPrompt(prompt, type, provider) {
  const stored = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem(PROMPTS_KEY) || "[]")
    : [];
  stored.unshift({
    id: `user-${Date.now()}`,
    prompt,
    type,
    provider,
    rating: 3,
    uses: 1,
    tags: [],
    userSubmitted: true,
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(stored.slice(0, 100)));
  }
}

export function topPrompts(type, limit = 5) {
  return loadCommunityPrompts()
    .filter((p) => !type || p.type === type)
    .slice(0, limit);
}
