import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  dcf,
  valueFlows,
  wacc,
  costOfEquity,
  sensitivity,
  scenarios,
  reverseDcf,
  pathsFromSliders,
  blume,
  unlever,
  relever,
  isFinancialCompany,
  routeValuationModel,
  type DcfInputs
} from './dcf.js';
import { epv, residualIncome, ddm } from './alt-models.js';

const D = (x: Decimal.Value) => new Decimal(x);
const near = (a: Decimal.Value, b: number, tol: number, m: string) => {
  const diff = D(a).minus(b).abs();
  expect(diff.lte(tol), `${m}: got ${a}, expected ${b}`).toBe(true);
};

const bridge = { debt: 300, leases: 0, preferred: 0, minorities: 10, cash: 100, nonOperating: 0 };

describe('Reference DCF Engine & Alternative Models', () => {
  it('golden: plain Gordon, year-end', () => {
    const v = valueFlows([100, 110, 121, 133.1, 146.41].map(D), {
      wacc: 0.12,
      g: 0.04,
      method: 'plain',
      bridge,
      shares: 100
    });
    near(v.pvExplicit, 430.77, 0.01, 'PV explicit');
    near(v.terminal.value, 1903.33, 0.01, 'TV');
    near(v.terminal.pv, 1080.0, 0.01, 'PV TV');
    near(v.ev, 1510.77, 0.02, 'EV');
    near(v.equityValue, 1300.77, 0.02, 'equity');
    near(v.valuePerShare, 13.0077, 0.001, 'per share');
    near(v.tvShare, 0.715, 0.001, 'TV share');
  });

  it('mid-year identity: EV_mid = EV_end × (1+WACC)^0.5', () => {
    const f = [100, 110, 121, 133.1, 146.41].map(D);
    const o = { wacc: 0.12, g: 0.04, method: 'plain' as const, bridge, shares: 100 };
    const a = valueFlows(f, o);
    const b = valueFlows(f, { ...o, midYear: true });
    near(b.ev, a.ev.mul(D(1.12).pow(0.5)).toNumber(), 1e-9, 'identity');
  });

  it('WACC example 11.75%', () => {
    const ke = costOfEquity({ rf: 0.07, beta: 1, erp: 0.06 });
    near(ke, 0.13, 1e-12, 'Ke');
    near(wacc({ ke, kd: 0.09, tax: 0.25, equity: 80, debt: 20 }), 0.1175, 1e-12, 'WACC');
  });

  it('beta helpers', () => {
    near(blume(1.2), 1.134, 1e-12, 'blume');
    const bu = unlever(1.2, 0.5, 0.25);
    near(relever(bu, 0.5, 0.25), 1.2, 1e-12, 'round trip');
  });

  it('value-driver TV with ROIC=WACC equals NOPAT_next / WACC', () => {
    const v = valueFlows([50, 55].map(D), {
      wacc: 0.1,
      g: 0.04,
      method: 'value-driver',
      nopatN: 80,
      roicT: 0.1,
      bridge,
      shares: 1
    });
    near(v.terminal.value, (80 * 1.04) / 0.1, 1e-9, 'TV');
  });

  const base: DcfInputs = {
    currency: 'INR',
    baseRevenue: 1000,
    ...pathsFromSliders({
      baseMargin: 0.15,
      targetMargin: 0.2,
      growth5y: 0.12,
      terminalGrowth: 0.04,
      tax: 0.25
    }),
    terminalGrowth: 0.04,
    salesToCapital: 1.5,
    roicTerminal: 0.12,
    wacc: 0.12,
    bridge,
    dilutedShares: 100,
    price: 20
  };

  it('slider paths', () => {
    near(base.growth[0]!, 0.12, 1e-12, 'g1');
    near(base.growth[4]!, 0.08, 1e-12, 'g5');
    near(base.ebitMargin[4]!, 0.2, 1e-12, 'm5');
  });

  it('full model runs, fades to terminal growth in year 10', () => {
    const r = dcf(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.length).toBe(10);
    near(r.rows[9]!.growth, 0.04, 1e-12, 'g10');
    near(r.rows[5]!.growth, 0.072, 1e-12, 'g6');
    near(r.rows[0]!.revenue, 1120, 1e-9, 'rev1');
    near(r.rows[0]!.nopat, 1120 * (0.15 + 0.05 / 5) * 0.75, 1e-9, 'nopat1');
    expect(r.valuePerShare.gt(0)).toBe(true);
  });

  it('monotonic: value falls as WACC rises, rises with g', () => {
    const v = (o: Partial<DcfInputs>) => {
      const r = dcf({ ...base, ...o });
      expect(r.ok).toBe(true);
      return r.ok ? r.valuePerShare : D(0);
    };
    expect(v({ wacc: 0.11 }).gt(v({ wacc: 0.12 }))).toBe(true);
    expect(v({ wacc: 0.13 }).lt(v({ wacc: 0.12 }))).toBe(true);
    expect(v({ terminalGrowth: 0.045 }).gt(v({ terminalGrowth: 0.04 }))).toBe(true);
  });

  it('validation blocks WACC <= g + 0.5%', () => {
    const r = dcf({ ...base, wacc: 0.044 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.code === 'WACC_VS_G')).toBe(true);
    }
  });

  it('sensitivity centre equals base; invalid cells are null', () => {
    const s = sensitivity(base);
    const b = dcf(base);
    expect(b.ok).toBe(true);
    if (b.ok) {
      expect(s.values[2]![2]!.eq(b.valuePerShare)).toBe(true);
    }
    const edge = sensitivity({ ...base, wacc: 0.06, terminalGrowth: 0.055 });
    expect(edge.values.flat().some((x) => x === null)).toBe(true);
  });

  it('scenarios + probabilities', () => {
    const s = scenarios(
      base,
      { bear: { wacc: 0.13 }, bull: { wacc: 0.11 } },
      { bear: 0.25, base: 0.5, bull: 0.25 }
    );
    expect(s.bear.ok && s.base.ok && s.bull.ok && s.weighted).toBeTruthy();
    if (s.bear.ok && s.bull.ok) {
      expect(s.bear.valuePerShare.lt(s.bull.valuePerShare)).toBe(true);
    }
    expect(
      scenarios(base, { bear: {}, bull: {} }, { bear: 0.5, base: 0.5, bull: 0.5 }).error
    ).toBe('PROBABILITIES_MUST_SUM_TO_1');
  });

  it('reverse DCF round trip (growth 8%)', () => {
    const fwd = dcf({ ...base, growth: [0.08, 0.08, 0.08, 0.08, 0.08] });
    expect(fwd.ok).toBe(true);
    if (!fwd.ok) return;
    const r = reverseDcf(base, fwd.valuePerShare, 'growth');
    expect(r.solved).toBe(true);
    if (r.solved) {
      near(r.x, 0.08, 1e-4, 'implied growth');
    }
    expect(reverseDcf(base, 1e9, 'growth').solved).toBe(false);
  });

  it('EPV worked example = 60', () => {
    const r = epv({
      ebitNormalised: 1000,
      tax: 0.25,
      wacc: 0.1,
      cash: 500,
      debt: 2000,
      minorities: 0,
      shares: 100
    });
    near(r.nopat, 750, 1e-9, 'NOPAT');
    near(r.ev, 7500, 1e-9, 'EPV');
    near(r.valuePerShare, 60, 1e-9, 'per share');
  });

  it('residual income worked example', () => {
    const r = residualIncome({
      bv0: 100,
      ke: 0.12,
      roe: [0.16, 0.16, 0.16],
      payout: [0, 0, 0],
      omega: 0,
      shares: 1
    });
    near(r.rows[0]!.ri, 4, 1e-9, 'RI1');
    near(r.rows[1]!.ri, 4.64, 1e-9, 'RI2');
    near(r.rows[2]!.ri, 5.3824, 1e-9, 'RI3');
    near(r.equity, 111.1016, 0.001, 'equity');
  });

  it('DDM', () => {
    near(ddm({ dps1: 10, ke: 0.12, g: 0.04 })!, 125, 1e-9, 'value');
    expect(ddm({ dps1: 10, ke: 0.04, g: 0.04 })).toBe(null);
  });

  it('property: scaling all cash flows by k scales EV by k', () => {
    const rawFlows = [80, 95, 110, 125, 140, 155, 170, 185, 200, 215];
    const flows = rawFlows.map(D);
    const opts = {
      wacc: 0.11,
      g: 0.035,
      method: 'plain' as const,
      bridge,
      shares: 100
    };
    const baseVal = valueFlows(flows, opts);
    
    // Scale flows by k = 2.5
    const k = D(2.5);
    const scaledFlows = flows.map((f) => f.mul(k));
    const scaledVal = valueFlows(scaledFlows, opts);
    
    near(scaledVal.pvExplicit, baseVal.pvExplicit.mul(k).toNumber(), 1e-8, 'scaled PV explicit');
    near(scaledVal.terminal.pv, baseVal.terminal.pv.mul(k).toNumber(), 1e-8, 'scaled PV TV');
    near(scaledVal.ev, baseVal.ev.mul(k).toNumber(), 1e-8, 'scaled EV');
  });

  it('company-type router: routes financial institutions to residual income, never to DCF', () => {
    expect(isFinancialCompany('bank')).toBe(true);
    expect(isFinancialCompany('Banking')).toBe(true);
    expect(isFinancialCompany('nbfc')).toBe(true);
    expect(isFinancialCompany('insurance')).toBe(true);
    expect(isFinancialCompany('Financial Services')).toBe(true);
    expect(isFinancialCompany('technology')).toBe(false);
    expect(isFinancialCompany('Healthcare')).toBe(false);

    expect(routeValuationModel({ companyType: 'bank' })).toBe('residual_income');
    expect(routeValuationModel({ companyType: 'nbfc' })).toBe('residual_income');
    expect(routeValuationModel({ companyType: 'insurance' })).toBe('residual_income');
    expect(routeValuationModel({ sector: 'Financial Services' })).toBe('residual_income');
    expect(routeValuationModel({ sector: 'Commercial Banks' })).toBe('residual_income');
    expect(routeValuationModel({ companyType: 'standard', sector: 'Technology' })).toBe('fcff');

    // Hard invariant: financial companies are strictly blocked from dcf()
    const bankDcf = dcf({ ...base, companyType: 'bank' });
    expect(bankDcf.ok).toBe(false);
    if (!bankDcf.ok) {
      expect(bankDcf.errors.some((e) => e.code === 'FINANCIAL_COMPANY_ROUTING')).toBe(true);
    }

    const finSectorDcf = dcf({ ...base, sector: 'Financial Services' });
    expect(finSectorDcf.ok).toBe(false);
    if (!finSectorDcf.ok) {
      expect(finSectorDcf.errors.some((e) => e.code === 'FINANCIAL_COMPANY_ROUTING')).toBe(true);
    }
  });

  it('parity & determinism: 50 diverse valid inputs yield bit-for-bit identical outputs without side effects', () => {
    // Generate 50 deterministically varied valid inputs
    for (let i = 0; i < 50; i++) {
      const gStart = 0.05 + (i % 10) * 0.015; // 5% to 18.5%
      const gTerm = 0.02 + (i % 5) * 0.005;   // 2% to 4%
      const margin = 0.12 + (i % 8) * 0.02;   // 12% to 26%
      const waccVal = gTerm + 0.05 + (i % 6) * 0.01; // strictly > gTerm + 0.5%
      const rev = 500 + i * 150;

      const input: DcfInputs = {
        currency: i % 2 === 0 ? 'INR' : 'USD',
        baseRevenue: rev,
        ...pathsFromSliders({
          baseMargin: margin,
          targetMargin: margin + 0.03,
          growth5y: gStart,
          terminalGrowth: gTerm,
          tax: 0.25
        }),
        terminalGrowth: gTerm,
        salesToCapital: 1.2 + (i % 4) * 0.4,
        roicTerminal: waccVal + 0.01,
        wacc: waccVal,
        midYear: i % 3 === 0,
        terminalMethod: i % 2 === 0 ? 'value-driver' : 'plain',
        bridge: { debt: 200, leases: 20, preferred: 0, minorities: 5, cash: 150, nonOperating: 10 },
        dilutedShares: 50 + i * 5,
        price: 100 + i * 10
      };

      const run1 = dcf(input);
      const run2 = dcf(input);

      expect(run1.ok).toBe(true);
      expect(run2.ok).toBe(true);
      if (run1.ok && run2.ok) {
        expect(run1.ev.toString()).toBe(run2.ev.toString());
        expect(run1.equityValue.toString()).toBe(run2.equityValue.toString());
        expect(run1.valuePerShare.toString()).toBe(run2.valuePerShare.toString());
        expect(run1.pvExplicit.toString()).toBe(run2.pvExplicit.toString());
        expect(run1.terminal.pv.toString()).toBe(run2.terminal.pv.toString());
      }
    }
  });
});
