import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALL_PROVIDERS, providersForCapability, googleLabsProviders, codeProviders, deployProviders } from "./data/providers.js";
import { buildProjectPlan, parseProjectDescription, getCreditsDashboard } from "./lib/planner.js";
import { buildPollinationsUrl, generatePollinationsBatch, validatePrompt } from "./lib/generators/pollinations.js";
import { generateCodeScaffold } from "./lib/generators/codeGenerator.js";
import { pickProvider, STAGES } from "./lib/pipelineEngine.js";
import { calcProjectSavings, calcTasksSavings } from "./lib/savingsCalculator.js";
import { optimizePromptForProvider, generateAllProviderPrompts } from "./lib/smartPrompt.js";
import { canStartFullProject, getQuotaState } from "./lib/projectQuota.js";
import { parseCsv, csvToTasks } from "./lib/csvImport.js";
import { PROFESSION_TEMPLATES, getTemplate } from "./data/templates.js";
import { scanCredits } from "./lib/creditRadar.js";
import { topPrompts } from "./lib/communityPrompts.js";

describe("FreeAI providers registry", () => {
  it("has 30+ providers total", () => {
    assert.ok(ALL_PROVIDERS.length >= 30);
  });

  it("includes Google Labs tools", () => {
    const labs = googleLabsProviders();
    assert.ok(labs.length >= 3);
  });

  it("includes code providers", () => {
    assert.ok(codeProviders().length >= 10);
    assert.ok(codeProviders().some((p) => p.id === "bolt_new"));
    assert.ok(codeProviders().some((p) => p.id === "v0_dev"));
  });

  it("includes deploy providers", () => {
    assert.ok(deployProviders().length >= 5);
    assert.ok(deployProviders().some((p) => p.id === "github_pages"));
  });

  it("filters by capability", () => {
    assert.ok(providersForCapability("code").length >= 10);
    assert.ok(providersForCapability("deploy").length >= 5);
  });
});

describe("FreeAI project planner", () => {
  it("parses Hebrew project description", () => {
    const tasks = parseProjectDescription("10 תמונות לפוסטים + 2 וידאו");
    assert.ok(tasks.some((t) => t.type === "image" && t.count === 10));
    assert.ok(tasks.some((t) => t.type === "video" && t.count === 2));
  });

  it("builds a plan covering image tasks", () => {
    const plan = buildProjectPlan([{ type: "image", count: 5, prompt: "product photo" }]);
    assert.ok(plan.steps.length > 0);
    const units = plan.steps.reduce((s, st) => s + st.units, 0);
    assert.ok(units >= 5);
  });

  it("dashboard returns grand total", () => {
    const dash = getCreditsDashboard();
    assert.ok(dash.grandTotal > 0);
    assert.ok(dash.providers.length >= 30);
  });
});

describe("Code generator", () => {
  it("generates landing page scaffold", () => {
    const result = generateCodeScaffold({ prompt: "חנות תכשיטים", type: "landing" });
    assert.ok(result.code.includes("<!DOCTYPE html>"));
    assert.ok(result.files["index.html"]);
  });

  it("generates menu page", () => {
    const result = generateCodeScaffold({ prompt: "restaurant", type: "menu" });
    assert.ok(result.code.includes("Menu") || result.code.includes("תפריט"));
  });

  it("detects RTL from Hebrew", () => {
    const result = generateCodeScaffold({ prompt: "אתר בעברית", type: "landing" });
    assert.ok(result.code.includes('dir="rtl"'));
  });
});

describe("Pipeline engine", () => {
  it("has 4 stages", () => {
    assert.deepEqual(STAGES, ["code", "design", "wrap", "deploy"]);
  });

  it("picks code provider", () => {
    const p = pickProvider("code");
    assert.ok(p);
    assert.ok(p.capabilities.includes("code"));
  });

  it("picks deploy provider", () => {
    const p = pickProvider("deploy");
    assert.ok(p);
  });
});

describe("Savings calculator", () => {
  it("calculates template savings", () => {
    assert.ok(calcProjectSavings("ecommerce") >= 400);
    assert.ok(calcProjectSavings("startup") >= 500);
  });

  it("calculates task savings", () => {
    const s = calcTasksSavings([{ type: "image", count: 10 }, { type: "video", count: 2 }]);
    assert.ok(s >= 100);
  });
});

describe("Smart prompt", () => {
  it("optimizes for provider", () => {
    const p = optimizePromptForProvider("כלב חמוד", "google_imagefx", "image");
    assert.ok(p.length > 10);
  });

  it("generates all provider prompts", () => {
    const all = generateAllProviderPrompts("product photo", "image");
    assert.ok(all.length >= 5);
  });
});

describe("Project quota", () => {
  it("allows 2 free projects", () => {
    const q = getQuotaState();
    assert.equal(q.max, 2);
    assert.ok(canStartFullProject().ok);
  });
});

describe("CSV import", () => {
  it("parses CSV", () => {
    const r = parseCsv("name,description\nShirt,Cotton\n");
    assert.ok(r.ok);
    assert.equal(r.count, 1);
  });

  it("converts to tasks", () => {
    const tasks = csvToTasks([{ name: "Shirt", description: "Blue" }]);
    assert.equal(tasks.length, 1);
    assert.ok(tasks[0].prompt.includes("Shirt"));
  });
});

describe("Templates", () => {
  it("has profession templates", () => {
    assert.ok(PROFESSION_TEMPLATES.length >= 8);
  });

  it("gets template by id", () => {
    const t = getTemplate("ecommerce");
    assert.ok(t);
    assert.ok(t.pipeline.stages.code);
  });
});

describe("Pollinations generator", () => {
  it("builds valid URL", () => {
    const url = buildPollinationsUrl("a cat", { seed: 42 });
    assert.ok(url.includes("pollinations.ai"));
  });

  it("generates batch", () => {
    const batch = generatePollinationsBatch("sunset", 3);
    assert.equal(batch.images.length, 3);
  });

  it("validates prompts", () => {
    assert.equal(validatePrompt("").ok, false);
    assert.equal(validatePrompt("hello world").ok, true);
  });
});

describe("Credit radar", () => {
  it("scans credits", () => {
    const scan = scanCredits("he");
    assert.ok(Array.isArray(scan.alerts));
    assert.ok(Array.isArray(scan.resetsToday));
  });
});

describe("Community prompts", () => {
  it("returns top prompts", () => {
    const top = topPrompts("image", 3);
    assert.ok(top.length >= 1);
  });
});

describe("Credit Passport", () => {
  it("validates email", async () => {
    const { saveEmail } = await import("./lib/creditPassport.js");
    assert.equal(saveEmail("bad").ok, false);
    assert.equal(saveEmail("user@test.com").ok, true);
  });

  it("generates email aliases", async () => {
    const { generateEmailAliases } = await import("./lib/creditPassport.js");
    const aliases = generateEmailAliases("user@gmail.com", 2);
    assert.equal(aliases.length, 2);
    assert.ok(aliases[0].includes("+freeai1@"));
  });
});

describe("Credit Harvester", () => {
  it("builds harvest plan", async () => {
    const { buildHarvestPlan } = await import("./lib/creditHarvester.js");
    const plan = buildHarvestPlan("test@example.com");
    assert.ok(plan.steps.length > 0);
    assert.ok(plan.claimableCredits > 0);
  });

  it("builds signup URLs", async () => {
    const { buildSignupUrl } = await import("./lib/creditHarvester.js");
    const url = buildSignupUrl("huggingface", "test@example.com");
    assert.ok(url.includes("huggingface.co"));
  });
});

describe("Credit Score", () => {
  it("calculates score", async () => {
    const { calculateCreditScore } = await import("./lib/creditScore.js");
    const score = calculateCreditScore();
    assert.ok(score.score >= 0 && score.score <= 100);
    assert.ok(score.grade);
  });

  it("checks project completion", async () => {
    const { canCompleteProject } = await import("./lib/creditScore.js");
    const check = canCompleteProject("landing");
    assert.ok(typeof check.ok === "boolean");
  });
});

describe("Signup Orchestrator", () => {
  it("initializes orchestrator", async () => {
    const { initOrchestrator, getCurrentStep, resetOrchestrator } = await import("./lib/signupOrchestrator.js");
    resetOrchestrator();
    const state = initOrchestrator("test@example.com");
    assert.ok(state.steps.length > 0);
    assert.ok(getCurrentStep());
    resetOrchestrator();
  });
});

describe("Workspace engine", () => {
  it("has 7 modes", async () => {
    const { MODES } = await import("./lib/workspaceEngine.js");
    assert.equal(MODES.length, 7);
  });

  it("creates session", async () => {
    const { createSession } = await import("./lib/workspaceEngine.js");
    const s = createSession("image");
    assert.ok(s.id);
    assert.equal(s.mode, "image");
  });

  it("processes image request", async () => {
    const { processWorkspaceRequest } = await import("./lib/workspaceEngine.js");
    const res = await processWorkspaceRequest({ prompt: "a cat", mode: "image" });
    assert.equal(res.ok, true);
    assert.ok(res.images?.length > 0);
  });

  it("processes code request", async () => {
    const { processWorkspaceRequest } = await import("./lib/workspaceEngine.js");
    const res = await processWorkspaceRequest({ prompt: "landing page for startup", mode: "code" });
    assert.equal(res.ok, true);
    assert.ok(res.code?.includes("<!DOCTYPE html>"));
  });

  it("processes chat request", async () => {
    const { processWorkspaceRequest } = await import("./lib/workspaceEngine.js");
    const res = await processWorkspaceRequest({ prompt: "מה אתה יודע לעשות?", mode: "chat" });
    assert.equal(res.ok, true);
    assert.ok(res.text?.length > 10);
  });
});
