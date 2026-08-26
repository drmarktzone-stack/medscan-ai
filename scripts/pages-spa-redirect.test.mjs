/**
 * Round-trip test for the GitHub Pages deep-link workaround: a requested path
 * must survive the 404 redirect and be restored exactly on the way back.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { redirectScript, RESTORE_SCRIPT, injectRestoreScript } from "./pages-spa-redirect.mjs";

function redirect(pathname, search, hash, repoBase, prefixes) {
  let replaced = null;
  const win = {
    location: {
      protocol: "https:",
      host: "example.github.io",
      pathname,
      search,
      hash,
      replace: (url) => { replaced = url; },
    },
  };
  new Function("window", redirectScript(repoBase, prefixes))(win);
  return replaced;
}

function restore(pathname, search, hash) {
  let restored = null;
  const win = {
    history: { replaceState: (_s, _t, url) => { restored = url; } },
    location: { pathname, search, hash },
  };
  new Function("window", RESTORE_SCRIPT)(win);
  return restored;
}

function roundTrip(path, repoBase, prefixes) {
  const url = new URL(redirect(
    path.split("?")[0],
    path.includes("?") ? `?${path.split("?")[1]}` : "",
    "",
    repoBase,
    prefixes,
  ));
  return restore(url.pathname, url.search, url.hash);
}

test("deep links survive the 404 round trip", async (t) => {
  const cases = [
    ["/medscan-ai/freeai/kids", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/medscan-ai/freeai/kids/labs", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/medscan-ai/freeai/kids/study?subject=math", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/medscan-ai/agentreceipt/docs", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/medscan-ai/agentreceipt/checkout", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/medscan-ai/clinic/tools", "/medscan-ai", ["freeai", "agentreceipt"]],
    ["/freeai/kids/labs", "/freeai", []],
  ];

  for (const [path, base, prefixes] of cases) {
    await t.test(path, () => {
      assert.equal(roundTrip(path, base, prefixes), path);
    });
  }
});

test("the redirect keeps the sub-app root so its assets resolve", () => {
  const url = redirect("/medscan-ai/freeai/kids", "", "", "/medscan-ai", ["freeai", "agentreceipt"]);
  assert.ok(url.startsWith("https://example.github.io/medscan-ai/freeai/?/"), url);
});

test("AgentReceipt deep links keep the agentreceipt root", () => {
  const url = redirect("/medscan-ai/agentreceipt/docs", "", "", "/medscan-ai", ["freeai", "agentreceipt"]);
  assert.ok(url.startsWith("https://example.github.io/medscan-ai/agentreceipt/?/"), url);
});

test("restore script is injected once", () => {
  const html = "<!doctype html><html><head><title>x</title></head><body></body></html>";
  const once = injectRestoreScript(html);
  assert.ok(once.includes("data-spa-restore"));
  assert.equal(injectRestoreScript(once), once);
});
