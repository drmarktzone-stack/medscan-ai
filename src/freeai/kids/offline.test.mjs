/**
 * Kids screens must stay usable when no AI provider can be reached.
 *
 * Production hits this regularly: API keys may be absent, and some networks
 * block provider endpoints outright (Groq answers 451 from several regions).
 * These tests stub a browser where every request fails and assert the daily
 * lesson still returns real, readable content quickly.
 */
import test from "node:test";
import assert from "node:assert/strict";

const LEAKED_TEXT = /Return ONLY|No markdown|Subject:|Grade:|Topic:|console\.groq|API Key|Sample answer|תשובה לדוגמה/i;

function stubBlockedBrowser() {
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };

  globalThis.localStorage = localStorage;
  globalThis.window = { localStorage, location: { origin: "https://example.test" } };
  globalThis.document = {
    querySelector: () => null,
    createElement: () => ({ dataset: {} }),
    head: { appendChild() {} },
  };
  globalThis.Image = class { set src(_value) {} };
  globalThis.fetch = async () => ({
    ok: false,
    status: 451,
    text: async () => "blocked",
    json: async () => ({}),
  });
}

function clearBrowserStub() {
  delete globalThis.localStorage;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.Image;
  delete globalThis.fetch;
}

test("daily lesson with every provider blocked", async (t) => {
  stubBlockedBrowser();
  t.after(clearBrowserStub);

  const { runDailyLesson } = await import("./lib/dailyLesson.js");

  const startedAt = Date.now();
  const lesson = await runDailyLesson({ grade: "5", lang: "he" });
  const elapsed = Date.now() - startedAt;

  await t.test("resolves without waiting on the network", () => {
    assert.ok(elapsed < 15000, `took ${elapsed}ms`);
  });

  await t.test("still has an intro, cards and quiz", () => {
    assert.ok(lesson.intro.length > 10, "intro should not be empty");
    assert.ok(lesson.cards.length > 0, "should offer flashcards");
    assert.ok(lesson.quiz.questions.length > 0, "should offer quiz questions");
  });

  await t.test("illustration is generated locally", () => {
    assert.ok(
      lesson.heroImage.startsWith("data:image/svg+xml"),
      "hero should not depend on a remote CDN",
    );
    for (const card of lesson.cards) {
      assert.ok(String(card.imageUrl || "").startsWith("data:image/svg+xml"), card.front);
    }
  });

  await t.test("shows no instruction or placeholder text", () => {
    const everything = lesson.intro + JSON.stringify(lesson.cards) + JSON.stringify(lesson.quiz);
    assert.ok(!LEAKED_TEXT.test(everything), everything.slice(0, 200));
  });
});
