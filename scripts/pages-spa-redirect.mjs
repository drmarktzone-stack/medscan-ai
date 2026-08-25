/**
 * Shared pieces of the GitHub Pages single-page-app deep-link workaround.
 *
 * Pages has no rewrite rules: any unknown path serves the site's root
 * `404.html`. The previous fallback fetched `index.html` and `document.write`
 * its contents, which does not reliably execute the module scripts, so deep
 * links landed on a blank page.
 *
 * Instead the 404 page encodes the requested path into the query string and
 * redirects to a real `index.html`, which restores the original URL with
 * `history.replaceState` before the router boots.
 */

/**
 * Script for `404.html`.
 *
 * @param {string} repoBase        e.g. "/medscan-ai" ("" when hosted at root)
 * @param {string[]} appPrefixes   sub-apps that own their own index, e.g. ["freeai"]
 */
export function redirectScript(repoBase, appPrefixes = []) {
  return `
    (function () {
      var l = window.location;
      var repoBase = ${JSON.stringify(repoBase)};
      var appPrefixes = ${JSON.stringify(appPrefixes)};

      // Segments that identify the app root and must survive the redirect.
      var baseSegments = repoBase ? repoBase.split('/').filter(Boolean).length : 0;
      var rest = l.pathname.slice(repoBase.length).split('/').filter(Boolean);
      if (rest.length && appPrefixes.indexOf(rest[0]) !== -1) baseSegments += 1;

      var segments = l.pathname.split('/').filter(Boolean);
      var appRoot = '/' + segments.slice(0, baseSegments).join('/');
      var route = segments.slice(baseSegments).join('/');

      l.replace(
        l.protocol + '//' + l.host +
        (appRoot === '/' ? '' : appRoot) + '/?/' +
        route.replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    })();`;
}

/** Script injected into every `index.html`, ahead of the app bundle. */
export const RESTORE_SCRIPT = `
    (function (l) {
      if (l.search[1] !== '/') return;
      var decoded = l.search.slice(1).split('&').map(function (part) {
        return part.replace(/~and~/g, '&');
      }).join('?');
      // The encoded route already starts with "/", so drop the index's own
      // trailing slash to avoid producing "//route".
      window.history.replaceState(null, null, l.pathname.replace(/\\/$/, '') + decoded + l.hash);
    })(window.location);`;

/**
 * Insert the restore script as the first thing in `<head>` so the URL is
 * corrected before the router reads it.
 * @param {string} html
 */
export function injectRestoreScript(html) {
  if (html.includes("spa-restore")) return html;
  return html.replace(
    /<head(\s[^>]*)?>/i,
    (match) => `${match}\n    <script data-spa-restore>${RESTORE_SCRIPT}</script>`,
  );
}

/** @param {string} script */
export function wrapHtml(script) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Loading…</title>
  <script>${script}</script>
</head>
<body></body>
</html>
`;
}
