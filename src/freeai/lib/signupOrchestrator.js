/**
 * Signup Orchestrator — sequential wizard that guides user through all platforms.
 * Opens signup tabs, copies email, tracks completion.
 */

import { buildHarvestPlan, completeHarvestStep, buildSignupUrl } from "./creditHarvester.js";
import { loadPassport, getPrimaryEmail } from "./creditPassport.js";
import { getProvider } from "../data/providers.js";

/**
 * @typedef {object} OrchestratorState
 * @property {number} currentStep
 * @property {object[]} steps
 * @property {string} email
 * @property {'idle'|'running'|'paused'|'done'} status
 * @property {number} creditsHarvested
 */

const ORCH_KEY = "freeai_orchestrator_v1";
let memoryState = null;

export function loadOrchestratorState() {
  if (memoryState) return memoryState;
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(ORCH_KEY) || "null");
  } catch {
    return null;
  }
}

function saveOrchestratorState(state) {
  memoryState = state;
  if (typeof window !== "undefined") {
    localStorage.setItem(ORCH_KEY, JSON.stringify(state));
  }
}

/**
 * Initialize orchestrator for email.
 */
export function initOrchestrator(email) {
  const plan = buildHarvestPlan(email);
  const state = {
    currentStep: 0,
    steps: plan.steps,
    email,
    status: "idle",
    creditsHarvested: 0,
    startedAt: new Date().toISOString(),
  };
  saveOrchestratorState(state);
  return state;
}

/**
 * Get current step details.
 */
export function getCurrentStep() {
  const state = loadOrchestratorState();
  if (!state || state.currentStep >= state.steps.length) return null;
  return { ...state.steps[state.currentStep], index: state.currentStep, total: state.steps.length };
}

/**
 * Open signup for current step in new tab + copy email to clipboard.
 */
export async function openCurrentSignup() {
  const step = getCurrentStep();
  const email = getPrimaryEmail();
  if (!step || !email) return { ok: false, reason: "no_step" };

  const url = step.signupUrl || buildSignupUrl(step.providerId, email);

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      /* clipboard may fail */
    }
  }

  return { ok: true, url, emailCopied: true, step };
}

/**
 * Mark current step done and advance.
 */
export function advanceOrchestrator() {
  const state = loadOrchestratorState();
  if (!state) return { ok: false, reason: "no_state" };

  const step = state.steps[state.currentStep];
  if (!step) return { ok: false, reason: "no_step", done: true };

  const providerIds = step.type === "oauth_cluster"
    ? step.providerIds
    : [step.providerId];

  completeHarvestStep(providerIds);

  const creditsAdded = step.credits || 0;
  state.creditsHarvested += creditsAdded;
  state.currentStep += 1;

  if (state.currentStep >= state.steps.length) {
    state.status = "done";
    state.completedAt = new Date().toISOString();
  } else {
    state.status = "running";
  }

  saveOrchestratorState(state);
  return {
    ok: true,
    state,
    done: state.status === "done",
    creditsAdded,
    nextStep: state.currentStep < state.steps.length ? state.steps[state.currentStep] : null,
  };
}

/**
 * Skip current step without claiming.
 */
export function skipCurrentStep() {
  const state = loadOrchestratorState();
  if (!state) return { ok: false };
  state.currentStep += 1;
  if (state.currentStep >= state.steps.length) state.status = "done";
  saveOrchestratorState(state);
  return { ok: true, state };
}

export function resetOrchestrator() {
  memoryState = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ORCH_KEY);
  }
}

/**
 * Run autopilot — open all remaining signups with delay (user completes each).
 * @param {number} delayMs
 * @param {(step: object) => void} onStep
 */
export function runAutopilot(onStep, delayMs = 3000) {
  const state = loadOrchestratorState();
  if (!state) return { ok: false, reason: "no_state" };

  state.status = "running";
  saveOrchestratorState(state);

  let idx = state.currentStep;
  const interval = setInterval(() => {
    if (idx >= state.steps.length) {
      clearInterval(interval);
      state.status = "done";
      saveOrchestratorState(state);
      return;
    }
    state.currentStep = idx;
    saveOrchestratorState(state);
    onStep?.(state.steps[idx]);
    idx += 1;
  }, delayMs);

  return { ok: true, stop: () => clearInterval(interval) };
}

/**
 * Instructions for current step.
 */
export function getStepInstructions(step, locale = "he") {
  if (!step) return "";

  if (step.type === "oauth_cluster") {
    return locale === "he"
      ? `הירשם/התחבר עם ${step.email} — זה יפתח ${step.providerIds.length} כלים בבת אחת (${step.credits} קרדיטים)`
      : `Sign up/login with ${step.email} — unlocks ${step.providerIds.length} tools (${step.credits} credits)`;
  }

  const p = getProvider(step.providerId);
  return locale === "he"
    ? `1. לחץ "פתח הרשמה"\n2. הירשם עם ${step.email}\n3. אמת מייל אם נדרש\n4. לחץ "סיימתי ✓"\n→ ${p?.defaultCredits || step.credits} קרדיטים ב-${p?.nameHe || step.name}`
    : `1. Click "Open signup"\n2. Register with ${step.email}\n3. Verify email if needed\n4. Click "Done ✓"\n→ ${step.credits} credits on ${step.nameEn || step.name}`;
}
