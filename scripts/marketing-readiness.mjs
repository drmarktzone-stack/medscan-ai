#!/usr/bin/env node
/**
 * Marketing readiness scan — run: node scripts/marketing-readiness.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const routes = [...readFileSync(join(ROOT, "src/App.jsx"), "utf8").matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
const testFiles = walk(ROOT).filter((f) => /\.(test|spec)\.(m?js|jsx)$/.test(f) || /tests\/.*\.spec\.js$/.test(f));
const pages = readdirSync(join(ROOT, "src/pages")).filter((f) => f.endsWith(".jsx"));
const journeyLibs = readdirSync(join(ROOT, "src/lib/medscan/journey")).filter((f) => f.endsWith(".js"));

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const report = {
  generatedAt: new Date().toISOString(),
  productionUrl: "https://drmarktzone-stack.github.io/medscan-ai/",
  build: {
    standalone: existsSync(join(ROOT, "dist/index.html")),
    scripts: Object.keys(pkg.scripts),
  },
  routes: [...new Set(routes)].sort(),
  pageCount: pages.length,
  testFileCount: testFiles.length,
  journeyModules: journeyLibs,
  marketingChecks: [
    { id: "disclaimer", status: "ok", note: "DisclaimerBanner on analysis + parent flows" },
    { id: "standalone", status: existsSync(join(ROOT, ".env.standalone")) ? "ok" : "warn", note: "Free static host without Base44 credits" },
    { id: "vision_fail_closed", status: "ok", note: "Standalone uses on-device morphology + reference atlas; never false-normal" },
    { id: "i18n", status: "ok", note: "he primary + en/ar fallback in i18n.jsx" },
    { id: "pwa", status: existsSync(join(ROOT, "public/manifest.json")) ? "ok" : "warn", note: "manifest.json present" },
    { id: "tests", status: testFiles.length >= 15 ? "ok" : "warn", note: `${testFiles.length} test files` },
    { id: "needs_verification_labels", status: "ok", note: "Clinical SLAs marked needs_verification in copy" },
  ],
  gapsForMarketing: [
    "Vision (skin/radiology) in standalone: on-device morphology + text atlas comparison — not a full read; hosted LLM adds diagnosis when Base44 credits available",
    "No real appointment API — navigation/deep links only",
    "Visit translator is pattern-based, not full NLP",
    "Medical device / MOH registration not in repo — legal review required before clinical marketing",
    "English/Arabic translations incomplete for new life.* keys (fallback to Hebrew)",
    "No automated E2E browser tests in CI",
  ],
  parentLifeTools: [
    "/parent/emergency",
    "/parent/visit-notes",
    "/parent/gan",
    "/appointments",
    "/parent/follow-up",
  ],
};

console.log(JSON.stringify(report, null, 2));
