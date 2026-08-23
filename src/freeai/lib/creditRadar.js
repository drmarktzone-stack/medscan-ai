/**
 * Credit radar — detect resets and low credits.
 */

import { ALL_PROVIDERS } from "../data/providers.js";
import { loadCreditState } from "./creditStore.js";

/**
 * @returns {{ alerts: object[]; resetsToday: object[]; lowCredits: object[] }}
 */
export function scanCredits(locale = "he") {
  const state = loadCreditState();
  const alerts = [];
  const resetsToday = [];
  const lowCredits = [];

  for (const p of ALL_PROVIDERS) {
    if (state[p.id]?.enabled === false) continue;
    const rem = state[p.id]?.remaining ?? 0;
    const max = p.defaultCredits;

    if (p.resetPeriod === "daily" && rem >= max * 0.9) {
      resetsToday.push({
        id: p.id,
        name: locale === "he" ? p.nameHe : p.name,
        credits: max,
        messageHe: `${p.nameHe} — ${max} קרדיטים חדשים!`,
        messageEn: `${p.name} — ${max} fresh credits!`,
      });
    }

    if (rem > 0 && rem <= max * 0.15 && rem < max) {
      lowCredits.push({
        id: p.id,
        name: locale === "he" ? p.nameHe : p.name,
        remaining: rem,
        messageHe: `${p.nameHe}: נשארו ${rem} קרדיטים — כדאי להשתמש היום!`,
        messageEn: `${p.name}: ${rem} credits left — use today!`,
      });
    }

    if (rem === 0 && p.resetPeriod === "daily") {
      alerts.push({
        id: p.id,
        type: "exhausted",
        resetPeriod: "daily",
        messageHe: `${p.nameHe} נגמר — מתאפס מחר`,
        messageEn: `${p.name} exhausted — resets tomorrow`,
      });
    }
  }

  return { alerts, resetsToday, lowCredits };
}

export function getNotifications(locale = "he") {
  const scan = scanCredits(locale);
  return [
    ...scan.resetsToday.map((r) => ({ ...r, type: "reset", priority: "high" })),
    ...scan.lowCredits.map((l) => ({ ...l, type: "low", priority: "medium" })),
    ...scan.alerts.map((a) => ({ ...a, priority: "low" })),
  ].slice(0, 10);
}
