import { Decimal } from 'decimal.js';
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });
export type Num = Decimal.Value;
const D = (x: Num) => new Decimal(x);

export interface Bridge { debt: Num; leases: Num; preferred: Num; minorities: Num; cash: Num; nonOperating: Num }
export interface DcfInputs {
  currency: string;
  baseRevenue: Num;                 // TTM revenue, base currency units
  growth: Num[];                    // revenue growth, explicit years 1..5
  ebitMargin: Num[];                // operating margin, years 1..5
  taxRate: Num[];                   // cash tax rate, years 1..5
  terminalGrowth: Num; terminalMargin?: Num | undefined; terminalTax?: Num | undefined;
  salesToCapital: Num;              // ΔRevenue per unit of reinvestment
  roicTerminal: Num;                // return on new capital in perpetuity
  wacc: Num;
  midYear?: boolean | undefined;
  leaseTreatment?: 'operating' | 'debt' | undefined;   // 'debt' (default): subtract lease liabilities in the bridge
  terminalMethod?: 'value-driver' | 'plain' | undefined;
  bridge: Bridge; dilutedShares: Num; price?: Num | undefined;
  maxTerminalGrowth?: Num | undefined;
  companyType?: string | undefined;
  sector?: string | undefined;
}
export interface Issue { code: string; message: string }
export interface YearRow { t: number; phase: 'explicit' | 'fade'; revenue: Decimal; growth: Decimal; ebitMargin: Decimal; ebit: Decimal; taxRate: Decimal; nopat: Decimal; reinvestment: Decimal; fcff: Decimal; discountFactor: Decimal; pv: Decimal }
export interface Valuation {
  pvExplicit: Decimal; terminal: { nopatNext: Decimal; fcffNext: Decimal; value: Decimal; discountFactor: Decimal; pv: Decimal };
  ev: Decimal; equityValue: Decimal; valuePerShare: Decimal; upside?: Decimal; tvShare: Decimal; warnings: Issue[];
}
export type DcfResult = ({ ok: true; rows: YearRow[] } & Valuation) | { ok: false; errors: Issue[] };

/** Discount a list of FCFFs, add a terminal value, and walk the equity bridge. Used by dcf() and by golden tests. */
export function valueFlows(flows: Decimal[], o: {
  wacc: Num; g: Num; midYear?: boolean | undefined; method?: 'value-driver' | 'plain' | undefined; nopatN?: Num | undefined; roicT?: Num | undefined;
  bridge: Bridge; leaseTreatment?: 'operating' | 'debt' | undefined; shares: Num; price?: Num | undefined;
}): { dfs: Decimal[]; pvs: Decimal[] } & Valuation {
  const w = D(o.wacc), g = D(o.g), N = flows.length, mid = !!o.midYear;
  const df = (e: number) => D(1).div(D(1).plus(w).pow(e));
  const dfs = flows.map((_, i) => df(mid ? i + 0.5 : i + 1));
  const pvs = flows.map((f, i) => f.mul(dfs[i]!));
  const pvExplicit = pvs.reduce((a, b) => a.plus(b), D(0));
  const last = flows[N - 1]!;
  const method = o.method ?? 'value-driver';
  const nopatNext = o.nopatN !== undefined ? D(o.nopatN).mul(D(1).plus(g)) : last.mul(D(1).plus(g));
  const fcffNext = method === 'plain' ? last.mul(D(1).plus(g)) : nopatNext.mul(D(1).minus(g.div(D(o.roicT ?? w))));
  const tv = fcffNext.div(w.minus(g));
  const dfT = df(mid ? N - 0.5 : N);          // Gordon TV with mid-year flows is discounted at N − 0.5
  const pvTv = tv.mul(dfT);
  const ev = pvExplicit.plus(pvTv);
  const b = o.bridge;
  const equityValue = ev.minus(D(b.debt)).minus((o.leaseTreatment ?? 'debt') === 'debt' ? D(b.leases) : D(0))
    .minus(D(b.preferred)).minus(D(b.minorities)).plus(D(b.cash)).plus(D(b.nonOperating));
  const valuePerShare = equityValue.div(D(o.shares));
  const tvShare = ev.isZero() ? D(0) : pvTv.div(ev);
  const warnings: Issue[] = [];
  if (tvShare.gt(0.75)) warnings.push({ code: 'TV_SHARE_HIGH', message: 'Terminal value is above 75% of enterprise value.' });
  if (method === 'value-driver' && D(o.roicT ?? w).gt(w.plus(0.05))) warnings.push({ code: 'ROIC_TERMINAL_HIGH', message: 'Terminal ROIC is more than 5 points above WACC.' });
  if (equityValue.lt(0)) warnings.push({ code: 'NEGATIVE_EQUITY', message: 'Equity value is negative.' });
  const r: { dfs: Decimal[]; pvs: Decimal[] } & Valuation = { dfs, pvs, pvExplicit, terminal: { nopatNext, fcffNext, value: tv, discountFactor: dfT, pv: pvTv }, ev, equityValue, valuePerShare, tvShare, warnings };
  if (o.price !== undefined && D(o.price).gt(0)) r.upside = valuePerShare.div(D(o.price)).minus(1);
  return r;
}

export function isFinancialCompany(typeOrSector?: string | null): boolean {
  if (!typeOrSector) return false;
  const s = typeOrSector.toLowerCase().trim();
  return (
    s === 'bank' ||
    s === 'nbfc' ||
    s === 'insurance' ||
    s === 'financial' ||
    s.includes('bank') ||
    s.includes('financ') ||
    s.includes('insurance') ||
    s.includes('nbfc')
  );
}

export function routeValuationModel(company: { companyType?: string | null; sector?: string | null; industry?: string | null }): 'fcff' | 'residual_income' {
  if (
    isFinancialCompany(company.companyType) ||
    isFinancialCompany(company.sector) ||
    isFinancialCompany(company.industry)
  ) {
    return 'residual_income';
  }
  return 'fcff';
}

export function validate(i: DcfInputs): Issue[] {
  const e: Issue[] = []; const w = D(i.wacc), g = D(i.terminalGrowth);
  if (i.companyType && isFinancialCompany(i.companyType)) {
    e.push({ code: 'FINANCIAL_COMPANY_ROUTING', message: 'Financial institutions (banks, NBFCs, insurers) must use Residual Income / DDM valuation, not FCFF DCF.' });
  }
  if (i.sector && isFinancialCompany(i.sector)) {
    e.push({ code: 'FINANCIAL_COMPANY_ROUTING', message: 'Financial institutions (banks, NBFCs, insurers) must use Residual Income / DDM valuation, not FCFF DCF.' });
  }
  if (i.growth.length !== 5 || i.ebitMargin.length !== 5 || i.taxRate.length !== 5) e.push({ code: 'PATH_LENGTH', message: 'growth, ebitMargin and taxRate need exactly 5 values.' });
  if (D(i.baseRevenue).lte(0)) e.push({ code: 'REVENUE', message: 'Base revenue must be positive.' });
  if (w.lt(0.05) || w.gt(0.25)) e.push({ code: 'WACC_RANGE', message: 'WACC must be between 5% and 25%.' });
  if (w.lte(g.plus(0.005))) e.push({ code: 'WACC_VS_G', message: 'WACC must exceed terminal growth by at least 0.5 points.' });
  if (g.gt(i.maxTerminalGrowth ?? 0.06)) e.push({ code: 'G_TOO_HIGH', message: 'Terminal growth exceeds the allowed ceiling.' });
  if (D(i.dilutedShares).lte(0)) e.push({ code: 'SHARES', message: 'Diluted shares must be positive.' });
  if (D(i.salesToCapital).lte(0)) e.push({ code: 'S2C', message: 'Sales-to-capital must be positive.' });
  if ((i.terminalMethod ?? 'value-driver') === 'value-driver' && D(i.roicTerminal).lte(0)) e.push({ code: 'ROIC_T', message: 'Terminal ROIC must be positive.' });
  i.taxRate.forEach((t) => { if (D(t).lt(0) || D(t).gte(0.5)) e.push({ code: 'TAX', message: 'Tax rates must be in [0%, 50%).' }); });
  return e;
}

/** 5 explicit years + 5 fade years (growth, margin, tax fade linearly to terminal values at year 10). */
export function project(i: DcfInputs): YearRow[] {
  const gT = D(i.terminalGrowth), g5 = D(i.growth[4]!), m5 = D(i.ebitMargin[4]!), mT = i.terminalMargin !== undefined ? D(i.terminalMargin) : m5;
  const x5 = D(i.taxRate[4]!), xT = i.terminalTax !== undefined ? D(i.terminalTax) : x5;
  const rows: YearRow[] = []; let prev = D(i.baseRevenue);
  for (let t = 1; t <= 10; t++) {
    const explicit = t <= 5, k = D(t - 5).div(5);
    const g = explicit ? D(i.growth[t - 1]!) : g5.plus(gT.minus(g5).mul(k));
    const m = explicit ? D(i.ebitMargin[t - 1]!) : m5.plus(mT.minus(m5).mul(k));
    const x = explicit ? D(i.taxRate[t - 1]!) : x5.plus(xT.minus(x5).mul(k));
    const revenue = prev.mul(D(1).plus(g)), ebit = revenue.mul(m), nopat = ebit.mul(D(1).minus(x));
    const reinvestment = revenue.minus(prev).div(D(i.salesToCapital)), fcff = nopat.minus(reinvestment);
    rows.push({ t, phase: explicit ? 'explicit' : 'fade', revenue, growth: g, ebitMargin: m, ebit, taxRate: x, nopat, reinvestment, fcff, discountFactor: D(0), pv: D(0) });
    prev = revenue;
  }
  return rows;
}

export function dcf(i: DcfInputs): DcfResult {
  const errors = validate(i); if (errors.length) return { ok: false, errors };
  const rows = project(i);
  const v = valueFlows(rows.map((r) => r.fcff), { wacc: i.wacc, g: i.terminalGrowth, midYear: i.midYear, method: i.terminalMethod, nopatN: rows[9]!.nopat, roicT: i.roicTerminal, bridge: i.bridge, leaseTreatment: i.leaseTreatment, shares: i.dilutedShares, price: i.price });
  rows.forEach((r, k) => { r.discountFactor = v.dfs[k]!; r.pv = v.pvs[k]!; });
  if (rows.some((r) => r.reinvestment.lt(0))) v.warnings.push({ code: 'NEGATIVE_REINVESTMENT', message: 'Revenue declines release capital in some years.' });
  const { dfs: _d, pvs: _p, ...val } = v;
  return { ok: true, rows, ...val };
}

// ---------- WACC building blocks
export const costOfEquity = (p: { rf: Num; beta: Num; erp: Num; crp?: Num }) => D(p.rf).plus(D(p.beta).mul(D(p.erp))).plus(D(p.crp ?? 0));
export const blume = (rawBeta: Num) => D(rawBeta).mul(0.67).plus(0.33);
export const unlever = (betaL: Num, de: Num, t: Num) => D(betaL).div(D(1).plus(D(1).minus(D(t)).mul(D(de))));
export const relever = (betaU: Num, de: Num, t: Num) => D(betaU).mul(D(1).plus(D(1).minus(D(t)).mul(D(de))));
export function wacc(p: { ke: Num; kd: Num; tax: Num; equity: Num; debt: Num }): Decimal {
  const E = D(p.equity), Dd = D(p.debt), V = E.plus(Dd);
  return E.div(V).mul(D(p.ke)).plus(Dd.div(V).mul(D(p.kd)).mul(D(1).minus(D(p.tax))));
}

// ---------- Slider → paths (matches the UI controls)
export function pathsFromSliders(p: { baseMargin: Num; targetMargin: Num; growth5y: Num; terminalGrowth: Num; tax: Num }) {
  const gT = D(p.terminalGrowth), g1 = D(p.growth5y), g5 = g1.plus(gT).div(2);
  const growth = [0, 1, 2, 3, 4].map((k) => g1.plus(g5.minus(g1).mul(k).div(4)));
  const ebitMargin = [1, 2, 3, 4, 5].map((t) => D(p.baseMargin).plus(D(p.targetMargin).minus(D(p.baseMargin)).mul(t).div(5)));
  return { growth, ebitMargin, taxRate: [0, 1, 2, 3, 4].map(() => D(p.tax)) };
}

// ---------- Sensitivity, scenarios, reverse DCF
export function sensitivity(base: DcfInputs, step = 0.005, n = 2) {
  const ks = Array.from({ length: 2 * n + 1 }, (_, k) => k - n);
  const waccs = ks.map((k) => D(base.wacc).plus(D(step).mul(k))), gs = ks.map((k) => D(base.terminalGrowth).plus(D(step).mul(k)));
  const values = waccs.map((w) => gs.map((g) => { const r = dcf({ ...base, wacc: w, terminalGrowth: g }); return r.ok ? r.valuePerShare : null; }));
  return { waccs, gs, values, baseIndex: [n, n] as const };
}
export interface ScenariosResult {
  bear: DcfResult;
  base: DcfResult;
  bull: DcfResult;
  weighted: Decimal | null;
  error?: 'PROBABILITIES_MUST_SUM_TO_1' | undefined;
}

export function scenarios(base: DcfInputs, o: { bear: Partial<DcfInputs>; bull: Partial<DcfInputs> }, probs?: { bear: Num; base: Num; bull: Num }): ScenariosResult {
  const run = (x: Partial<DcfInputs>) => dcf({ ...base, ...x });
  const res = { bear: run(o.bear), base: run({}), bull: run(o.bull) };
  let weighted: Decimal | null = null;
  if (probs) {
    const s = D(probs.bear).plus(D(probs.base)).plus(D(probs.bull));
    if (!s.minus(1).abs().lt(1e-9)) return { ...res, weighted, error: 'PROBABILITIES_MUST_SUM_TO_1' };
    if (res.bear.ok && res.base.ok && res.bull.ok) weighted = res.bear.valuePerShare.mul(D(probs.bear)).plus(res.base.valuePerShare.mul(D(probs.base))).plus(res.bull.valuePerShare.mul(D(probs.bull)));
  }
  return { ...res, weighted };
}
export type Driver = 'growth' | 'margin' | 'wacc';
export function reverseDcf(base: DcfInputs, price: Num, driver: Driver = 'growth', maxIter = 200) {
  const withX = (x: number): DcfInputs => driver === 'growth' ? { ...base, growth: [0, 1, 2, 3, 4].map(() => x) }
    : driver === 'margin' ? { ...base, ebitMargin: [0, 1, 2, 3, 4].map(() => x), terminalMargin: x } : { ...base, wacc: x };
  const f = (x: number) => { const r = dcf(withX(x)); return r.ok ? r.valuePerShare.minus(D(price)).toNumber() : null; };
  let lo = driver === 'growth' ? -0.2 : driver === 'margin' ? 0.01 : D(base.terminalGrowth).toNumber() + 0.006;
  let hi = driver === 'growth' ? 0.5 : driver === 'margin' ? 0.6 : 0.25;
  const flo = f(lo), fhi = f(hi);
  if (flo === null || fhi === null || flo * fhi > 0) return { solved: false as const, reason: 'NO_SOLUTION_IN_BOUNDS', bounds: [lo, hi] as const };
  const tol = D(price).toNumber() * 1e-6; let iter = 0;
  while (iter++ < maxIter) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (fm === null) break;
    if (Math.abs(fm) < tol || hi - lo < 1e-12) return { solved: true as const, x: mid, iterations: iter };
    if ((f(lo)! < 0) === (fm < 0)) lo = mid; else hi = mid;
  }
  return { solved: false as const, reason: 'NO_CONVERGENCE', bounds: [lo, hi] as const };
}
