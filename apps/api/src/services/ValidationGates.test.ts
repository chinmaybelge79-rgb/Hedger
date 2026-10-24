import { describe, it, expect } from 'vitest';
import {
  validateBalanceSheet,
  validateCashFlow,
  validatePERatio,
  validateMarketCap,
  validateYoYGrowth
} from './ValidationGates.js';
import type { FinancialStatement } from '@hedger/types';

describe('Workstream B: Validation Gates on Ingest', () => {
  it('Balance-sheet identity: Assets = Liabilities + Equity within 0.5% tolerance', () => {
    const validBS: FinancialStatement = {
      symbol: 'TCS.NS',
      type: 'balance',
      period: 'annual',
      currency: 'INR',
      fiscalDates: ['2025-03-31'],
      rows: [
        { key: 'total_assets', name: 'Total Assets', values: [1000000] },
        { key: 'total_liabilities', name: 'Total Liabilities', values: [400000] },
        { key: 'stockholders_equity', name: 'Stockholders Equity', values: [600000] }
      ],
      meta: { freshness: 'ANNUAL', asOf: '2026-10-23T00:00:00Z', source: 'audit' }
    };

    const result = validateBalanceSheet(validBS);
    expect(result.isReconciled).toBe(true);
    expect(result.discrepancies[0]).toBe(0);

    // Discrepant balance sheet exceeding 0.5%
    const brokenBS: FinancialStatement = {
      ...validBS,
      rows: [
        { key: 'total_assets', name: 'Total Assets', values: [1000000] },
        { key: 'total_liabilities', name: 'Total Liabilities', values: [400000] },
        { key: 'stockholders_equity', name: 'Stockholders Equity', values: [500000] } // 10% discrepancy
      ]
    };

    const brokenResult = validateBalanceSheet(brokenBS);
    expect(brokenResult.isReconciled).toBe(false);
    expect(brokenResult.discrepancies[0]).toBeGreaterThan(0.5);
  });

  it('Cash-flow identity: Net change in cash matches CFO + CFI + CFF', () => {
    const validCF: FinancialStatement = {
      symbol: 'INFY.NS',
      type: 'cashflow',
      period: 'annual',
      currency: 'INR',
      fiscalDates: ['2025-03-31'],
      rows: [
        { key: 'operating_cash_flow', name: 'Operating Cash Flow', values: [25000] },
        { key: 'investing_cash_flow', name: 'Investing Cash Flow', values: [-10000] },
        { key: 'financing_cash_flow', name: 'Financing Cash Flow', values: [-12000] },
        { key: 'changes_in_cash', name: 'Changes in Cash', values: [3000] }
      ],
      meta: { freshness: 'ANNUAL', asOf: '2026-10-23T00:00:00Z', source: 'audit' }
    };

    const result = validateCashFlow(validCF);
    expect(result.isReconciled).toBe(true);
  });

  it('P/E ratio validation: Marks NM if negative or flags OUTLIER if > 1000', () => {
    // Negative earnings
    const negPE = validatePERatio(100, -5);
    expect(negPE.isValid).toBe(false);
    expect(negPE.flag).toBe('NM');

    // Outlier > 1000
    const outlierPE = validatePERatio(2000, 1);
    expect(outlierPE.flag).toBe('OUTLIER');

    // Normal valid P/E
    const normalPE = validatePERatio(1500, 60);
    expect(normalPE.isValid).toBe(true);
    expect(normalPE.value).toBe(25);
    expect(normalPE.flag).toBe('VALID');
  });

  it('Market cap validation: Price × Shares within 2% of provider', () => {
    // Exact match
    const exact = validateMarketCap(100, 1000, 100000);
    expect(exact.isValid).toBe(true);
    expect(exact.flag).toBe('VALID');

    // Mismatched provider (> 2%) -> recomputed to calculated
    const mismatched = validateMarketCap(100, 1000, 90000);
    expect(mismatched.value).toBe(100000);
    expect(mismatched.flag).toBe('ADJUSTED');
  });

  it('Growth rate validation: flags growth > 100% YoY with reason', () => {
    const normal = validateYoYGrowth(110, 100);
    expect(normal.flag).toBe('VALID');

    const highGrowth = validateYoYGrowth(250, 100);
    expect(highGrowth.flag).toBe('OUTLIER');
    expect(highGrowth.reason).toContain('100%');
  });
});
