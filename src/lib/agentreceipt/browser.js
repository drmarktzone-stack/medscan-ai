/** Browser-safe AgentReceipt exports (no node:fs / child_process). */
export {
  RECEIPT_VERSION,
  RECEIPT_STATUS,
  KNOWN_AGENT_PLATFORMS,
  validateReceipt,
  buildReceipt,
  receiptPassesGate,
} from './schema.js';

export {
  emptyLedger,
  appendReceipt,
  latestReceiptForTask,
  gateForTask,
  canStartTask,
  appendWaitlist,
  DEFAULT_LEDGER_PATH,
} from './ledger.js';

export {
  loadLedgerFromStorage,
  saveLedgerToStorage,
  BROWSER_LEDGER_KEY,
} from './storage.browser.js';

export { PRICING_PLANS, PRODUCT_NAME, PRODUCT_TAGLINE_HE, PRODUCT_TAGLINE_EN } from './product.js';
