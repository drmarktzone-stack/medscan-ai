/**
 * Prepare dist-freeai for static hosting: freeai.html → index.html, plus a
 * 404.html that restores deep links on hosts (like GitHub Pages) that have no
 * rewrite rules.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { redirectScript, injectRestoreScript, wrapHtml } from './pages-spa-redirect.mjs';

const dist = resolve(process.cwd(), 'dist-freeai');
const freeaiHtml = resolve(dist, 'freeai.html');
const index = resolve(dist, 'index.html');

if (!existsSync(freeaiHtml)) {
  console.error('freeai-spa-fallback: dist-freeai/freeai.html missing — run vite build --mode freeai first');
  process.exit(1);
}

const withRestore = injectRestoreScript(readFileSync(freeaiHtml, 'utf8'));
writeFileSync(freeaiHtml, withRestore);
writeFileSync(index, withRestore);

// `VITE_BASE` is where this bundle will be served from, e.g. "/repo/freeai/".
const base = (process.env.VITE_BASE || '/').replace(/\/$/, '');
writeFileSync(resolve(dist, '404.html'), wrapHtml(redirectScript(base, [])));

writeFileSync(resolve(dist, '.nojekyll'), '');
console.log('freeai-spa-fallback: wrote dist-freeai/index.html + 404.html + .nojekyll (base:', base || '/', ')');
