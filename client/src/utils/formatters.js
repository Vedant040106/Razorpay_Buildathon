/**
 * Formats integer paise amounts into localized Indian Rupee (INR) currency strings.
 * E.g., 450000 paise -> ₹4,500.00
 */
export function formatINR(amountPaise) {
  if (amountPaise === null || amountPaise === undefined || isNaN(amountPaise)) {
    return '₹0.00';
  }
  const inr = amountPaise / 100;
  return inr.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formats ISO date string into readable concise datetime.
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Formats confidence decimal into percentage string.
 */
export function formatConfidence(score) {
  if (score === null || score === undefined || isNaN(score)) return '—';
  return `${Math.round(score * 100)}%`;
}

/**
 * Normalizes strategy names into human-readable actions.
 */
export function formatStrategyName(strategy) {
  const map = {
    'RETRY_PAYMENT': 'Smart Payment Retry',
    'SEND_PAYMENT_REMINDER': 'Send Payment Link Reminder',
    'CREATE_RECOVERY_CASE': 'Open Recovery Investigation',
    'ESCALATE_TO_MERCHANT': 'Escalate to Merchant Ops',
    'MARK_UNRECOVERABLE': 'Mark Unrecoverable',
    'REQUEST_HUMAN_APPROVAL': 'Request Human Authorization'
  };
  return map[strategy] || strategy;
}
