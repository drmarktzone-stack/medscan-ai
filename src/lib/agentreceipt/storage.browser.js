export const BROWSER_LEDGER_KEY = 'agentreceipt_ledger_v1';

export function loadLedgerFromStorage(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(BROWSER_LEDGER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLedgerToStorage(ledger, storage) {
  if (!storage) return ledger;
  storage.setItem(BROWSER_LEDGER_KEY, JSON.stringify(ledger));
  return ledger;
}
