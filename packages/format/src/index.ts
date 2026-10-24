import type { Money } from '@hedger/types';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  HKD: 'HK$',
  KRW: '₩',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF ',
  CNY: '¥',
  SGD: 'S$'
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency.toUpperCase()} `;
}

export function parseNumeric(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return null;
  return num;
}

/**
 * Formats a monetary value with proper currency symbol, decimal places, and grouping.
 * JPY/KRW uses 0 decimal places; other currencies default to 2.
 */
export function formatPrice(money: Money | null | undefined): string {
  if (!money) return '—';
  const num = parseNumeric(money.amount);
  if (num === null) return '—';

  const currency = (money.currency || 'INR').toUpperCase();
  const symbol = getCurrencySymbol(currency);
  const isZeroDecimal = ['JPY', 'KRW'].includes(currency);
  const decimals = isZeroDecimal ? 0 : 2;

  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const formattedNumber = Math.abs(num).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  const sign = num < 0 ? '\u2212' : '';
  return `${sign}${symbol}${formattedNumber}`;
}

export type CompactSystem = 'indian' | 'intl';

/**
 * Compact numeric formatting:
 * Indian: K (10^3), L (10^5, Lakh), Cr (10^7, Crore), L Cr (10^12, Lakh Crore)
 * Intl: K (10^3), M (10^6), B (10^9), T (10^12)
 */
export function formatCompact(
  money: Money | null | undefined,
  system?: CompactSystem,
  decimals: number = 2
): string {
  if (!money) return '—';
  const num = parseNumeric(money.amount);
  if (num === null) return '—';

  const currency = (money.currency || 'INR').toUpperCase();
  const sys: CompactSystem = system ?? (currency === 'INR' ? 'indian' : 'intl');
  const symbol = getCurrencySymbol(currency);
  const sign = num < 0 ? '\u2212' : '';
  const abs = Math.abs(num);

  if (abs === 0) {
    return `${symbol}0`;
  }

  if (sys === 'indian') {
    if (abs >= 1e12) {
      // Lakh Crore (1 L Cr = 10^12)
      return `${sign}${symbol}${(abs / 1e12).toFixed(decimals)} L Cr`;
    }
    if (abs >= 1e7) {
      // Crore (1 Cr = 10^7)
      return `${sign}${symbol}${(abs / 1e7).toFixed(decimals)} Cr`;
    }
    if (abs >= 1e5) {
      // Lakh (1 L = 10^5)
      return `${sign}${symbol}${(abs / 1e5).toFixed(decimals)} L`;
    }
    if (abs >= 1e3) {
      return `${sign}${symbol}${(abs / 1e3).toFixed(decimals)}K`;
    }
    return `${sign}${symbol}${abs.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })}`;
  } else {
    // International system
    if (abs >= 1e12) {
      return `${sign}${symbol}${(abs / 1e12).toFixed(decimals)}T`;
    }
    if (abs >= 1e9) {
      return `${sign}${symbol}${(abs / 1e9).toFixed(decimals)}B`;
    }
    if (abs >= 1e6) {
      return `${sign}${symbol}${(abs / 1e6).toFixed(decimals)}M`;
    }
    if (abs >= 1e3) {
      return `${sign}${symbol}${(abs / 1e3).toFixed(decimals)}K`;
    }
    return `${sign}${symbol}${abs.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    })}`;
  }
}

/**
 * Formats a fraction or percentage into string with true minus sign U+2212.
 * input: 0.0087 -> "+0.87%"
 * input: -0.0015 -> "−0.15%"
 */
export function formatPercent(
  value: number | null | undefined,
  dp: number = 2,
  signed: boolean = true
): string {
  const num = parseNumeric(value);
  if (num === null) return '—';

  const pct = num * 100;
  const absPct = Math.abs(pct).toFixed(dp);

  if (pct === 0) {
    return `${absPct}%`;
  }
  if (pct > 0) {
    return signed ? `+${absPct}%` : `${absPct}%`;
  }
  return `\u2212${absPct}%`;
}

/**
 * Formats valuation multiples (P/E, EV/EBITDA, etc).
 * Negative multiples or undefined/null return 'NM' or '—'.
 */
export function formatMultiple(value: number | null | undefined, dp: number = 1): string {
  if (value === null || value === undefined) return '—';
  const num = parseNumeric(value);
  if (num === null) return '—';
  if (num <= 0) return 'NM';
  return `${num.toFixed(dp)}x`;
}

/**
 * Formats combined absolute delta and percentage delta.
 * E.g., "+₹12.50 (+0.87%)"
 */
export function formatDelta(
  absDelta: number | null | undefined,
  pctDelta: number | null | undefined,
  currency: string = 'INR'
): string {
  const abs = parseNumeric(absDelta);
  const pct = parseNumeric(pctDelta);

  if (abs === null && pct === null) return '—';

  const symbol = getCurrencySymbol(currency);
  const isPositive = (abs !== null && abs > 0) || (pct !== null && pct > 0);
  const isNegative = (abs !== null && abs < 0) || (pct !== null && pct < 0);

  const sign = isNegative ? '\u2212' : isPositive ? '+' : '';
  const absStr = abs !== null ? `${symbol}${Math.abs(abs).toFixed(2)}` : '';
  const pctStr = pct !== null ? `${Math.abs(pct * 100).toFixed(2)}%` : '';

  if (absStr && pctStr) {
    return `${sign}${absStr} (${sign}${pctStr})`;
  }
  if (absStr) {
    return `${sign}${absStr}`;
  }
  return `${sign}${pctStr}`;
}

/**
 * Formats date into standard "22 Oct 2026" form.
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

/**
 * Formats missing reason or returns em-dash '—'
 */
export function formatMissing(reason?: string): string {
  return '—';
}

/**
 * Computes the first and last name initials for institutional profile badges (e.g. "Alex Morgan" -> "AM").
 */
export function getUserInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/[\s._-]+/).filter((p): p is string => Boolean(p && p.length > 0));
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];

    if (parts.length >= 2 && firstPart && lastPart) {
      const firstChar = firstPart[0] ?? '';
      const lastChar = lastPart[0] ?? '';
      if (firstChar && lastChar) {
        return `${firstChar}${lastChar}`.toUpperCase();
      }
    } else if (firstPart) {
      if (firstPart.length >= 2) {
        return firstPart.slice(0, 2).toUpperCase();
      }
      return firstPart.toUpperCase();
    }
  }

  if (email && email.trim()) {
    const userPart = email.split('@')[0] ?? '';
    const emailParts = userPart.split(/[\s._-]+/).filter((p): p is string => Boolean(p && p.length > 0));
    const firstPart = emailParts[0];
    const lastPart = emailParts[emailParts.length - 1];

    if (emailParts.length >= 2 && firstPart && lastPart) {
      const firstChar = firstPart[0] ?? '';
      const lastChar = lastPart[0] ?? '';
      if (firstChar && lastChar) {
        return `${firstChar}${lastChar}`.toUpperCase();
      }
    } else if (firstPart && firstPart.length >= 2) {
      return firstPart.slice(0, 2).toUpperCase();
    }
  }

  return 'AM';
}
