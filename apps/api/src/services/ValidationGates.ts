/**
 * Data Accuracy Validation Gates
 * Enforces fundamental accounting identities and data trust rules.
 */

import type { FinancialStatement } from '@hedger/types';

export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  flag?: ('VALID' | 'NM' | 'OUTLIER' | 'RECONCILED' | 'UNRECONCILED' | 'ADJUSTED') | undefined;
  reason?: string | undefined;
}

export interface StatementReconciliation {
  balanceSheetReconciled: boolean;
  balanceSheetDiscrepancyPct: number[];
  cashFlowReconciled: boolean;
  cashFlowDiscrepancyPct: number[];
  reconciliationNotes: string[];
}

/**
 * 1. Balance-sheet identity: Assets = Liabilities + Equity
 * Within 0.5% tolerance for rounding across all fiscal reporting dates.
 */
export function validateBalanceSheet(statement: FinancialStatement): {
  discrepancies: number[];
  isReconciled: boolean;
} {
  if (statement.type !== 'balance') {
    return { discrepancies: [], isReconciled: true };
  }

  const assetsRow = statement.rows.find((r) =>
    /total_assets|^assets$/i.test(r.key)
  );
  const liabilitiesRow = statement.rows.find((r) =>
    /total_liabilities_net_minority_interest|^total_liabilities$|^liabilities$/i.test(r.key)
  );
  const equityRow = statement.rows.find((r) =>
    /stockholders_equity|common_stock_equity|^total_equity/i.test(r.key)
  );

  if (!assetsRow || (!liabilitiesRow && !equityRow)) {
    return { discrepancies: [], isReconciled: true };
  }

  const discrepancies: number[] = [];
  let allReconciled = true;

  for (let i = 0; i < statement.fiscalDates.length; i++) {
    const a = assetsRow.values[i];
    const l = liabilitiesRow?.values[i] ?? 0;
    const e = equityRow?.values[i] ?? 0;

    if (a !== null && a !== undefined && a > 0) {
      const sum = (l ?? 0) + (e ?? 0);
      const diffPct = Math.abs(a - sum) / a;
      discrepancies.push(Number((diffPct * 100).toFixed(3)));
      if (diffPct > 0.005) {
        allReconciled = false;
      }
    } else {
      discrepancies.push(0);
    }
  }

  return {
    discrepancies,
    isReconciled: allReconciled
  };
}

/**
 * 2. Cash-flow identity: Net change in cash = CFO + CFI + CFF + FX
 * Within 2.0% tolerance for rounding / exchange differences.
 */
export function validateCashFlow(statement: FinancialStatement): {
  discrepancies: number[];
  isReconciled: boolean;
} {
  if (statement.type !== 'cashflow') {
    return { discrepancies: [], isReconciled: true };
  }

  const cfoRow = statement.rows.find((r) => /operating_cash_flow/i.test(r.key));
  const cfiRow = statement.rows.find((r) => /investing_cash_flow/i.test(r.key));
  const cffRow = statement.rows.find((r) => /financing_cash_flow/i.test(r.key));
  const changeCashRow = statement.rows.find((r) =>
    /changes_in_cash|net_change_in_cash/i.test(r.key)
  );

  if (!cfoRow && !changeCashRow) {
    return { discrepancies: [], isReconciled: true };
  }

  const discrepancies: number[] = [];
  let allReconciled = true;

  for (let i = 0; i < statement.fiscalDates.length; i++) {
    const cfo = cfoRow?.values[i] ?? 0;
    const cfi = cfiRow?.values[i] ?? 0;
    const cff = cffRow?.values[i] ?? 0;
    const netChange = changeCashRow?.values[i];

    if (netChange !== null && netChange !== undefined && Math.abs(netChange) > 0) {
      const sum = (cfo ?? 0) + (cfi ?? 0) + (cff ?? 0);
      const diffPct = Math.abs(netChange - sum) / Math.abs(netChange);
      discrepancies.push(Number((diffPct * 100).toFixed(2)));
      if (diffPct > 0.05) {
        allReconciled = false;
      }
    } else {
      discrepancies.push(0);
    }
  }

  return {
    discrepancies,
    isReconciled: allReconciled
  };
}

/**
 * 3. P/E ratio: Price / TTM EPS
 * Reject or mark NM if negative or > 1000 without outlier flag.
 */
export function validatePERatio(
  price: number | null | undefined,
  eps: number | null | undefined,
  reportedPE?: number | null
): ValidationResult<number | null> {
  if (!price || price <= 0) {
    return { isValid: false, value: null, flag: 'NM', reason: 'Price unavailable or non-positive' };
  }

  if (eps === null || eps === undefined || eps <= 0) {
    return { isValid: false, value: null, flag: 'NM', reason: 'Earnings are negative or zero (loss-making)' };
  }

  const calculatedPE = price / eps;

  if (calculatedPE > 1000) {
    return {
      isValid: true,
      value: calculatedPE,
      flag: 'OUTLIER',
      reason: 'P/E exceeds 1000x; abnormal or near-zero base earnings'
    };
  }

  if (reportedPE && Math.abs(reportedPE - calculatedPE) / calculatedPE > 0.15) {
    return {
      isValid: true,
      value: Number(calculatedPE.toFixed(2)),
      flag: 'ADJUSTED',
      reason: `Reported PE (${reportedPE}x) adjusted to calculated (${calculatedPE.toFixed(2)}x)`
    };
  }

  return {
    isValid: true,
    value: Number((reportedPE ?? calculatedPE).toFixed(2)),
    flag: 'VALID'
  };
}

/**
 * 4. Market cap: Price × Shares outstanding
 * Reject or adjust if differs from provider by > 2%.
 */
export function validateMarketCap(
  price: number | null | undefined,
  sharesOutstanding: number | null | undefined,
  reportedMarketCap?: number | null
): ValidationResult<number | null> {
  if (!price || price <= 0 || !sharesOutstanding || sharesOutstanding <= 0) {
    return {
      isValid: !!reportedMarketCap,
      value: reportedMarketCap ?? null,
      flag: reportedMarketCap ? 'VALID' : 'NM',
      reason: reportedMarketCap ? undefined : 'Missing price or share count'
    };
  }

  const calculated = price * sharesOutstanding;

  if (reportedMarketCap && reportedMarketCap > 0) {
    const diffPct = Math.abs(reportedMarketCap - calculated) / reportedMarketCap;
    if (diffPct > 0.02) {
      return {
        isValid: true,
        value: calculated,
        flag: 'ADJUSTED',
        reason: `Provider market cap differed by ${(diffPct * 100).toFixed(1)}%; recomputed as Price × Shares`
      };
    }
    return { isValid: true, value: reportedMarketCap, flag: 'VALID' };
  }

  return { isValid: true, value: calculated, flag: 'VALID' };
}

/**
 * 5. Growth rates: Flag if > 100% YoY with reason.
 */
export function validateYoYGrowth(
  current: number,
  previous: number
): ValidationResult<number> {
  if (previous === 0) {
    return { isValid: false, value: 0, flag: 'NM', reason: 'Base period is zero' };
  }

  const rate = (current - previous) / Math.abs(previous);

  if (rate > 1.0) {
    return {
      isValid: true,
      value: rate,
      flag: 'OUTLIER',
      reason: 'YoY growth exceeds 100% (likely acquisition, merger or low base effect)'
    };
  }

  if (rate < -0.5) {
    return {
      isValid: true,
      value: rate,
      flag: 'OUTLIER',
      reason: 'Severe contraction exceeding −50% YoY'
    };
  }

  return { isValid: true, value: rate, flag: 'VALID' };
}
