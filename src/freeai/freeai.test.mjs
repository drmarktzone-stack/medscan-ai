import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FREE_AI_PROVIDERS, providersForCapability, googleLabsProviders } from "./data/providers.js";
import { buildProjectPlan, parseProjectDescription, getCreditsDashboard } from "./lib/planner.js";
import { buildPollinationsUrl, generatePollinationsBatch, validatePrompt } from "./lib/generators/pollinations.js";

describe("FreeAI providers registry", () => {
  it("has at least 15 providers", () => {
    assert.ok(FREE_AI_PROVIDERS.length >= 15);
  });

  it("includes Google Labs tools", () => {
    const labs = googleLabsProviders();
    assert.ok(labs.length >= 3);
    assert.ok(labs.some((p) => p.id === "google_imagefx"));
    assert.ok(labs.some((p) => p.id === "google_veo"));
  });

  it("includes pollinations as free API", () => {
    const p = FREE_AI_PROVIDERS.find((x) => x.id === "pollinations");
    assert.ok(p);
    assert.equal(p.hasApi, true);
    assert.equal(p.needsKey, false);
  });

  it("filters by capability", () => {
    const video = providersForCapability("video");
    assert.ok(video.length >= 3);
    assert.ok(video.every((p) => p.capabilities.includes("video")));
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

  it("reports gaps when demand exceeds credits", () => {
    const plan = buildProjectPlan([{ type: "video", count: 99999, prompt: "test" }]);
    assert.equal(plan.fullyCovered, false);
    assert.ok(plan.gaps.length > 0);
  });

  it("dashboard returns grand total", () => {
    const dash = getCreditsDashboard();
    assert.ok(dash.grandTotal > 0);
    assert.ok(dash.providers.length >= 15);
  });
});

describe("Pollinations generator", () => {
  it("builds valid URL", () => {
    const url = buildPollinationsUrl("a cat", { seed: 42 });
    assert.ok(url.includes("pollinations.ai"));
    assert.ok(url.includes("a%20cat"));
    assert.ok(url.includes("seed=42"));
  });

  it("generates batch", () => {
    const batch = generatePollinationsBatch("sunset", 3);
    assert.equal(batch.ok, true);
    assert.equal(batch.images.length, 3);
  });

  it("validates prompts", () => {
    assert.equal(validatePrompt("").ok, false);
    assert.equal(validatePrompt("hello world").ok, true);
  });
});
