// src/utils/formatters.ts
// Centralized number, currency, and date formatting utilities

/**
 * Format number with locale-aware thousands separator
 */
export function fmtNum(n: number | null | undefined, digits?: number): string {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return '0';
  if (digits !== undefined) {
    return v.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }
  return v.toLocaleString();
}

/**
 * Format USD value with compact notation (e.g. $1.2M)
 */
export function formatUSD(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(v);
}

/**
 * Format SOL amount with configurable precision
 */
export function fmtSol(value: number | null | undefined, min = 3, max = 6): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n === 0) return '0.000';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

/**
 * Format SOL with unit suffix
 */
export function fmtSOL(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} SOL`;
}

/**
 * Format USD with $ prefix (simple)
 */
export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return '—';
  return `$${n.toLocaleString()}`;
}

/**
 * Format ISO date string to localized short date
 */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Mask a user ID for display (e.g. "abc123" -> "abc1***")
 */
export function maskUserId(userId: string, visibleChars = 4): string {
  if (!userId || userId.length <= visibleChars) return userId;
  return userId.slice(0, visibleChars) + '***';
}
