import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

export function formatCurrency(num: number | null | undefined, currency = 'USD'): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function formatDelta(current: number, previous: number): { value: string; class: 'up' | 'down' } {
  if (previous === 0) return { value: '—', class: 'up' };
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const className = change >= 0 ? 'up' : 'down';
  const prefix = change >= 0 ? '▲' : '▼';
  return { value: `${prefix} ${Math.abs(change).toFixed(2)}%`, class: className };
}

export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—';
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}