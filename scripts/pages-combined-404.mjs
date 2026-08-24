/**
 * GitHub Pages SPA fallback for MedScan + FreeAI subfolder.
 * Root 404.html fetches the correct index.html while keeping the deep-link URL.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const repo = process.env.GITHUB_PAGES_REPO || "medscan-ai";
const base = `/${repo}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Loading…</title>
  <script>
    (async function () {
      var path = location.pathname;
      var base = ${JSON.stringify(base)};
      var indexUrl = path.indexOf(base + "/freeai") === 0
        ? base + "/freeai/index.html"
        : base + "/index.html";
      try {
        var res = await fetch(indexUrl);
        var html = await res.text();
        document.open();
        document.write(html);
        document.close();
      } catch (e) {
        location.replace(indexUrl);
      }
    })();
  </script>
</head>
<body></body>
</html>`;

writeFileSync(resolve(dist, "404.html"), html);
console.log("pages-combined-404: wrote dist/404.html for", base);
