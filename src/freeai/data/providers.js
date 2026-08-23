/**
 * FreeAI Hub — registry of AI providers with generous free tiers.
 * Credits/limits are approximate defaults; users can override in creditStore.
 */

import { CODE_PROVIDERS } from "./codeProviders.js";
import { DEPLOY_PROVIDERS } from "./deployProviders.js";

/** @typedef {'image'|'video'|'design'|'edit'|'upscale'|'audio'|'text'|'3d'|'code'|'deploy'|'host'} Capability */
/** @typedef {'api'|'browser'|'app'|'local'} AccessMode */
/** @typedef {'daily'|'monthly'|'one_time'|'unlimited'} ResetPeriod */

/**
 * @typedef {object} Provider
 * @property {string} id
 * @property {string} name
 * @property {string} nameHe
 * @property {Capability[]} capabilities
 * @property {AccessMode} accessMode
 * @property {number} defaultCredits
 * @property {ResetPeriod} resetPeriod
 * @property {number} [costPerUnit] credits per generation unit
 * @property {string} url signup URL
 * @property {string} [generateUrl] direct tool URL
 * @property {boolean} hasApi
 * @property {boolean} needsKey
 * @property {string} quality 'high'|'medium'|'good'
 * @property {string} notesHe
 * @property {string} notesEn
 * @property {number} priority lower = prefer first
 */

/** @type {Provider[]} */
export const FREE_AI_PROVIDERS = [
  {
    id: "google_imagefx",
    name: "Google ImageFX",
    nameHe: "Google ImageFX (Labs)",
    capabilities: ["image"],
    accessMode: "browser",
    defaultCredits: 50,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://labs.google/fx/tools/image-fx",
    generateUrl: "https://labs.google/fx/tools/image-fx",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "Imagen 3 — איכות גבוהה, חינם עם חשבון Google",
    notesEn: "Imagen 3 — high quality, free with Google account",
    priority: 1,
  },
  {
    id: "google_whisk",
    name: "Google Whisk",
    nameHe: "Google Whisk (Labs)",
    capabilities: ["image", "edit"],
    accessMode: "browser",
    defaultCredits: 30,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://labs.google/fx/tools/whisk",
    generateUrl: "https://labs.google/fx/tools/whisk",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "עריכת תמונות ויצירה מתמונה+סגנון",
    notesEn: "Image editing and style transfer from reference images",
    priority: 2,
  },
  {
    id: "google_veo",
    name: "Google Veo",
    nameHe: "Google Veo (Labs)",
    capabilities: ["video"],
    accessMode: "browser",
    defaultCredits: 5,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://labs.google/fx/tools/video-fx",
    generateUrl: "https://labs.google/fx/tools/video-fx",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "וידאו AI מ-Google — מכסה מוגבל יומי",
    notesEn: "Google AI video — limited daily quota",
    priority: 3,
  },
  {
    id: "pollinations",
    name: "Pollinations.ai",
    nameHe: "Pollinations.ai",
    capabilities: ["image"],
    accessMode: "api",
    defaultCredits: 9999,
    resetPeriod: "unlimited",
    costPerUnit: 0,
    url: "https://pollinations.ai",
    hasApi: true,
    needsKey: false,
    quality: "good",
    notesHe: "API חינמי ללא מפתח — ישירות מהכלי",
    notesEn: "Free API, no key — generate directly in this tool",
    priority: 0,
  },
  {
    id: "leonardo",
    name: "Leonardo.ai",
    nameHe: "Leonardo.ai",
    capabilities: ["image", "design", "3d"],
    accessMode: "browser",
    defaultCredits: 150,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://app.leonardo.ai",
    generateUrl: "https://app.leonardo.ai/image-generation",
    hasApi: true,
    needsKey: true,
    quality: "high",
    notesHe: "~150 טוקנים יומיים חינם",
    notesEn: "~150 free daily tokens",
    priority: 4,
  },
  {
    id: "ideogram",
    name: "Ideogram",
    nameHe: "Ideogram",
    capabilities: ["image", "design"],
    accessMode: "browser",
    defaultCredits: 25,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://ideogram.ai",
    generateUrl: "https://ideogram.ai/t/explore",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "טקסט בתמונה מעולה — 25 יומי בחינם",
    notesEn: "Excellent text-in-image — 25 free daily",
    priority: 5,
  },
  {
    id: "bing_creator",
    name: "Microsoft Designer",
    nameHe: "Microsoft Designer / Bing",
    capabilities: ["image", "design"],
    accessMode: "browser",
    defaultCredits: 15,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://designer.microsoft.com",
    generateUrl: "https://designer.microsoft.com/image-creator",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "DALL-E 3 דרך Microsoft — Boosts יומיים",
    notesEn: "DALL-E 3 via Microsoft — daily boosts",
    priority: 6,
  },
  {
    id: "adobe_firefly",
    name: "Adobe Firefly",
    nameHe: "Adobe Firefly",
    capabilities: ["image", "edit", "design"],
    accessMode: "browser",
    defaultCredits: 25,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://firefly.adobe.com",
    generateUrl: "https://firefly.adobe.com/generate/images",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "25 קרדיטים חינם בחודש",
    notesEn: "25 free generative credits per month",
    priority: 7,
  },
  {
    id: "canva_ai",
    name: "Canva AI",
    nameHe: "Canva AI",
    capabilities: ["image", "design", "edit"],
    accessMode: "browser",
    defaultCredits: 50,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://www.canva.com/ai-image-generator",
    hasApi: false,
    needsKey: false,
    quality: "good",
    notesHe: "Magic Studio — חינם עם חשבון Canva",
    notesEn: "Magic Studio — free with Canva account",
    priority: 8,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    nameHe: "Hugging Face Inference",
    capabilities: ["image", "text"],
    accessMode: "api",
    defaultCredits: 1000,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://huggingface.co/settings/tokens",
    hasApi: true,
    needsKey: true,
    quality: "good",
    notesHe: "Flux, SDXL ועוד — דורש API token חינמי",
    notesEn: "Flux, SDXL and more — requires free API token",
    priority: 9,
  },
  {
    id: "replicate",
    name: "Replicate",
    nameHe: "Replicate",
    capabilities: ["image", "video", "audio"],
    accessMode: "api",
    defaultCredits: 5,
    resetPeriod: "one_time",
    costPerUnit: 1,
    url: "https://replicate.com",
    hasApi: true,
    needsKey: true,
    quality: "high",
    notesHe: "$5 קרדיט חינם לחשבון חדש",
    notesEn: "$5 free credit for new accounts",
    priority: 10,
  },
  {
    id: "runway",
    name: "Runway",
    nameHe: "Runway Gen-3",
    capabilities: ["video", "edit"],
    accessMode: "browser",
    defaultCredits: 125,
    resetPeriod: "one_time",
    costPerUnit: 5,
    url: "https://runwayml.com",
    generateUrl: "https://app.runwayml.com",
    hasApi: true,
    needsKey: true,
    quality: "high",
    notesHe: "125 קרדיטים חינם — וידאו איכותי",
    notesEn: "125 free credits — high-quality video",
    priority: 11,
  },
  {
    id: "pika",
    name: "Pika Labs",
    nameHe: "Pika Labs",
    capabilities: ["video"],
    accessMode: "browser",
    defaultCredits: 30,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://pika.art",
    hasApi: false,
    needsKey: false,
    quality: "good",
    notesHe: "וידאו מתמונה — tier חינמי",
    notesEn: "Image-to-video — free tier",
    priority: 12,
  },
  {
    id: "luma",
    name: "Luma Dream Machine",
    nameHe: "Luma Dream Machine",
    capabilities: ["video", "3d"],
    accessMode: "browser",
    defaultCredits: 30,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://lumalabs.ai/dream-machine",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "וידאו AI — 30 יצירות חינם בחודש",
    notesEn: "AI video — 30 free generations per month",
    priority: 13,
  },
  {
    id: "kling",
    name: "Kling AI",
    nameHe: "Kling AI",
    capabilities: ["video", "image"],
    accessMode: "browser",
    defaultCredits: 66,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://klingai.com",
    hasApi: false,
    needsKey: false,
    quality: "high",
    notesHe: "66 קרדיטים יומיים — וידאו ותמונה",
    notesEn: "66 daily credits — video and image",
    priority: 14,
  },
  {
    id: "meta_ai",
    name: "Meta AI",
    nameHe: "Meta AI",
    capabilities: ["image"],
    accessMode: "browser",
    defaultCredits: 50,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://www.meta.ai",
    hasApi: false,
    needsKey: false,
    quality: "good",
    notesHe: "יצירת תמונות חינם — WhatsApp/Instagram/Meta",
    notesEn: "Free image generation via Meta ecosystem",
    priority: 15,
  },
  {
    id: "clipdrop",
    name: "Clipdrop",
    nameHe: "Clipdrop (Stability)",
    capabilities: ["edit", "upscale", "image"],
    accessMode: "browser",
    defaultCredits: 20,
    resetPeriod: "daily",
    costPerUnit: 1,
    url: "https://clipdrop.co",
    hasApi: true,
    needsKey: true,
    quality: "good",
    notesHe: "הסרת רקע, upscale, relight — חינם מוגבל",
    notesEn: "Background removal, upscale, relight — limited free",
    priority: 16,
  },
  {
    id: "capcut",
    name: "CapCut AI",
    nameHe: "CapCut AI",
    capabilities: ["video", "edit"],
    accessMode: "app",
    defaultCredits: 10,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://www.capcut.com/ai",
    hasApi: false,
    needsKey: false,
    quality: "good",
    notesHe: "עריכת וידאו AI — חינם עם מגבלות",
    notesEn: "AI video editing — free with limits",
    priority: 17,
  },
  {
    id: "remove_bg",
    name: "Remove.bg",
    nameHe: "Remove.bg",
    capabilities: ["edit"],
    accessMode: "api",
    defaultCredits: 1,
    resetPeriod: "monthly",
    costPerUnit: 1,
    url: "https://www.remove.bg/api",
    hasApi: true,
    needsKey: true,
    quality: "high",
    notesHe: "1 תמונה חינם בחודש — הסרת רקע",
    notesEn: "1 free image per month — background removal",
    priority: 18,
  },
];

/** All providers merged — creative + code + deploy */
export const ALL_PROVIDERS = [...FREE_AI_PROVIDERS, ...CODE_PROVIDERS, ...DEPLOY_PROVIDERS];

/** @type {Record<Capability, { labelHe: string; labelEn: string; icon: string }>} */
export const CAPABILITY_META = {
  image: { labelHe: "תמונות", labelEn: "Images", icon: "🖼️" },
  video: { labelHe: "וידאו", labelEn: "Video", icon: "🎬" },
  design: { labelHe: "עיצוב", labelEn: "Design", icon: "🎨" },
  edit: { labelHe: "עריכה", labelEn: "Editing", icon: "✂️" },
  upscale: { labelHe: "הגדלה", labelEn: "Upscale", icon: "🔍" },
  audio: { labelHe: "אודיו", labelEn: "Audio", icon: "🎵" },
  text: { labelHe: "טקסט", labelEn: "Text", icon: "📝" },
  "3d": { labelHe: "תלת-ממד", labelEn: "3D", icon: "🧊" },
  code: { labelHe: "קוד", labelEn: "Code", icon: "💻" },
  deploy: { labelHe: "Deploy", labelEn: "Deploy", icon: "🚀" },
  host: { labelHe: "אירוח", labelEn: "Hosting", icon: "🌐" },
};

export function getProvider(id) {
  return ALL_PROVIDERS.find((p) => p.id === id) ?? null;
}

export function providersForCapability(cap) {
  return ALL_PROVIDERS.filter((p) => p.capabilities.includes(cap))
    .sort((a, b) => a.priority - b.priority);
}

export function providersForStage(stage) {
  const capMap = { code: "code", design: "image", wrap: "design", deploy: "deploy" };
  const cap = capMap[stage] || stage;
  return providersForCapability(cap);
}

export function apiProviders() {
  return ALL_PROVIDERS.filter((p) => p.hasApi && p.accessMode === "api");
}

export function browserProviders() {
  return ALL_PROVIDERS.filter((p) => p.accessMode === "browser" || p.accessMode === "app");
}

export function googleLabsProviders() {
  return ALL_PROVIDERS.filter((p) => p.id.startsWith("google_"));
}

export function codeProviders() {
  return CODE_PROVIDERS;
}

export function deployProviders() {
  return DEPLOY_PROVIDERS;
}
