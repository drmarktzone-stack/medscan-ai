/**
 * Full pipeline engine: Code → Design → Wrap → Deploy
 * Transparently switches between free providers in the background.
 */

import { providersForStage, getProvider } from "../data/providers.js";
import { loadCreditState, useCredits, saveProject } from "./creditStore.js";
import { isProviderClaimed } from "./creditPassport.js";
import { generateCodeScaffold } from "./generators/codeGenerator.js";
import { generatePollinationsBatch } from "./generators/pollinations.js";
import { withImageFallback } from "./visualFallback.js";
import { buildProjectPlan } from "./planner.js";
import { optimizePromptForProvider } from "./smartPrompt.js";
import { calcProjectSavings } from "./savingsCalculator.js";
import { canStartFullProject, consumeProjectQuota } from "./projectQuota.js";

/** @typedef {'code'|'design'|'wrap'|'deploy'} PipelineStage */

/**
 * @typedef {object} PipelineSpec
 * @property {string} name
 * @property {object} stages
 */

/**
 * @typedef {object} PipelineState
 * @property {string} id
 * @property {string} name
 * @property {PipelineStage} currentStage
 * @property {Record<string, object>} stageResults
 * @property {string[]} providerLog
 * @property {number} savingsIls
 * @property {string} status 'running'|'paused'|'completed'|'failed'
 * @property {string} createdAt
 */

const STAGES = /** @type {PipelineStage[]} */ (["code", "design", "wrap", "deploy"]);

/**
 * Find next available provider for a stage (auto-switch on exhaustion).
 * @param {PipelineStage} stage
 * @param {string[]} [excludeIds]
 */
export function pickProvider(stage, excludeIds = []) {
  const creditState = loadCreditState();
  const providers = providersForStage(stage).filter((p) => {
    if (excludeIds.includes(p.id)) return false;
    if (creditState[p.id]?.enabled === false) return false;
    const rem = creditState[p.id]?.remaining ?? 0;
    return rem >= (p.costPerUnit ?? 1);
  }).sort((a, b) => {
    const aClaimed = isProviderClaimed(a.id) ? 0 : 1;
    const bClaimed = isProviderClaimed(b.id) ? 0 : 1;
    if (aClaimed !== bClaimed) return aClaimed - bClaimed;
    if (a.accessMode === "api" && !a.needsKey) return -1;
    if (b.accessMode === "api" && !b.needsKey) return 1;
    return a.priority - b.priority;
  });

  const inApp = providers.find((p) =>
    p.accessMode === "api" && !p.needsKey && (p.id === "pollinations" || p.id === "pollinations_text")
  );
  if (inApp) return inApp;

  const apiWithKey = providers.find((p) => p.hasApi && p.accessMode === "api");
  if (apiWithKey) return apiWithKey;

  return providers[0] ?? null;
}

/**
 * Execute one pipeline stage with automatic provider switching.
 * @param {PipelineState} state
 * @param {PipelineStage} stage
 * @param {object} spec
 */
export async function executeStage(state, stage, spec) {
  const excludeIds = [];
  let provider = pickProvider(stage, excludeIds);
  const log = [];

  while (provider) {
    log.push({ stage, providerId: provider.id, providerName: provider.nameHe, at: new Date().toISOString() });

    if (stage === "code") {
      const result = await runCodeStage(provider, spec, state);
      if (result.ok) {
        useCredits(provider.id, 1);
        return { ok: true, result: result.data, provider: provider.id, log };
      }
      if (result.reason === "insufficient_credits" || result.reason === "provider_failed") {
        excludeIds.push(provider.id);
        provider = pickProvider(stage, excludeIds);
        continue;
      }
      return { ok: false, reason: result.reason, log };
    }

    if (stage === "design") {
      const result = await runDesignStage(provider, spec, state);
      if (result.ok) {
        if (provider.costPerUnit > 0) useCredits(provider.id, result.unitsUsed || 1);
        return { ok: true, result: result.data, provider: provider.id, log };
      }
      excludeIds.push(provider.id);
      provider = pickProvider(stage, excludeIds);
      continue;
    }

    if (stage === "wrap") {
      const result = runWrapStage(spec, state);
      return { ok: true, result: result.data, provider: "local", log };
    }

    if (stage === "deploy") {
      const result = runDeployStage(provider, spec, state);
      if (result.ok) {
        if (provider.costPerUnit > 0) useCredits(provider.id, 1);
        return { ok: true, result: result.data, provider: provider.id, log };
      }
      excludeIds.push(provider.id);
      provider = pickProvider(stage, excludeIds);
      continue;
    }

    break;
  }

  return { ok: false, reason: "no_provider_available", log, retryAt: getNextResetHint(stage) };
}

async function runCodeStage(provider, spec, state) {
  const prompt = spec.prompt || state.name;

  if (provider.id === "pollinations_text") {
    const scaffold = generateCodeScaffold({ prompt, type: spec.type || "landing", brand: state.brand });
    return { ok: true, data: { code: scaffold.code, files: scaffold.files, provider: provider.id, method: "scaffold+ai" } };
  }

  if (provider.accessMode === "api" && !provider.needsKey) {
    const scaffold = generateCodeScaffold({ prompt, type: spec.type || "landing", brand: state.brand });
    return { ok: true, data: { code: scaffold.code, files: scaffold.files, provider: provider.id, method: "scaffold" } };
  }

  const optimized = optimizePromptForProvider(prompt, provider.id, "code");
  const scaffold = generateCodeScaffold({ prompt, type: spec.type || "landing", brand: state.brand });
  return {
    ok: true,
    data: {
      code: scaffold.code,
      files: scaffold.files,
      provider: provider.id,
      method: "scaffold",
      externalUrl: provider.generateUrl || provider.url,
      externalPrompt: optimized,
      needsBrowser: provider.accessMode === "browser" || provider.accessMode === "app",
    },
  };
}

async function runDesignStage(provider, spec, state) {
  const tasks = spec.tasks || [{ type: "image", count: 3, prompt: state.name }];
  const plan = buildProjectPlan(tasks);
  const images = [];
  let unitsUsed = 0;

  for (const step of plan.steps) {
    if (step.canGenerateHere && step.prompt) {
      const batch = generatePollinationsBatch(step.prompt, step.units);
      images.push(...batch.images.map((img) => withImageFallback(img, step.prompt)));
      unitsUsed += step.units;
    }
  }

  return {
    ok: true,
    data: { images, plan: plan.steps, provider: provider.id },
    unitsUsed,
  };
}

function runWrapStage(spec, state) {
  const codeResult = state.stageResults?.code;
  const designResult = state.stageResults?.design;
  const theme = spec.theme || "modern";
  const rtl = spec.rtl ?? true;

  const wrappedHtml = wrapProject({
    code: codeResult?.code || "",
    files: codeResult?.files || {},
    images: designResult?.images || [],
    theme,
    rtl,
    title: state.name,
  });

  return {
    ok: true,
    data: { html: wrappedHtml, theme, rtl, files: { "index.html": wrappedHtml, ...codeResult?.files } },
  };
}

function runDeployStage(provider, spec, state) {
  const wrapResult = state.stageResults?.wrap;
  const platform = spec.platform || provider.id;

  const instructions = {
    github_pages: {
      he: "1. צור repo ב-GitHub\n2. העלה את index.html\n3. Settings → Pages → main branch\n4. האתר חי תוך דקות!",
      en: "1. Create GitHub repo\n2. Upload index.html\n3. Settings → Pages → main branch\n4. Site live in minutes!",
      url: "https://pages.github.com",
    },
    netlify: {
      he: "1. גרור את התיקייה ל-app.netlify.com/drop\n2. האתר חי מיד!",
      en: "1. Drag folder to app.netlify.com/drop\n2. Site live instantly!",
      url: "https://app.netlify.com/drop",
    },
    vercel: {
      he: "1. ייבא repo ל-vercel.com/new\n2. Deploy אוטומטי",
      en: "1. Import repo to vercel.com/new\n2. Auto deploy",
      url: "https://vercel.com/new",
    },
  };

  const info = instructions[platform] || instructions.github_pages;

  return {
    ok: true,
    data: {
      platform,
      provider: provider.id,
      deployUrl: provider.generateUrl || provider.url,
      instructionsHe: info.he,
      instructionsEn: info.en,
      downloadReady: !!wrapResult?.html,
      html: wrapResult?.html,
    },
  };
}

function wrapProject({ code, files, images, theme, rtl, title }) {
  const heroImage = images[0]?.url || "";
  const css = THEME_CSS[theme] || THEME_CSS.modern;
  const dir = rtl ? 'dir="rtl"' : "";

  if (files["index.html"]) {
    let html = files["index.html"];
    if (heroImage && !html.includes(heroImage)) {
      html = html.replace("</head>", `<style>${css}</style></head>`);
    }
    return html;
  }

  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${dir}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "My Project"}</title>
  <style>${css}</style>
</head>
<body>
  ${heroImage ? `<img src="${heroImage}" alt="hero" class="hero-img" />` : ""}
  <main class="container">
    ${code || "<h1>Welcome</h1><p>Your project is ready!</p>"}
  </main>
  <footer><p>Built with FreeAI Hub — 100% free</p></footer>
</body>
</html>`;
}

const THEME_CSS = {
  modern: `*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6}.container{max-width:960px;margin:0 auto;padding:2rem}.hero-img{width:100%;max-height:400px;object-fit:cover;border-radius:1rem;margin-bottom:2rem}h1{font-size:2.5rem;margin-bottom:1rem;background:linear-gradient(135deg,#8b5cf6,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}footer{text-align:center;padding:2rem;opacity:0.5;font-size:0.875rem}`,
  "modern-shop": `*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#fafafa;color:#1a1a1a}.container{max-width:1200px;margin:0 auto;padding:2rem}.hero-img{width:100%;border-radius:0.5rem}h1{color:#2563eb}`,
  "warm-food": `body{font-family:Georgia,serif;background:#fff8f0;color:#3d2c1e}.container{max-width:800px;margin:0 auto;padding:2rem}`,
  "kids-colorful": `body{font-family:Comic Sans MS,cursive;background:linear-gradient(135deg,#fef3c7,#ddd6fe);color:#1e1b4b}.container{padding:2rem;text-align:center}h1{color:#7c3aed;font-size:2rem}`,
  "startup-gradient": `body{font-family:Inter,sans-serif;background:#0a0a0a;color:#fff}.container{max-width:960px;margin:0 auto;padding:4rem 2rem}h1{font-size:3.5rem;background:linear-gradient(135deg,#6366f1,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}`,
  "dark-portfolio": `body{font-family:system-ui;background:#111;color:#eee}.container{max-width:900px;margin:0 auto;padding:3rem 2rem}`,
  "clean-blog": `body{font-family:Merriweather,serif;background:#fff;color:#333;max-width:720px;margin:0 auto;padding:2rem;line-height:1.8}`,
  "luxury-estate": `body{font-family:Playfair Display,serif;background:#1a1a2e;color:#eee}.container{max-width:1100px;margin:0 auto;padding:2rem}`,
  social: `body{font-family:system-ui;background:#000;color:#fff;text-align:center;padding:2rem}`,
};

function getNextResetHint(stage) {
  return stage === "code" ? "daily" : "tomorrow";
}

/**
 * Run full pipeline: Code → Design → Wrap → Deploy
 * @param {object} input
 */
export async function runFullPipeline(input) {
  const quota = canStartFullProject();
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", messageHe: quota.messageHe, messageEn: quota.messageEn };
  }

  const state = /** @type {PipelineState} */ ({
    id: `proj-${Date.now()}`,
    name: input.name || "My Project",
    currentStage: "code",
    stageResults: {},
    providerLog: [],
    savingsIls: 0,
    status: "running",
    createdAt: new Date().toISOString(),
    brand: input.brand || null,
  });

  const spec = input.pipeline?.stages || input.stages || buildDefaultSpec(input);

  for (const stage of STAGES) {
    state.currentStage = stage;
    const stageSpec = spec[stage] || {};

    const result = await executeStage(state, stage, stageSpec);
    if (!result.ok) {
      state.status = "paused";
      state.providerLog.push(...(result.log || []).map((l) => `${l.stage}:${l.providerId}`));
      saveProject(state);
      return {
        ok: false,
        state,
        failedStage: stage,
        reason: result.reason,
        retryAt: result.retryAt,
        messageHe: `נעצר בשלב ${stage} — נסה שוב מחר כשקרדיטים מתאפסים`,
        messageEn: `Paused at ${stage} — retry tomorrow when credits reset`,
      };
    }

    state.stageResults[stage] = result.result;
    state.providerLog.push(...(result.log || []).map((l) => `${l.stage}:${l.providerId}`));
  }

  state.status = "completed";
  state.savingsIls = calcProjectSavings(input.templateId || "startup");
  consumeProjectQuota();
  saveProject(state);

  return { ok: true, state, savingsIls: state.savingsIls };
}

function buildDefaultSpec(input) {
  const desc = input.description || input.name || "landing page";
  return {
    code: { prompt: desc, type: "landing" },
    design: { tasks: [{ type: "image", count: 3, prompt: desc }] },
    wrap: { theme: "modern", rtl: true },
    deploy: { platform: "github_pages" },
  };
}

/**
 * Urgent mode — fastest path to something usable in ~10 minutes.
 */
export async function runUrgentMode(input) {
  const spec = {
    code: { prompt: input.description || "simple landing page", type: "landing" },
    design: { tasks: [{ type: "image", count: 1, prompt: input.description || "hero banner" }] },
    wrap: { theme: "modern", rtl: true },
    deploy: { platform: "github_pages" },
  };

  return runFullPipeline({ ...input, pipeline: { stages: spec }, urgent: true });
}

/**
 * Free Until Done — keeps retrying across days (stores paused state).
 */
export async function resumePipeline(projectId) {
  const projects = loadProjectsFromStore();
  const project = projects.find((p) => p.id === projectId);
  if (!project || project.status === "completed") {
    return { ok: false, reason: "not_found_or_done" };
  }

  const stageIdx = STAGES.indexOf(project.currentStage);
  const spec = project.pipelineSpec || buildDefaultSpec(project);

  for (let i = stageIdx; i < STAGES.length; i++) {
    const stage = STAGES[i];
    project.currentStage = stage;
    const result = await executeStage(project, stage, spec[stage] || {});
    if (!result.ok) {
      project.status = "paused";
      saveProject(project);
      return { ok: false, state: project, reason: result.reason };
    }
    project.stageResults[stage] = result.result;
  }

  project.status = "completed";
  saveProject(project);
  return { ok: true, state: project };
}

function loadProjectsFromStore() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("freeai_projects_v1") || "[]");
  } catch {
    return [];
  }
}

export { STAGES };
