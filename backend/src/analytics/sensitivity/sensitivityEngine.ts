import { SensitivityInput, SensitivityResponse } from '@api/schemas/analytics';
import { calculateDcf } from '@valuation/dcf/dcfEngine';

export async function calculateSensitivity(ticker: string, input: SensitivityInput): Promise<SensitivityResponse> {
  const { baseWacc, baseTerminalGrowth, waccRange, terminalRange, steps } = input;

  const halfSteps = Math.floor(steps / 2);
  const rows: number[] = [];
  const columns: number[] = [];

  for (let i = -halfSteps; i <= halfSteps; i++) {
    rows.push(baseWacc + i * waccRange / halfSteps);
    columns.push(baseTerminalGrowth + i * terminalRange / halfSteps);
  }

  const values: number[][] = [];

  for (const wacc of rows) {
    const row: number[] = [];
    for (const terminalGrowth of columns) {
      try {
        const result = await calculateDcf(ticker, {
          forecastYears: 5,
          revenueGrowth: [0.08, 0.07, 0.06, 0.05, 0.04],
          ebitMargin: [0.31, 0.32, 0.32, 0.33, 0.33],
          taxRate: 0.21,
          wacc,
          terminalGrowth,
        });
        row.push(result.fairValuePerShare);
      } catch {
        row.push(0);
      }
    }
    values.push(row);
  }

  return { rows, columns, values };
}