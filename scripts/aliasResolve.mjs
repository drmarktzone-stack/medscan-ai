/**
 * Resolve/load hooks עבור בדיקות node.
 *
 * · `@/…`                 → src/…            (אותו alias כמו ב-vite)
 * · `@/api/base44Client`  → בדל בזיכרון
 *
 * ## על הבדל
 * הבדל מחזיר אובייקט שכל גישה אליו זורקת. זה מכוון: הוא מאפשר
 * ל**טעון** מודול שנוגע ב-I/O, אבל אינו מאפשר לו לרוץ בשקט מול
 * שרת מדומה. בדיקה שצריכה התנהגות מזריקה בדל משלה דרך פרמטר —
 * כמו `invokeLLM` ב-extractFromChunk.
 */

import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve('src');
const CLIENT = '@/api/base44Client';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === CLIENT) {
    return { url: 'medscan-stub:base44Client', shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    let target = path.join(SRC, specifier.slice(2));
    // ה-alias נכתב בלי סיומת; vite משלים אותה
    if (!/\.[a-z]+$/i.test(target)) target += '.js';
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === 'medscan-stub:base44Client') {
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        const die = (p) => () => {
          throw new Error(
            'base44 stub: נגיעה ב-' + p + ' בבדיקה. ' +
            'מודול שצריך I/O חייב לקבל אותו כפרמטר, לא לייבא אותו.'
          );
        };
        const trap = (prefix) => new Proxy(function () {}, {
          get: (_, key) => typeof key === 'string' ? trap(prefix + '.' + String(key)) : undefined,
          apply: die(prefix),
        });
        export const base44 = trap('base44');
        export default base44;
      `,
    };
  }
  return nextLoad(url, context);
}
