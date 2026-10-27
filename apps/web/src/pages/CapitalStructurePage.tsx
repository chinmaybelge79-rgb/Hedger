import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  optimizeCapitalStructure,
  estimateSyntheticCreditRating,
  releverBetaRatio,
  LARGE_CAP_SYNTHETIC_RATINGS
} from '@hedger/valuation';
import { formatCompact, formatPercent } from '@hedger/format';

interface CompanyPreset {
  symbol: string;
  name: string;
  currency: string;
  enterpriseValue: number;
  ebit: number;
  currentDebt: number;
  unleveredBeta: number;
  riskFreeRate: number;
  equityRiskPremium: number;
  taxRate: number;
}

const PRESETS: Record<string, CompanyPreset> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    currency: 'USD',
    enterpriseValue: 3450000000000,
    ebit: 78000000000,
    currentDebt: 8500000000,
    unleveredBeta: 1.25,
    riskFreeRate: 4.25,
    equityRiskPremium: 5.0,
    taxRate: 0.18
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currency: 'USD',
    enterpriseValue: 3500000000000,
    ebit: 123000000000,
    currentDebt: 105000000000,
    unleveredBeta: 0.95,
    riskFreeRate: 4.25,
    equityRiskPremium: 5.0,
    taxRate: 0.16
  },
  RELIANCE: {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Limited',
    currency: 'INR',
    enterpriseValue: 18500000000000,
    ebit: 1450000000000,
    currentDebt: 3100000000000,
    unleveredBeta: 0.85,
    riskFreeRate: 6.85,
    equityRiskPremium: 6.0,
    taxRate: 0.25
  },
  TCS: {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    currency: 'INR',
    enterpriseValue: 9150000000000,
    ebit: 580000000000,
    currentDebt: 95000000000,
    unleveredBeta: 0.72,
    riskFreeRate: 6.85,
    equityRiskPremium: 6.0,
    taxRate: 0.25
  }
};

export const CapitalStructurePage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('NVDA');
  const activePreset = PRESETS[selectedPreset] || PRESETS.NVDA!;

  const [ebit, setEbit] = useState<number>(activePreset.ebit);
  const [enterpriseValue, setEnterpriseValue] = useState<number>(activePreset.enterpriseValue);
  const [currentDebt, setCurrentDebt] = useState<number>(activePreset.currentDebt);
  const [unleveredBeta, setUnleveredBeta] = useState<number>(activePreset.unleveredBeta);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(activePreset.riskFreeRate);
  const [equityRiskPremium, setEquityRiskPremium] = useState<number>(activePreset.equityRiskPremium);
  const [taxRate, setTaxRate] = useState<number>(activePreset.taxRate);

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    const p = PRESETS[key] || PRESETS.NVDA!;
    setEbit(p.ebit);
    setEnterpriseValue(p.enterpriseValue);
    setCurrentDebt(p.currentDebt);
    setUnleveredBeta(p.unleveredBeta);
    setRiskFreeRate(p.riskFreeRate);
    setEquityRiskPremium(p.equityRiskPremium);
    setTaxRate(p.taxRate);
  };

  const optimization = useMemo(() => {
    return optimizeCapitalStructure({
      ebit,
      enterpriseValue,
      currentDebt,
      unleveredBeta,
      riskFreeRate,
      equityRiskPremium,
      taxRate
    });
  }, [ebit, enterpriseValue, currentDebt, unleveredBeta, riskFreeRate, equityRiskPremium, taxRate]);

  // Current Interest Coverage & Rating
  const currentInterest = currentDebt * ((riskFreeRate + 1.25) / 100);
  const currentCoverage = currentInterest > 0 ? ebit / currentInterest : 999;
  const currentRating = estimateSyntheticCreditRating(currentCoverage);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '40px 0 32px' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/models" style={{ color: 'inherit', textDecoration: 'none' }}>Valuation Models</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Capital Structure & WACC Optimizer</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              STANDALONE OPTIMIZER
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hamada Unlevering · Damodaran Synthetic Ratings · WACC Curve
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Capital Structure & WACC Optimizer
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '820px', lineHeight: 1.5, margin: 0 }}>
            Model debt capacity, estimate synthetic credit ratings from interest coverage ratios, and calculate the cost-minimizing debt ratio using pure Hamada beta re-levering.
          </p>
        </div>
      </header>

      {/* Main Container */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        {/* Company Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Load Preset:</span>
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: selectedPreset === key ? 600 : 500,
                border: '1px solid',
                borderColor: selectedPreset === key ? 'var(--accent, #1D1D1F)' : 'var(--border)',
                backgroundColor: selectedPreset === key ? 'var(--accent, #1D1D1F)' : 'var(--surface)',
                color: selectedPreset === key ? 'var(--bg, #FFFFFF)' : 'var(--text)',
                cursor: 'pointer'
              }}
            >
              {PRESETS[key]!.name} ({PRESETS[key]!.symbol})
            </button>
          ))}
        </div>

        {/* 3 Metric Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Current Capital Structure
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', marginTop: '4px' }}>
              {(optimization.currentDebtRatio * 100).toFixed(1)}% Debt
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Current WACC: <strong style={{ color: 'var(--foreground)' }}>{optimization.currentWACC.toFixed(2)}%</strong>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Optimal Capital Structure
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
              {(optimization.optimalDebtRatio * 100).toFixed(0)}% Debt
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Min WACC: <strong style={{ color: '#22c55e' }}>{optimization.optimalWACC.toFixed(2)}%</strong> ({(optimization.currentWACC - optimization.optimalWACC).toFixed(2)}% WACC reduction)
            </div>
          </div>

          <div className="card" style={{ padding: '20px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Synthetic Credit Rating
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)' }}>
                {currentRating.rating}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                +{currentRating.defaultSpreadPercent.toFixed(2)}% spread
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Interest Coverage: <strong style={{ color: 'var(--foreground)' }}>{currentCoverage.toFixed(1)}x</strong>
            </div>
          </div>
        </div>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', padding: '24px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '32px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Operating Income / EBIT
            </label>
            <input
              type="number"
              value={ebit}
              onChange={(e) => setEbit(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Enterprise Value
            </label>
            <input
              type="number"
              value={enterpriseValue}
              onChange={(e) => setEnterpriseValue(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Unlevered Beta (βU)
            </label>
            <input
              type="number"
              step="0.05"
              value={unleveredBeta}
              onChange={(e) => setUnleveredBeta(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Risk-Free Rate (Rf %)
            </label>
            <input
              type="number"
              step="0.1"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Equity Risk Premium (ERP %)
            </label>
            <input
              type="number"
              step="0.1"
              value={equityRiskPremium}
              onChange={(e) => setEquityRiskPremium(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Marginal Tax Rate (t)
            </label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Debt-Capacity & WACC Curve Table */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--card-bg, #09090b)', overflow: 'hidden', marginBottom: '40px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 2px 0' }}>
                Debt-Capacity & Cost of Capital Curve
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Evaluating blended cost of capital across leverage levels from 0% to 90% debt ratio.
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Optimal: {(optimization.optimalDebtRatio * 100).toFixed(0)}% Debt
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--bg)' }}>
                  <th style={{ padding: '10px 14px' }}>Debt Ratio</th>
                  <th style={{ padding: '10px 14px' }}>D/E Ratio</th>
                  <th style={{ padding: '10px 14px' }}>Synthetic Rating</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cost of Debt (Kd)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Relevered Beta (βL)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cost of Equity (Ke)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Blended WACC</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Implied EV</th>
                </tr>
              </thead>
              <tbody>
                {optimization.points.map((pt, idx) => {
                  const isOpt = pt.debtRatio === optimization.optimalDebtRatio;
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isOpt ? 'rgba(34, 197, 94, 0.08)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: isOpt ? 700 : 500, color: isOpt ? '#22c55e' : 'var(--foreground)' }}>
                        {(pt.debtRatio * 100).toFixed(0)}% {isOpt && '(Optimal)'}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {pt.debtToEquity.toFixed(2)}x
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                          {pt.syntheticRating}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {pt.afterTaxCostOfDebt.toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {pt.releveredBeta.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                        {pt.costOfEquity.toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: isOpt ? '#22c55e' : 'var(--foreground)', fontFamily: 'monospace' }}>
                        {pt.wacc.toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: isOpt ? 700 : 500, fontFamily: 'monospace' }}>
                        {formatCompact({ amount: pt.enterpriseValue, currency: activePreset.currency || 'USD' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Reference Box */}
        <div style={{ padding: '20px 24px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Methodology & Theoretical Grounding
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Synthetic credit ratings are derived directly from interest coverage thresholds developed by Prof. Aswath Damodaran (Stern School of Business).
            Equity betas are unlevered to isolate pure asset operating risk and relevered dynamically across trial debt ratios using the Hamada equation:
            <code style={{ marginLeft: '6px', padding: '2px 6px', backgroundColor: 'var(--bg)', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
              βL = βU × [1 + (1 - t)(D/E)]
            </code>.
          </p>
        </div>
      </main>
    </div>
  );
};
