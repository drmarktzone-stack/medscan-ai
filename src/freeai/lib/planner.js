/**
 * FreeAI Hub — smart project planner.
 * Given a project spec, builds an optimal free-credit execution plan.
 */

import { FREE_AI_PROVIDERS, providersForCapability } from "../data/providers.js";
import { loadCreditState } from "./creditStore.js";

/**
 * @typedef {object} TaskSpec
 * @property {string} type 'image'|'video'|'design'|'edit'|'upscale'
 * @property {number} count
 * @property {string} [prompt]
 * @property {string} [notes]
 */

/**
 * @typedef {object} PlanStep
 * @property {number} step
 * @property {string} providerId
 * @property {string} providerName
 * @property {string} taskType
 * @property {number} units
 * @property {number} creditCost
 * @property {string} accessMode
 * @property {string} [generateUrl]
 * @property {boolean} canGenerateHere
 * @property {string} instructionHe
 * @property {string} instructionEn
 */

/**
 * @param {TaskSpec[]} tasks
 * @param {string} [locale]
 * @returns {{ steps: PlanStep[]; totalCredits: number; fullyCovered: boolean; gaps: object[]; summaryHe: string; summaryEn: string }}
 */
export function buildProjectPlan(tasks, locale = "he") {
  const creditState = loadCreditState();
  const steps = [];
  const gaps = [];
  let totalCredits = 0;
  let stepNum = 0;

  for (const task of tasks) {
    let remaining = task.count;
    const providers = providersForCapability(task.type)
      .filter((p) => creditState[p.id]?.enabled !== false)
      .sort((a, b) => {
        const aRem = creditState[a.id]?.remaining ?? 0;
        const bRem = creditState[b.id]?.remaining ?? 0;
        const aCan = aRem >= (a.costPerUnit ?? 1) ? 1 : 0;
        const bCan = bRem >= (b.costPerUnit ?? 1) ? 1 : 0;
        if (bCan !== aCan) return bCan - aCan;
        if (a.accessMode === "api" && a.needsKey === false) return -1;
        if (b.accessMode === "api" && b.needsKey === false) return 1;
        return a.priority - b.priority;
      });

    for (const provider of providers) {
      if (remaining <= 0) break;

      const available = creditState[provider.id]?.remaining ?? 0;
      const costPer = provider.costPerUnit ?? 1;
      if (available < costPer) continue;

      const maxUnits = Math.floor(available / costPer);
      const units = Math.min(remaining, maxUnits);
      const creditCost = units * costPer;

      stepNum += 1;
      const canGenerateHere = provider.id === "pollinations" ||
        (provider.hasApi && provider.accessMode === "api" && !provider.needsKey);

      steps.push({
        step: stepNum,
        providerId: provider.id,
        providerName: locale === "he" ? provider.nameHe : provider.name,
        taskType: task.type,
        units,
        creditCost,
        accessMode: provider.accessMode,
        generateUrl: provider.generateUrl || provider.url,
        canGenerateHere,
        prompt: task.prompt,
        instructionHe: buildInstructionHe(provider, task, units),
        instructionEn: buildInstructionEn(provider, task, units),
      });

      totalCredits += creditCost;
      remaining -= units;
    }

    if (remaining > 0) {
      gaps.push({
        type: task.type,
        missing: remaining,
        messageHe: `חסרות ${remaining} יחידות ${task.type} — אין מספיק קרדיטים חינמיים`,
        messageEn: `Missing ${remaining} ${task.type} units — not enough free credits`,
      });
    }
  }

  const fullyCovered = gaps.length === 0;
  const summaryHe = fullyCovered
    ? `הפרויקט מכוסה במלואו ב-${totalCredits} קרדיטים חינמיים ב-${steps.length} שלבים`
    : `מכוסה חלקית: ${totalCredits} קרדיטים, ${gaps.length} פערים — הוסף חשבונות או המתן לאיפוס יומי`;
  const summaryEn = fullyCovered
    ? `Project fully covered with ${totalCredits} free credits across ${steps.length} steps`
    : `Partially covered: ${totalCredits} credits, ${gaps.length} gaps — add accounts or wait for daily reset`;

  return { steps, totalCredits, fullyCovered, gaps, summaryHe, summaryEn };
}

function buildInstructionHe(provider, task, units) {
  if (provider.id === "pollinations") {
    return `לחץ "יצור כאן" — ${units} תמונות ייווצרו אוטומטית`;
  }
  if (provider.accessMode === "browser") {
    return `פתח ${provider.nameHe}, צור ${units} ${task.type}${task.prompt ? `: "${task.prompt.slice(0, 60)}"` : ""}, וסמן כבוצע`;
  }
  if (provider.accessMode === "api") {
    return `הזן API key של ${provider.nameHe} והפעל יצירה — ${units} יחידות`;
  }
  return `השתמש ב-${provider.nameHe} ל-${units} יחידות`;
}

function buildInstructionEn(provider, task, units) {
  if (provider.id === "pollinations") {
    return `Click "Generate here" — ${units} images will be created automatically`;
  }
  if (provider.accessMode === "browser") {
    return `Open ${provider.name}, create ${units} ${task.type}${task.prompt ? `: "${task.prompt.slice(0, 60)}"` : ""}, then mark done`;
  }
  if (provider.accessMode === "api") {
    return `Enter ${provider.name} API key and generate — ${units} units`;
  }
  return `Use ${provider.name} for ${units} units`;
}

/**
 * Parse natural-language project description into task specs.
 * @param {string} description
 * @returns {TaskSpec[]}
 */
export function parseProjectDescription(description) {
  const text = description.toLowerCase();
  const tasks = [];

  const patterns = [
    { re: /(\d+)\s*(?:תמונ|image|תמונה|images?|poster|פוסט)/gi, type: "image" },
    { re: /(\d+)\s*(?:וידאו|video|סרט|clip)/gi, type: "video" },
    { re: /(\d+)\s*(?:עיצוב|design|banner|באנר|logo|לוגו)/gi, type: "design" },
    { re: /(\d+)\s*(?:עריכ|edit|remove|הסר)/gi, type: "edit" },
    { re: /(\d+)\s*(?:upscale|הגדל)/gi, type: "upscale" },
  ];

  for (const { re, type } of patterns) {
    let m;
    const regex = new RegExp(re.source, re.flags);
    while ((m = regex.exec(text)) !== null) {
      tasks.push({ type, count: parseInt(m[1], 10), prompt: description });
    }
  }

  if (tasks.length === 0) {
    if (/וידאו|video|סרט|clip|animate|הנפש/i.test(text)) {
      tasks.push({ type: "video", count: 1, prompt: description });
    } else if (/עיצוב|design|banner|logo|פוסט/i.test(text)) {
      tasks.push({ type: "design", count: 3, prompt: description });
    } else {
      tasks.push({ type: "image", count: 5, prompt: description });
    }
  }

  return tasks;
}

/**
 * Dashboard summary of all available free credits.
 */
export function getCreditsDashboard() {
  const creditState = loadCreditState();
  const byCapability = {};
  let grandTotal = 0;

  for (const p of FREE_AI_PROVIDERS) {
    if (creditState[p.id]?.enabled === false) continue;
    const rem = creditState[p.id]?.remaining ?? 0;
    grandTotal += rem;
    for (const cap of p.capabilities) {
      byCapability[cap] = (byCapability[cap] || 0) + rem;
    }
  }

  const providers = FREE_AI_PROVIDERS.map((p) => ({
    ...p,
    remaining: creditState[p.id]?.remaining ?? 0,
    enabled: creditState[p.id]?.enabled !== false,
  })).sort((a, b) => b.remaining - a.remaining);

  return { grandTotal, byCapability, providers };
}
