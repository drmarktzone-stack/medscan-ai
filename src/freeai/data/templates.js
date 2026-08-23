/**
 * Profession templates — pre-built project specs.
 */

/** @typedef {{ id: string; icon: string; titleHe: string; titleEn: string; descHe: string; descEn: string; pipeline: import('../lib/pipelineEngine.js').PipelineSpec; savingsIls: number }} Template */

/** @type {Template[]} */
export const PROFESSION_TEMPLATES = [
  {
    id: "ecommerce",
    icon: "🛒",
    titleHe: "חנות אונליין",
    titleEn: "Online store",
    descHe: "אתר מוצרים + 10 תמונות + באנר + לוגו",
    descEn: "Product site + 10 images + banner + logo",
    savingsIls: 450,
    pipeline: {
      name: "חנות אונליין",
      stages: {
        code: { prompt: "React landing page for online store with product grid, cart icon, hero section, Hebrew RTL support", type: "landing" },
        design: { tasks: [{ type: "image", count: 10, prompt: "product photo white background ecommerce" }, { type: "design", count: 1, prompt: "ecommerce banner modern" }] },
        wrap: { theme: "modern-shop", rtl: true },
        deploy: { platform: "github_pages" },
      },
    },
  },
  {
    id: "restaurant",
    icon: "🍕",
    titleHe: "מסעדה / Wolt",
    titleEn: "Restaurant / delivery",
    descHe: "תפריט דיגיטלי + 5 תמונות מנות + באנר",
    descEn: "Digital menu + 5 food photos + banner",
    savingsIls: 280,
    pipeline: {
      name: "מסעדה",
      stages: {
        code: { prompt: "Restaurant menu website with categories, dish cards, prices, contact, Hebrew RTL", type: "menu" },
        design: { tasks: [{ type: "image", count: 5, prompt: "delicious food photography restaurant plate" }, { type: "design", count: 1, prompt: "restaurant banner warm colors" }] },
        wrap: { theme: "warm-food", rtl: true },
        deploy: { platform: "netlify" },
      },
    },
  },
  {
    id: "realestate",
    icon: "🏠",
    titleHe: "נדל\"ן",
    titleEn: "Real estate",
    descHe: "אתר נכסים + תמונות + virtual staging",
    descEn: "Property site + photos + virtual staging",
    savingsIls: 600,
    pipeline: {
      name: "נדל\"ן",
      stages: {
        code: { prompt: "Real estate listing website with property cards, filters, map placeholder, contact form, Hebrew RTL", type: "listing" },
        design: { tasks: [{ type: "image", count: 8, prompt: "modern apartment interior real estate" }, { type: "video", count: 1, prompt: "property walkthrough" }] },
        wrap: { theme: "luxury-estate", rtl: true },
        deploy: { platform: "vercel" },
      },
    },
  },
  {
    id: "instagram_week",
    icon: "📱",
    titleHe: "אינסטגרם שבועי",
    titleEn: "Weekly Instagram",
    descHe: "7 פוסטים + 3 סטוריז + ביו לינק",
    descEn: "7 posts + 3 stories + bio link page",
    savingsIls: 200,
    pipeline: {
      name: "Instagram",
      stages: {
        code: { prompt: "Single-page bio link website with social links, latest posts grid, Hebrew RTL", type: "bio" },
        design: { tasks: [{ type: "image", count: 7, prompt: "instagram post aesthetic social media" }, { type: "design", count: 3, prompt: "instagram story template" }] },
        wrap: { theme: "social", rtl: true },
        deploy: { platform: "github_pages" },
      },
    },
  },
  {
    id: "portfolio",
    icon: "💼",
    titleHe: "פורטפolio",
    titleEn: "Portfolio",
    descHe: "אתר אישי + תמונת פרופיל + גלריה",
    descEn: "Personal site + profile photo + gallery",
    savingsIls: 350,
    pipeline: {
      name: "Portfolio",
      stages: {
        code: { prompt: "Personal portfolio website with hero, about, projects grid, contact form, dark theme", type: "portfolio" },
        design: { tasks: [{ type: "image", count: 4, prompt: "portfolio project showcase" }, { type: "image", count: 1, prompt: "professional headshot avatar" }] },
        wrap: { theme: "dark-portfolio", rtl: false },
        deploy: { platform: "github_pages" },
      },
    },
  },
  {
    id: "school",
    icon: "👶",
    titleHe: "פרויקט בית ספר",
    titleEn: "School project",
    descHe: "מצגת + poster + תעודה — 100% חינם",
    descEn: "Presentation + poster + certificate — 100% free",
    savingsIls: 80,
    pipeline: {
      name: "בית ספר",
      stages: {
        code: { prompt: "Simple educational presentation webpage with slides, title, student name placeholder, Hebrew RTL", type: "presentation" },
        design: { tasks: [{ type: "design", count: 1, prompt: "school project poster colorful" }, { type: "design", count: 1, prompt: "certificate of achievement template" }] },
        wrap: { theme: "kids-colorful", rtl: true },
        deploy: { platform: "github_pages" },
      },
    },
  },
  {
    id: "startup",
    icon: "🚀",
    titleHe: "Startup Landing",
    titleEn: "Startup landing",
    descHe: "דף נחיתה + לוגו + hero + CTA",
    descEn: "Landing page + logo + hero + CTA",
    savingsIls: 500,
    pipeline: {
      name: "Startup",
      stages: {
        code: { prompt: "SaaS startup landing page with hero, features, pricing table, testimonials, CTA, modern gradient design", type: "saas" },
        design: { tasks: [{ type: "image", count: 1, prompt: "startup logo minimalist tech" }, { type: "image", count: 3, prompt: "saas product screenshot mockup" }, { type: "design", count: 1, prompt: "hero banner gradient startup" }] },
        wrap: { theme: "startup-gradient", rtl: false },
        deploy: { platform: "vercel" },
      },
    },
  },
  {
    id: "blog",
    icon: "📝",
    titleHe: "בלוג",
    titleEn: "Blog",
    descHe: "בלוג אישי + 5 תמונות + favicon",
    descEn: "Personal blog + 5 images + favicon",
    savingsIls: 250,
    pipeline: {
      name: "Blog",
      stages: {
        code: { prompt: "Blog website with post list, article page, sidebar, tags, Hebrew RTL support", type: "blog" },
        design: { tasks: [{ type: "image", count: 5, prompt: "blog header image abstract" }] },
        wrap: { theme: "clean-blog", rtl: true },
        deploy: { platform: "github_pages" },
      },
    },
  },
];

export function getTemplate(id) {
  return PROFESSION_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function kidsTemplates() {
  return PROFESSION_TEMPLATES.filter((t) => t.id === "school");
}
