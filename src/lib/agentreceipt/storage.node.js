import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { emptyLedger, DEFAULT_LEDGER_PATH } from './ledger.js';

export { BROWSER_LEDGER_KEY, loadLedgerFromStorage, saveLedgerToStorage } from './storage.browser.js';

export function loadLedgerFromFile(path = DEFAULT_LEDGER_PATH) {
  if (!existsSync(path)) return emptyLedger();
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return emptyLedger();
  }
}

export function saveLedgerToFile(ledger, path = DEFAULT_LEDGER_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(ledger, null, 2), 'utf8');
  return ledger;
}
