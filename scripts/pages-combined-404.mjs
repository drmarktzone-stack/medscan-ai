/**
 * GitHub Pages SPA fallback for MedScan + the FreeAI subfolder.
 *
 * Writes the root `404.html` that Pages serves for every unknown path, and
 * injects the matching URL-restore snippet into both app entry points.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { redirectScript, injectRestoreScript, wrapHtml } from "./pages-spa-redirect.mjs";

const dist = resolve(process.cwd(), "dist");
const repo = process.env.GITHUB_PAGES_REPO || "medscan-ai";
const base = repo ? `/${repo}` : "";

writeFileSync(resolve(dist, "404.html"), wrapHtml(redirectScript(base, ["freeai"])));

for (const entry of ["index.html", "freeai/index.html"]) {
  const file = resolve(dist, entry);
  if (!existsSync(file)) continue;
  writeFileSync(file, injectRestoreScript(readFileSync(file, "utf8")));
  console.log("pages-combined-404: restore script injected into", entry);
}

console.log("pages-combined-404: wrote dist/404.html for", base || "/");
