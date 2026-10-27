import { Decimal } from 'decimal.js';
type Num = Decimal.Value; const D = (x: Num) => new Decimal(x);

/** Earnings power value: no-growth value of normalised operating earnings. */
export function epv(p: { ebitNormalised: Num; tax: Num; wacc: Num; cash: Num; debt: Num; minorities: Num; shares: Num }) {
  const nopat = D(p.ebitNormalised).mul(D(1).minus(D(p.tax)));
  const ev = nopat.div(D(p.wacc));
  const equity = ev.plus(D(p.cash)).minus(D(p.debt)).minus(D(p.minorities));
  return { nopat, ev, equity, valuePerShare: equity.div(D(p.shares)) };
}
/** Residual income for banks, NBFCs, insurers. Equity-only: no WACC, no FCFF, no net debt. */
export function residualIncome(p: { bv0: Num; ke: Num; roe: Num[]; payout: Num[]; omega: Num; shares: Num }) {
  const ke = D(p.ke), w = D(p.omega); let bv = D(p.bv0), pv = D(0), lastRi = D(0); const rows: { t: number; bvStart: Decimal; ni: Decimal; ri: Decimal; div: Decimal }[] = [];
  p.roe.forEach((r, k) => {
    const ni = D(r).mul(bv), ri = D(r).minus(ke).mul(bv), div = ni.mul(D(p.payout[k]!));
    const disc = D(1).plus(ke).pow(k + 1); pv = pv.plus(ri.div(disc));
    rows.push({ t: k + 1, bvStart: bv, ni, ri, div }); bv = bv.plus(ni).minus(div); lastRi = ri;
  });
  const N = p.roe.length;
  const tv = lastRi.mul(w).div(D(1).plus(ke).minus(w));          // persistence: RI_{N+k} = ω^k · RI_N
  const pvTv = tv.div(D(1).plus(ke).pow(N));
  const equity = D(p.bv0).plus(pv).plus(pvTv);
  return { equity, valuePerShare: equity.div(D(p.shares)), pvRi: pv, pvTv, bvEnd: bv, rows };
}
/** Gordon dividend discount model. */
export function ddm(p: { dps1: Num; ke: Num; g: Num }) {
  if (D(p.ke).lte(D(p.g))) return null; return D(p.dps1).div(D(p.ke).minus(D(p.g)));
}
