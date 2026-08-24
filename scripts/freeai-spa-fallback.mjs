/**
 * Prepare dist-freeai for GitHub Pages: freeai.html → index.html + 404.html fallback.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist-freeai');
const freeaiHtml = resolve(dist, 'freeai.html');
const index = resolve(dist, 'index.html');
const fallback = resolve(dist, '404.html');

if (!existsSync(freeaiHtml)) {
  console.error('freeai-spa-fallback: dist-freeai/freeai.html missing — run vite build --mode freeai first');
  process.exit(1);
}

copyFileSync(freeaiHtml, index);
copyFileSync(index, fallback);
writeFileSync(resolve(dist, '.nojekyll'), '');
console.log('freeai-spa-fallback: wrote dist-freeai/index.html + 404.html + .nojekyll');
