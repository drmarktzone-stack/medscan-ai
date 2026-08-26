/**
 * GitHub Pages SPA fallback for MedScan + FreeAI + AgentReceipt.
 *
 * Writes the root `404.html` that Pages serves for every unknown path, and
 * injects the matching URL-restore snippet into each app entry point.
 *
 * AgentReceipt lives inside the MedScan SPA (same bundle). We still materialize
 * `dist/agentreceipt/index.html` so `/agentreceipt` returns HTTP 200 — directory
 * quality gates reject links that only resolve via the site's 404.html.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { redirectScript, injectRestoreScript, wrapHtml } from "./pages-spa-redirect.mjs";

const dist = resolve(process.cwd(), "dist");
const repo = process.env.GITHUB_PAGES_REPO || "medscan-ai";
const base = repo ? `/${repo}` : "";
const APP_PREFIXES = ["freeai", "agentreceipt"];

const rootIndex = resolve(dist, "index.html");
if (!existsSync(rootIndex)) {
  console.error("pages-combined-404: dist/index.html missing — run build first");
  process.exit(1);
}

const rootHtml = injectRestoreScript(readFileSync(rootIndex, "utf8"));
writeFileSync(rootIndex, rootHtml);
console.log("pages-combined-404: restore script injected into index.html");

// Materialize AgentReceipt routes so listing URLs are HTTP 200 (not 404.html).
const agentReceiptRoutes = ["", "docs", "pricing", "checkout", "console", "marketing"];
for (const route of agentReceiptRoutes) {
  const rel = route ? `agentreceipt/${route}/index.html` : "agentreceipt/index.html";
  const file = resolve(dist, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, rootHtml);
  console.log("pages-combined-404: wrote dist/" + rel);
}

for (const entry of ["freeai/index.html"]) {
  const file = resolve(dist, entry);
  if (!existsSync(file)) continue;
  writeFileSync(file, injectRestoreScript(readFileSync(file, "utf8")));
  console.log("pages-combined-404: restore script injected into", entry);
}

writeFileSync(resolve(dist, "404.html"), wrapHtml(redirectScript(base, APP_PREFIXES)));
console.log("pages-combined-404: wrote dist/404.html for", base || "/", "prefixes:", APP_PREFIXES.join(","));
