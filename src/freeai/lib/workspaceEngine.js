/**
 * Workspace engine — routes user prompts + attachments to the right FreeAI backend.
 */

import { generateFree } from "./router.js";
import { runFullPipeline, runUrgentMode } from "./pipelineEngine.js";
import { buildProjectPlan, parseProjectDescription } from "./planner.js";
import { generateCodeScaffold } from "./generators/codeGenerator.js";
import { generatePollinationsBatch, validatePrompt } from "./generators/pollinations.js";
import { withImageFallback } from "./visualFallback.js";

function mapImages(images, prompt) {
  return (images || []).map((img) => withImageFallback(img, prompt));
}
import { optimizePromptForProvider } from "./smartPrompt.js";
import { applyBrandToPrompt, loadBrandKit } from "./brandKit.js";
import { calculateCreditScore } from "./creditScore.js";
import { addSavings, calcTasksSavings } from "./savingsCalculator.js";
import { chatWithAI } from "./chatEngine.js";

/** @typedef {'chat'|'image'|'code'|'video'|'design'|'project'|'edit'} WorkspaceMode */

export const MODES = [
  { id: "chat", icon: "💬", labelHe: "צ'אט", labelEn: "Chat", descHe: "שאל כל שאלה — קבל תשובה חכמה", descEn: "Ask anything — get smart answers" },
  { id: "image", icon: "🖼️", labelHe: "תמונה", labelEn: "Image", descHe: "צור תמונות AI בחינם", descEn: "Create AI images for free" },
  { id: "code", icon: "💻", labelHe: "קוד", labelEn: "Code", descHe: "בנה אתר / אפליקציה", descEn: "Build website / app" },
  { id: "video", icon: "🎬", labelHe: "וידאו", labelEn: "Video", descHe: "וידאו מתמונה / prompt", descEn: "Video from image / prompt" },
  { id: "design", icon: "🎨", labelHe: "עיצוב", labelEn: "Design", descHe: "לוגו, באנר, poster", descEn: "Logo, banner, poster" },
  { id: "project", icon: "🚀", labelHe: "פרויקט שלם", labelEn: "Full project", descHe: "קוד + עיצוב + deploy", descEn: "Code + design + deploy" },
  { id: "edit", icon: "✂️", labelHe: "עריכה", labelEn: "Edit", descHe: "ערוך / upscale / הסר רקע", descEn: "Edit / upscale / remove bg" },
];

const STORAGE_KEY = "freeai_workspace_history_v1";

export function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const history = loadHistory();
  const idx = history.findIndex((s) => s.id === session.id);
  if (idx >= 0) history[idx] = session;
  else history.unshift(session);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
  }
  return session;
}

export function createSession(mode = "chat") {
  return {
    id: `ws-${Date.now()}`,
    title: "",
    mode,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function processWorkspaceRequest(input) {
  const { prompt, mode, attachments = [], urgent = false, history = [] } = input;
  const brand = loadBrandKit();
  const enrichedPrompt = applyBrandToPrompt(prompt, brand);
  const score = calculateCreditScore();

  if (!prompt.trim() && attachments.length === 0) {
    return { ok: false, reason: "empty_input" };
  }

  const imageAttachment = attachments.find((a) => a.kind === "image");

  switch (mode) {
    case "image": return handleImage(enrichedPrompt);
    case "code": return handleCode(enrichedPrompt, attachments);
    case "video": return handleVideo(enrichedPrompt, imageAttachment);
    case "design": return handleDesign(enrichedPrompt);
    case "project": return handleProject(enrichedPrompt, urgent);
    case "edit": return handleEdit(enrichedPrompt, imageAttachment);
    default: return handleChat(enrichedPrompt, attachments, score, history);
  }
}

async function handleImage(prompt) {
  const res = await generateFree({ type: "image", prompt, count: 2 });
  if (res.ok && res.images) {
    const savings = calcTasksSavings([{ type: "image", count: res.images.length }]);
    addSavings(savings);
    return { ok: true, type: "image", provider: res.provider || "pollinations", images: mapImages(res.images, prompt), text: `נוצרו ${res.images.length} תמונות בחינם`, textEn: `Generated ${res.images.length} images for free`, savings };
  }
  const batch = generatePollinationsBatch(prompt, 2);
  return { ok: true, type: "image", provider: "pollinations", images: mapImages(batch.images, prompt), text: `נוצרו ${batch.images.length} תמונות`, textEn: `Generated ${batch.images.length} images` };
}

async function handleCode(prompt, attachments) {
  const type = detectCodeType(prompt);
  const scaffold = generateCodeScaffold({ prompt, type, brand: loadBrandKit() });
  addSavings(200);
  return { ok: true, type: "code", provider: "freeai-scaffold", code: scaffold.code, files: scaffold.files, text: "קוד מוכן — HTML/CSS/JS", textEn: "Code ready — HTML/CSS/JS", downloadReady: true };
}

async function handleVideo(prompt, imageAttachment) {
  const plan = buildProjectPlan([{ type: "video", count: 1, prompt }]);
  return {
    ok: true, type: "video", provider: plan.steps[0]?.providerId || "google_veo", plan: plan.steps,
    text: imageAttachment ? "פתח Kling / Veo / Pika עם התמונה שהעלית" : `תוכנית וידאו: ${plan.steps.map((s) => s.providerName).join(", ")}`,
    textEn: "Video plan ready",
    links: plan.steps.filter((s) => s.generateUrl).map((s) => ({ name: s.providerName, url: s.generateUrl })),
    referenceImage: imageAttachment?.previewUrl,
  };
}

async function handleDesign(prompt) {
  const batch = generatePollinationsBatch(`design: ${prompt}`, 2);
  return { ok: true, type: "design", images: mapImages(batch.images, prompt), provider: "pollinations", text: "עיצובים מוכנים", textEn: "Designs ready" };
}

async function handleProject(prompt, urgent) {
  const result = urgent
    ? await runUrgentMode({ name: prompt.slice(0, 40), description: prompt })
    : await runFullPipeline({ name: prompt.slice(0, 40), description: prompt });
  if (result.ok) {
    addSavings(result.savingsIls || 500);
    return { ok: true, type: "project", state: result.state, savings: result.savingsIls, text: "פרויקט שלם מוכן!", textEn: "Full project ready!" };
  }
  const plan = buildProjectPlan(parseProjectDescription(prompt));
  return { ok: true, type: "project", partial: true, plan: plan.steps, state: result.state, text: result.messageHe || "תוכנית פרויקט מוכנה", textEn: result.messageEn || "Project plan ready" };
}

async function handleEdit(prompt, imageAttachment) {
  const plan = buildProjectPlan([{ type: "edit", count: 1, prompt }]);
  return {
    ok: true, type: "edit", plan: plan.steps, referenceImage: imageAttachment?.previewUrl,
    text: "פתח Clipdrop / Remove.bg / Whisk", textEn: "Open Clipdrop / Remove.bg / Whisk",
    links: plan.steps.map((s) => ({ name: s.providerName, url: s.generateUrl })),
  };
}

async function handleChat(prompt, attachments, score, history = []) {
  if (/תמונ|image|ציור|photo|draw/i.test(prompt) && !/איך|how|מה זה|explain/i.test(prompt)) {
    const optimized = optimizePromptForProvider(prompt, "pollinations", "image");
    const batch = generatePollinationsBatch(optimized, 1);
    return { ok: true, type: "chat", text: "הנה תמונה — עבור למצב 🖼️ לעוד:", textEn: "Here's an image — switch to 🖼️ for more:", images: mapImages(batch.images, optimized), suggestMode: "image", provider: "pollinations" };
  }

  const chatResult = await chatWithAI({
    prompt,
    history: history.map((m) => ({ role: m.role, content: m.content })),
    attachments,
  });

  if (chatResult.ok) {
    return {
      ok: true,
      type: "chat",
      text: chatResult.text,
      textEn: chatResult.textEn || chatResult.text,
      provider: chatResult.provider,
      model: chatResult.model,
      suggestMode: chatResult.suggestMode,
      needsApiKey: chatResult.needsApiKey,
    };
  }

  const text = `לא הצלחתי לענות כרגע. נסה שוב או עבור למצב 🖼️/💻.\n\nCredit Score: ${score.gradeHe}`;
  return { ok: true, type: "chat", text, textEn: "Could not respond — try again or switch mode.", provider: "freeai-local" };
}

function detectCodeType(prompt) {
  if (/מסעד|menu|food|restaurant/i.test(prompt)) return "menu";
  if (/חנות|shop|store|ecommerce/i.test(prompt)) return "landing";
  if (/portfolio|פורטפolio/i.test(prompt)) return "portfolio";
  if (/saas|startup|סטארט/i.test(prompt)) return "saas";
  if (/blog|בלוג/i.test(prompt)) return "blog";
  if (/בית ספר|school/i.test(prompt)) return "presentation";
  if (/נדל|real estate/i.test(prompt)) return "listing";
  return "landing";
}

export function parseAttachment(file) {
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const kind = detectFileKind(file);

  return new Promise((resolve) => {
    const att = { id, name: file.name, type: file.type, kind, size: file.size };
    if (kind === "image") {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ ...att, previewUrl: e.target.result });
      reader.readAsDataURL(file);
    } else if (kind === "csv" || kind === "code" || kind === "document") {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ ...att, content: e.target.result });
      reader.readAsText(file);
    } else {
      resolve(att);
    }
  });
}

function detectFileKind(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "text/csv" || file.name.endsWith(".csv")) return "csv";
  if (/\.(html|css|js|jsx|ts|tsx|json|py|md)$/i.test(file.name)) return "code";
  if (file.type.startsWith("text/") || /\.(txt|doc|pdf)$/i.test(file.name)) return "document";
  return "other";
}

export const ACCEPTED_FILE_TYPES = "image/*,.csv,.txt,.html,.css,.js,.jsx,.ts,.tsx,.json,.md,.pdf";
