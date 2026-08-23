/**
 * Copy index.html → 404.html so GitHub Pages serves the SPA on deep links.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const index = resolve(dist, 'index.html');
const fallback = resolve(dist, '404.html');
if (!existsSync(index)) {
  console.error('spa-fallback: dist/index.html missing — run vite build first');
  process.exit(1);
}
copyFileSync(index, fallback);
console.log('spa-fallback: wrote dist/404.html');

// GitHub Pages: skip Jekyll processing
import { writeFileSync } from 'node:fs';
writeFileSync(resolve(dist, '.nojekyll'), '');
console.log('spa-fallback: wrote dist/.nojekyll');
