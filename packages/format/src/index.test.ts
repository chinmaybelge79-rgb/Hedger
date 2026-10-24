import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatCompact,
  formatPercent,
  formatMultiple,
  formatDelta,
  formatDate,
  formatMissing,
  getUserInitials
} from './index.js';

describe('@hedger/format Phase 02 Requirements', () => {
  it('formats Indian Rupees with proper grouping and 2 decimal places', () => {
    // Worked example 1
    const res = formatPrice({ amount: '145000.50', currency: 'INR' });
    expect(res).toBe('₹1,45,000.50');
  });

  it('formats compact large Indian Rupee figures as Lakh Crore and Intl as Trillions', () => {
    // Worked example 2: 19,600,000,000,000 INR -> Indian: ₹19.60 L Cr · Intl: ₹19.60T
    const inrMoney = { amount: 19600000000000, currency: 'INR' };
    expect(formatCompact(inrMoney, 'indian')).toBe('₹19.60 L Cr');
    expect(formatCompact(inrMoney, 'intl')).toBe('₹19.60T');
  });

  it('formats compact USD as $1.25M', () => {
    // Worked example 3: 1,250,000 USD -> $1.25M
    const usdMoney = { amount: 1250000, currency: 'USD' };
    expect(formatCompact(usdMoney, 'intl')).toBe('$1.25M');
  });

  it('formats valuation multiples, returning NM for negative and em-dash for null', () => {
    // Worked example 4: formatMultiple(-3.2) -> NM; formatMultiple(null) -> —
    expect(formatMultiple(-3.2)).toBe('NM');
    expect(formatMultiple(null)).toBe('—');
    expect(formatMultiple(undefined)).toBe('—');
    expect(formatMultiple(24.2)).toBe('24.2x');
  });

  it('formats percentages with true minus sign and signed positives', () => {
    // Worked example 5: 0.0065 -> +0.65%; -0.0015 -> −0.15% (U+2212)
    expect(formatPercent(0.0065)).toBe('+0.65%');
    expect(formatPercent(-0.0015)).toBe('\u22120.15%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('formats delta combining absolute and percentage moves', () => {
    expect(formatDelta(12.5, 0.0087, 'INR')).toBe('+₹12.50 (+0.87%)');
    expect(formatDelta(-12.5, -0.0087, 'INR')).toBe('\u2212₹12.50 (\u22120.87%)');
  });

  it('handles zero decimal currencies like JPY and KRW', () => {
    expect(formatPrice({ amount: 14500, currency: 'JPY' })).toBe('¥14,500');
    expect(formatPrice({ amount: 250000, currency: 'KRW' })).toBe('₩250,000');
  });

  it('never leaks null, undefined, NaN, or Infinity', () => {
    expect(formatPrice({ amount: NaN as unknown as number, currency: 'USD' })).toBe('—');
    expect(formatPrice(null)).toBe('—');
    expect(formatCompact({ amount: Infinity as unknown as number, currency: 'INR' })).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
    expect(formatMultiple(Infinity)).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('invalid-date')).toBe('—');
    expect(formatMissing()).toBe('—');
  });

  it('extracts initials of first and last name accurately', () => {
    expect(getUserInitials('Alex Morgan')).toBe('AM');
    expect(getUserInitials('Alexander Vance')).toBe('AV');
    expect(getUserInitials('Morgan Vance')).toBe('MV');
    expect(getUserInitials('Devin Hedger')).toBe('DH');
    expect(getUserInitials('John')).toBe('JO');
    expect(getUserInitials('', 'john.doe@hedger.capital')).toBe('JD');
    expect(getUserInitials(null, null)).toBe('AM');
  });
});
