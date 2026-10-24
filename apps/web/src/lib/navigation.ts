/**
 * Canonical Navigation and Symbol Helpers
 */

export const SYMBOL_REGEX = /^[A-Za-z0-9][A-Za-z0-9.&\-^=]{0,19}$/;

export function isValidSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') return false;
  return SYMBOL_REGEX.test(symbol.trim());
}

export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol.trim().toUpperCase();
}

/**
 * Produces the canonical route path for any stock ticker across the application.
 * Safely encodes symbols with special characters (e.g. M&M.NS -> M%26M.NS).
 */
export function companyPath(symbol: string): string {
  if (!symbol) return '/';
  const clean = normalizeSymbol(symbol);
  return `/company/${encodeURIComponent(clean)}`;
}
