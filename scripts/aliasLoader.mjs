/**
 * Loader hook שמאפשר לטעון מודולי דפדפן ב-node.
 *
 * ## למה
 * הקוד משתמש ב-alias `@/` (מוגדר ב-vite) וב-`@/api/base44Client`,
 * שקיים רק בדפדפן. בלי הפתרון הזה, כל מודול שנוגע בשכבת ה-I/O
 * אינו ניתן לטעינה בבדיקות — כלומר **בדיוק מסלול החילוץ** שבו
 * התגלה אימפורט חסר בפרודקשן.
 *
 * מודול שלא ניתן לטעון בבדיקה הוא מודול שלא נבדק.
 *
 * שימוש:  node --import ./scripts/aliasLoader.mjs <file>
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./aliasResolve.mjs', pathToFileURL('./scripts/'));
