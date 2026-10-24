import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companyPath, normalizeSymbol } from '../lib/navigation.js';
import {
  calculateDCF,
  calculateScenarios,
  reverseDCF
} from '@hedger/valuation';
import type { DCFInputs } from '@hedger/types';
import {
  formatPrice,
  formatDelta,
  formatCompact,
  formatPercent,
  formatDate
} from '@hedger/format';

interface AuditLog {
  timestamp: string;
  field: string;
  oldVal: string;
  newVal: string;
}

export const ModelWorkbenchPage: React.FC = () => {
  const { model: rawModel = 'dcf', symbol: rawSymbol = 'TCS.NS' } = useParams<{ model: string; symbol: string }>();
  const navigate = useNavigate();

  const model = (rawModel || 'dcf').toLowerCase();
  const symbol = normalizeSymbol(rawSymbol || 'TCS.NS');

  // Company Overview & Valuation data
  const [overview, setOverview] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal State
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Model-specific inputs
  // 1. Institutional DCF Inputs
  const [revenueCAGR, setRevenueCAGR] = useState<number>(10.0);
  const [targetMargin, setTargetMargin] = useState<number>(18.0);
  const [taxRate, setTaxRate] = useState<number>(25.0);
  const [wacc, setWacc] = useState<number>(11.5);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(4.0);
  const [terminalMethod, setTerminalMethod] = useState<'perpetual_growth' | 'exit_multiple'>('perpetual_growth');
  const [exitMultiple, setExitMultiple] = useState<number>(12.0);
  const [daRatio, setDaRatio] = useState<number>(4.0);
  const [capexRatio, setCapexRatio] = useState<number>(5.0);
  const [nowcRatio, setNowcRatio] = useState<number>(12.0);

  // 2. Banking Inputs (Excess Returns, DDM, P/TBV)
  const [costOfEquity, setCostOfEquity] = useState<number>(12.5);
  const [roe, setRoe] = useState<number>(16.0);
  const [tangibleBookPerShare, setTangibleBookPerShare] = useState<number>(380);

  // 3. Multiples Inputs
  const [peerMultiple, setPeerMultiple] = useState<number>(18.5);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetch(`/api/instruments/${encodeURIComponent(symbol)}/overview`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/instruments/${encodeURIComponent(symbol)}/valuation`).then((r) => (r.ok ? r.json() : null))
    ])
      .then(([ov, val]) => {
        if (!isMounted) return;
        if (ov?.data) {
          setOverview(ov.data);
          const price = ov.data.price || 100;
          setTangibleBookPerShare(Math.round(price * 0.5));
          if (ov.data.keyStats?.peRatio) {
            setPeerMultiple(Number(ov.data.keyStats.peRatio.toFixed(1)));
          }
        }
        if (val?.inputs) {
          setValuationData(val);
          if (val.inputs.wacc) setWacc(Number((val.inputs.wacc * 100).toFixed(2)));
          if (val.inputs.terminalGrowthRate) setTerminalGrowth(Number((val.inputs.terminalGrowthRate * 100).toFixed(1)));
          if (val.inputs.operatingMargin) setTargetMargin(Number((val.inputs.operatingMargin * 100).toFixed(1)));
          if (val.inputs.taxRate) setTaxRate(Number((val.inputs.taxRate * 100).toFixed(1)));
          if (val.inputs.revenueGrowthRates?.[0]) setRevenueCAGR(Number((val.inputs.revenueGrowthRates[0] * 100).toFixed(1)));
          if (val.inputs.daRatio) setDaRatio(Number((val.inputs.daRatio * 100).toFixed(1)));
          if (val.inputs.capexRatio) setCapexRatio(Number((val.inputs.capexRatio * 100).toFixed(1)));
          if (val.inputs.nowcRatio) setNowcRatio(Number((val.inputs.nowcRatio * 100).toFixed(1)));
          if (val.inputs.terminalMethod) setTerminalMethod(val.inputs.terminalMethod);
          if (val.inputs.exitMultiple) setExitMultiple(val.inputs.exitMultiple);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Log changes
  const logChange = (field: string, oldVal: string, newVal: string) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setAuditLogs((prev) => [{ timestamp: time, field, oldVal, newVal }, ...prev.slice(0, 19)]);
  };

  const currentPrice = overview?.price ?? 100.0;
  const currency = overview?.currency || 'INR';

  // Compute Institutional DCF via @hedger/valuation engine
  const dcfEngineData = useMemo(() => {
    const currentRev =
      valuationData?.inputs?.currentRevenue ||
      (overview?.marketCap ? overview.marketCap * 0.25 : 50000000000);
    const shares =
      overview?.sharesOutstanding || valuationData?.inputs?.sharesOutstanding || 1000000000;
    const cash = valuationData?.inputs?.cashAndEquivalents ?? 5000000000;
    const debt = valuationData?.inputs?.totalDebt ?? 5000000000;

    const rates = [
      revenueCAGR / 100,
      (revenueCAGR * 0.95) / 100,
      (revenueCAGR * 0.9) / 100,
      (revenueCAGR * 0.85) / 100,
      (revenueCAGR * 0.8) / 100
    ];

    const inputs: DCFInputs = {
      currentRevenue: currentRev,
      revenueGrowthRates: rates,
      operatingMargin: targetMargin / 100,
      taxRate: taxRate / 100,
      reinvestmentRate: 0.2,
      wacc: wacc / 100,
      terminalGrowthRate: terminalGrowth / 100,
      cashAndEquivalents: cash,
      totalDebt: debt,
      sharesOutstanding: shares,
      daRatio: daRatio / 100,
      capexRatio: capexRatio / 100,
      nowcRatio: nowcRatio / 100,
      baseNowc: currentRev * (nowcRatio / 100),
      terminalMethod,
      exitMultiple
    };

    try {
      const output = calculateDCF({ inputs, currentPrice });
      const scenarios = calculateScenarios(inputs, currentPrice);
      return { output, scenarios, inputs };
    } catch {
      return null;
    }
  }, [
    valuationData,
    overview,
    currentPrice,
    revenueCAGR,
    targetMargin,
    taxRate,
    wacc,
    terminalGrowth,
    terminalMethod,
    exitMultiple,
    daRatio,
    capexRatio,
    nowcRatio
  ]);

  // Model-specific Output for Header & Summary Card
  const modelOutput = useMemo(() => {
    if (model === 'dcf') {
      const iv = dcfEngineData?.output.intrinsicValuePerShare ?? currentPrice;
      const mos = dcfEngineData?.output.marginOfSafety
        ? (dcfEngineData.output.marginOfSafety * 100).toFixed(1)
        : '0.0';
      const upside = dcfEngineData?.output.potentialUpside
        ? (dcfEngineData.output.potentialUpside * 100).toFixed(1)
        : '0.0';
      return {
        name: 'Institutional DCF Engine (Discounted Cash Flow)',
        label: 'Intrinsic Value per Share',
        value: iv,
        mos,
        upside,
        isPrice: true
      };
    } else if (model === 'reverse-dcf') {
      let impliedGrowth = 8.5;
      if (dcfEngineData?.inputs) {
        impliedGrowth = reverseDCF(dcfEngineData.inputs, currentPrice) * 100;
      }
      return {
        name: 'Reverse DCF (Market Implied Growth)',
        label: 'Market-Implied 5-Year Revenue Growth',
        value: Number(impliedGrowth.toFixed(1)),
        mos: (impliedGrowth - revenueCAGR).toFixed(1),
        upside: '0.0',
        isPrice: false,
        unit: '%'
      };
    } else if (model === 'multiples') {
      const eps =
        overview?.keyStats?.peRatio && overview.price
          ? overview.price / overview.keyStats.peRatio
          : currentPrice / 20;
      const val = Math.round(peerMultiple * eps);
      const mos = (((val - currentPrice) / currentPrice) * 100).toFixed(1);
      return {
        name: 'Relative Valuation (Peer Multiples)',
        label: 'Implied Value from Peer Median Multiple',
        value: val,
        mos,
        upside: mos,
        isPrice: true
      };
    } else if (model === 'excess-returns') {
      const ke = costOfEquity / 100;
      const r = roe / 100;
      const g = (terminalGrowth / 100) * 0.8;
      const excessSpread = (r - ke) / Math.max(0.01, ke - g);
      const val = Math.round(tangibleBookPerShare * (1 + Math.max(-0.5, excessSpread)));
      const mos = (((val - currentPrice) / currentPrice) * 100).toFixed(1);
      return {
        name: 'Excess Returns Model (Banking & Financials)',
        label: 'Intrinsic Value per Share',
        value: val,
        mos,
        upside: mos,
        isPrice: true
      };
    } else if (model === 'ddm') {
      const d1 = currentPrice * 0.02 * (1 + revenueCAGR / 100);
      const ke = costOfEquity / 100;
      const g = (terminalGrowth / 100) * 0.7;
      const val = Math.round(d1 / Math.max(0.02, ke - g));
      const mos = (((val - currentPrice) / currentPrice) * 100).toFixed(1);
      return {
        name: 'Dividend Discount Model (DDM)',
        label: 'Intrinsic Value of Dividend Distributions',
        value: val,
        mos,
        upside: mos,
        isPrice: true
      };
    } else {
      const fairPtbv = 1.0 + (roe - costOfEquity) * 0.08;
      const val = Math.round(tangibleBookPerShare * Math.max(0.5, fairPtbv));
      const mos = (((val - currentPrice) / currentPrice) * 100).toFixed(1);
      return {
        name: 'Price to Tangible Book (P/TBV)',
        label: 'Fair Value based on ROE / Capital Adequacy',
        value: val,
        mos,
        upside: mos,
        isPrice: true
      };
    }
  }, [
    model,
    dcfEngineData,
    currentPrice,
    overview,
    peerMultiple,
    costOfEquity,
    roe,
    tangibleBookPerShare,
    terminalGrowth,
    revenueCAGR
  ]);

  const handleSaveModel = async () => {
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name: overview?.name || symbol,
          modelName: modelOutput.name,
          priceAtSave: currentPrice,
          currency,
          intrinsicValuePerShare: modelOutput.value,
          marginOfSafety: parseFloat(modelOutput.mos) / 100,
          inputs: {
            wacc,
            terminalGrowth,
            targetMargin,
            revenueCAGR,
            taxRate,
            terminalMethod,
            exitMultiple,
            costOfEquity,
            roe
          },
          notes: saveNotes
        })
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveModalOpen(false);
      }, 1000);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Loading valuation model workbench for <strong style={{ color: 'var(--text)' }}>{symbol}</strong>...
        </div>
      </div>
    );
  }

  const dcfOutput = dcfEngineData?.output;
  const dcfInputs = dcfEngineData?.inputs;
  const scenarios = dcfEngineData?.scenarios;

  return (
    <div className="page-container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
      {/* Top Breadcrumb & Return Link */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate(companyPath(symbol))}
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0
          }}
          className="hover:underline"
        >
          ← Return to {overview?.name || symbol} Dossier
        </button>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Interactive Valuation Workbench (ƒ)
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginTop: '2px', marginBottom: '4px' }}>
            {modelOutput.name}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {symbol} · {overview?.exchange} · Price {formatPrice({ amount: currentPrice, currency })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="btn btn-primary"
            style={{ height: '40px', minHeight: '40px', padding: '0 20px', fontSize: '13px' }}
          >
            Save Model Version
          </button>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {modelOutput.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }} className="tnum">
              {modelOutput.isPrice ? formatPrice({ amount: modelOutput.value, currency }) : `${modelOutput.value}${modelOutput.unit}`}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: parseFloat(modelOutput.mos) >= 0 ? '#107C41' : '#B3261E',
                marginTop: '4px'
              }}
            >
              {parseFloat(modelOutput.mos) >= 0 ? `+${modelOutput.mos}%` : `${modelOutput.mos}%`} Margin of Safety
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Market Price
            </div>
            <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text)' }} className="tnum">
              {formatPrice({ amount: currentPrice, currency })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              As of {formatDate(new Date())} · DELAYED 15m
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Potential Upside / (Downside)
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: parseFloat(modelOutput.upside) >= 0 ? '#107C41' : '#B3261E'
              }}
              className="tnum"
            >
              {parseFloat(modelOutput.upside) >= 0 ? `+${modelOutput.upside}%` : `${modelOutput.upside}%`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Implied return to fair value
            </div>
          </div>

          {model === 'dcf' && dcfOutput && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enterprise Value Bridge
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>
                <div>EV: <strong>{formatCompact({ amount: dcfOutput.enterpriseValue, currency })}</strong></div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  PV of TV: {formatCompact({ amount: dcfOutput.pvTerminalValue, currency })} ({formatPercent(dcfOutput.terminalValueContribution)} of EV)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INSTITUTIONAL DCF FORECASTING TABLE (When model === 'dcf')    */}
      {/* ------------------------------------------------------------- */}
      {model === 'dcf' && dcfOutput && dcfInputs && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Linked Financial Forecast
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: '2px 0 0 0' }}>
                5-Year Free Cash Flow to Firm (FCFF) Model
              </h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Deterministic FCFF = NOPAT + D&A − CapEx − ΔNOWC
            </span>
          </div>

          <div
            style={{
              overflowX: 'auto',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg, #FFFFFF)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text)', minWidth: '220px' }}>
                    Financial Metric (in {currency})
                  </th>
                  <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-muted)', minWidth: '100px' }}>
                    Base (FY0)
                  </th>
                  {dcfOutput.projections.map((p) => (
                    <th key={p.year} style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)', minWidth: '110px' }}>
                      Year {p.year} (E)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                {/* 1. Revenue */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text)' }}>
                    Revenue
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {formatCompact({ amount: dcfInputs.currentRevenue, currency })}
                  </td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text)' }}>
                      {formatCompact({ amount: p.revenue, currency })}
                    </td>
                  ))}
                </tr>

                {/* 2. Revenue Growth */}
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    Revenue Growth Rate (%)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>
                      {p.growthRate !== undefined ? formatPercent(p.growthRate) : '—'}
                    </td>
                  ))}
                </tr>

                {/* 3. EBIT */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text)' }}>
                    EBIT (Operating Profit)
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {formatCompact({ amount: dcfInputs.currentRevenue * dcfInputs.operatingMargin, currency })}
                  </td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '10px 14px', color: 'var(--text)' }}>
                      {formatCompact({ amount: p.ebit, currency })}
                    </td>
                  ))}
                </tr>

                {/* 4. Operating Taxes */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    (−) Operating Taxes ({taxRate.toFixed(1)}%)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: '#B3261E' }}>
                      {p.operatingTaxes !== undefined ? `−${formatCompact({ amount: p.operatingTaxes, currency })}` : '—'}
                    </td>
                  ))}
                </tr>

                {/* 5. NOPAT */}
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text)' }}>
                    (=) NOPAT (Net Operating Profit After Tax)
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>
                      {formatCompact({ amount: p.nopat, currency })}
                    </td>
                  ))}
                </tr>

                {/* 6. D&A */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    (+) Depreciation & Amortization ({daRatio.toFixed(1)}% of rev)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: '#107C41' }}>
                      {p.depreciationAmortization !== undefined ? `+${formatCompact({ amount: p.depreciationAmortization, currency })}` : '—'}
                    </td>
                  ))}
                </tr>

                {/* 7. CapEx */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    (−) Capital Expenditures ({capexRatio.toFixed(1)}% of rev)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: '#B3261E' }}>
                      {p.capitalExpenditure !== undefined ? `−${formatCompact({ amount: p.capitalExpenditure, currency })}` : '—'}
                    </td>
                  ))}
                </tr>

                {/* 8. Working Capital & Delta NOWC */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    (−) Change in Net Operating Working Capital (ΔNOWC)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: (p.changeInNOWC ?? 0) >= 0 ? '#B3261E' : '#107C41' }}>
                      {p.changeInNOWC !== undefined ? (p.changeInNOWC >= 0 ? `−${formatCompact({ amount: p.changeInNOWC, currency })}` : `+${formatCompact({ amount: Math.abs(p.changeInNOWC), currency })}`) : '—'}
                    </td>
                  ))}
                </tr>

                {/* 9. FCFF Highlight Row */}
                <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                    (=) Free Cash Flow to Firm (FCFF)
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '12px 14px', fontWeight: 700, color: '#107C41', fontSize: '13px' }}>
                      {formatCompact({ amount: p.fcff, currency })}
                    </td>
                  ))}
                </tr>

                {/* 10. Discount Factor */}
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '11px' }}>
                    Discount Factor (1 / (1 + WACC)ᵗ at {wacc.toFixed(2)}%)
                  </td>
                  <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>1.000</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>
                      {p.discountFactor.toFixed(4)}
                    </td>
                  ))}
                </tr>

                {/* 11. Present Value of FCFF */}
                <tr style={{ backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text)' }}>
                    Present Value of FCFF
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>—</td>
                  {dcfOutput.projections.map((p) => (
                    <td key={p.year} style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text)' }}>
                      {formatCompact({ amount: p.presentValue, currency })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid: Parameters & Interactive Controls vs Output & Sensitivity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
        {/* Left Column: Interactive Input Controls */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
            Model Parameters & Inputs
          </h2>

          {/* Standard DCF Controls */}
          {model === 'dcf' && (
            <>
              {/* Revenue CAGR */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>5-Year Revenue Growth CAGR</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{revenueCAGR.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="30.0"
                  step="0.5"
                  value={revenueCAGR}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('Revenue Growth', `${revenueCAGR}%`, `${next}%`);
                    setRevenueCAGR(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>

              {/* Operating Margin */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Operating Margin (EBIT)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{targetMargin.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="40.0"
                  step="0.5"
                  value={targetMargin}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('Operating Margin', `${targetMargin}%`, `${next}%`);
                    setTargetMargin(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>

              {/* WACC */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Weighted Average Cost of Capital (WACC)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{wacc.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="7.0"
                  max="16.0"
                  step="0.25"
                  value={wacc}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('WACC', `${wacc}%`, `${next}%`);
                    setWacc(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>

              {/* Terminal Method Selection */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Terminal Value Methodology
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => {
                      logChange('Terminal Method', terminalMethod, 'perpetual_growth');
                      setTerminalMethod('perpetual_growth');
                    }}
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      fontWeight: terminalMethod === 'perpetual_growth' ? 600 : 400,
                      backgroundColor: terminalMethod === 'perpetual_growth' ? 'var(--accent, #1D1D1F)' : 'transparent',
                      color: terminalMethod === 'perpetual_growth' ? 'var(--bg, #FFFFFF)' : 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    Perpetual Growth (g)
                  </button>
                  <button
                    onClick={() => {
                      logChange('Terminal Method', terminalMethod, 'exit_multiple');
                      setTerminalMethod('exit_multiple');
                    }}
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      fontWeight: terminalMethod === 'exit_multiple' ? 600 : 400,
                      backgroundColor: terminalMethod === 'exit_multiple' ? 'var(--accent, #1D1D1F)' : 'transparent',
                      color: terminalMethod === 'exit_multiple' ? 'var(--bg, #FFFFFF)' : 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    Exit EV/EBITDA
                  </button>
                </div>
              </div>

              {/* Terminal Growth or Exit Multiple Slider */}
              {terminalMethod === 'perpetual_growth' ? (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Terminal Growth Rate (g)</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{terminalGrowth.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="5.5"
                    step="0.25"
                    value={terminalGrowth}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      logChange('Terminal Growth', `${terminalGrowth}%`, `${next}%`);
                      setTerminalGrowth(next);
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Must satisfy WACC &gt; g to prevent perpetual divergence.
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Terminal Exit Multiple</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{exitMultiple.toFixed(1)}x EV/EBITDA</span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="25.0"
                    step="0.5"
                    value={exitMultiple}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      logChange('Exit Multiple', `${exitMultiple}x`, `${next}x`);
                      setExitMultiple(next);
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Reinvestment Assumptions (CapEx, D&A, NOWC) */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
                  Reinvestment & Working Capital
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CapEx / Rev</span>
                    <strong style={{ color: 'var(--text)' }}>{capexRatio.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>D&A / Rev</span>
                    <strong style={{ color: 'var(--text)' }}>{daRatio.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>NOWC / Rev</span>
                    <strong style={{ color: 'var(--text)' }}>{nowcRatio.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Effective Tax</span>
                    <strong style={{ color: 'var(--text)' }}>{taxRate.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Banking / Financials Controls */}
          {(model === 'excess-returns' || model === 'ddm' || model === 'ptbv') && (
            <>
              {/* Cost of Equity */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cost of Equity (Ke)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{costOfEquity.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="18.0"
                  step="0.5"
                  value={costOfEquity}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('Cost of Equity', `${costOfEquity}%`, `${next}%`);
                    setCostOfEquity(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>

              {/* ROE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Return on Equity (ROE)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{roe.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="26.0"
                  step="0.5"
                  value={roe}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('ROE', `${roe}%`, `${next}%`);
                    setRoe(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>

              {/* Tangible Book Value */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tangible Book Value per Share</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {formatPrice({ amount: tangibleBookPerShare, currency })}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.round(currentPrice * 0.1)}
                  max={Math.round(currentPrice * 1.5)}
                  step="5"
                  value={tangibleBookPerShare}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    logChange('Tangible Book', `${tangibleBookPerShare}`, `${next}`);
                    setTangibleBookPerShare(next);
                  }}
                  style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
                />
              </div>
            </>
          )}

          {/* Multiples Controls */}
          {model === 'multiples' && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peer Median P/E Multiple</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{peerMultiple.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="8.0"
                max="45.0"
                step="0.5"
                value={peerMultiple}
                onChange={(e) => {
                  const next = parseFloat(e.target.value);
                  logChange('Peer Multiple', `${peerMultiple}x`, `${next}x`);
                  setPeerMultiple(next);
                }}
                style={{ width: '100%', accentColor: 'var(--accent, #1D1D1F)', cursor: 'pointer' }}
              />
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                setWacc(11.5);
                setTerminalGrowth(4.0);
                setTargetMargin(18.0);
                setRevenueCAGR(10.0);
                setCostOfEquity(12.5);
                setRoe(16.0);
                setTerminalMethod('perpetual_growth');
                setExitMultiple(12.0);
                logChange('Reset', 'Custom', 'Defaults');
              }}
              style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Reset to suggested defaults
            </button>
          </div>
        </div>

        {/* Right Column: EV Bridge & Scenarios & Sensitivity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* EV to Equity Bridge */}
          {model === 'dcf' && dcfOutput && dcfInputs && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                Enterprise to Equity Value Bridge
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Cumulative PV of 5Y Free Cash Flows:</span>
                  <strong style={{ color: 'var(--text)' }}>
                    {formatCompact({ amount: dcfOutput.sumPvFcff, currency })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>PV of Terminal Value ({formatPercent(dcfOutput.terminalValueContribution)}):</span>
                  <strong style={{ color: 'var(--text)' }}>
                    {formatCompact({ amount: dcfOutput.pvTerminalValue, currency })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontWeight: 600, borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>Enterprise Value (EV):</span>
                  <span>{formatCompact({ amount: dcfOutput.enterpriseValue, currency })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#107C41' }}>
                  <span>(+) Cash & Liquid Equivalents:</span>
                  <span>+{formatCompact({ amount: dcfInputs.cashAndEquivalents, currency })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B3261E' }}>
                  <span>(−) Total Debt:</span>
                  <span>−{formatCompact({ amount: dcfInputs.totalDebt, currency })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '13px' }}>
                  <span>(=) Implied Equity Value:</span>
                  <span>{formatCompact({ amount: dcfOutput.equityValue, currency })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>(÷) Diluted Shares Outstanding:</span>
                  <span>{formatCompact({ amount: dcfInputs.sharesOutstanding, currency: '' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)', fontWeight: 700, fontSize: '14px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>(=) Intrinsic Fair Value per Share:</span>
                  <span style={{ color: dcfOutput.marginOfSafety >= 0 ? '#107C41' : '#B3261E' }}>
                    {formatPrice({ amount: dcfOutput.intrinsicValuePerShare, currency })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scenarios (Bear, Base, Bull) */}
          {model === 'dcf' && scenarios && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Deterministic Valuation Scenarios
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Full model rerun across conservative, consensus, and optimistic macroeconomic regimes
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {/* Bear Case */}
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bear Case</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: '4px 0' }}>
                    {formatPrice({ amount: scenarios.bear.intrinsicValuePerShare, currency })}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: scenarios.bear.marginOfSafety >= 0 ? '#107C41' : '#B3261E' }}>
                    {formatPercent(scenarios.bear.marginOfSafety)} MOS
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Growth −3% · Margin −2% · WACC +1%
                  </div>
                </div>

                {/* Base Case */}
                <div style={{ padding: '12px', borderRadius: '8px', border: '2px solid var(--accent, #1D1D1F)', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 700, textTransform: 'uppercase' }}>Base Case</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: '4px 0' }}>
                    {formatPrice({ amount: scenarios.base.intrinsicValuePerShare, currency })}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: scenarios.base.marginOfSafety >= 0 ? '#107C41' : '#B3261E' }}>
                    {formatPercent(scenarios.base.marginOfSafety)} MOS
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Current Active Assumptions
                  </div>
                </div>

                {/* Bull Case */}
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-subtle, #F9F9FB)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bull Case</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: '4px 0' }}>
                    {formatPrice({ amount: scenarios.bull.intrinsicValuePerShare, currency })}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: scenarios.bull.marginOfSafety >= 0 ? '#107C41' : '#B3261E' }}>
                    {formatPercent(scenarios.bull.marginOfSafety)} MOS
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Growth +3% · Margin +2% · WACC −1%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5x5 Sensitivity Matrix */}
          {dcfOutput?.sensitivityGrid && dcfOutput.sensitivityGrid.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Sensitivity Analysis Matrix
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                WACC Hurdle (vertical) vs. Terminal Growth Rate (horizontal)
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>
                        WACC \ g
                      </th>
                      {dcfOutput.sensitivityGrid[0]?.map((col, idx) => (
                        <th key={idx} style={{ padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {(col.terminalGrowth * 100).toFixed(1)}%
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {dcfOutput.sensitivityGrid.map((row, rIdx) => {
                      const rowWacc = row[0]?.wacc ?? 0.1;
                      return (
                        <tr key={rIdx}>
                          <td style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {(rowWacc * 100).toFixed(2)}%
                          </td>
                          {row.map((cell, cIdx) => {
                            const isAbove = cell.intrinsicValue >= currentPrice;
                            const isCenter = rIdx === 2 && cIdx === 2;
                            return (
                              <td
                                key={cIdx}
                                style={{
                                  padding: '6px 8px',
                                  backgroundColor: isCenter ? 'var(--card)' : isAbove ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                  color: isAbove ? 'var(--positive)' : 'var(--negative)',
                                  border: isCenter ? '2px solid var(--accent, #1D1D1F)' : '1px solid var(--border)',
                                  fontWeight: isCenter ? 700 : 500
                                }}
                              >
                                {cell.isValid ? formatPrice({ amount: cell.intrinsicValue, currency }) : 'NM'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Green cells indicate intrinsic value exceeding the current share price ({formatPrice({ amount: currentPrice, currency })}). Center cell represents the active base case.
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {auditLogs.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--card-bg, #FFFFFF)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Parameter Audit Trail
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', maxHeight: '120px', overflowY: 'auto' }}>
                {auditLogs.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>{log.timestamp} · {log.field}: {log.oldVal} → {log.newVal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Model Modal */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSaveModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--card-bg, #FFFFFF)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
              Save Model Version
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {overview?.name} · {modelOutput.name}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                Investment Thesis & Valuation Notes
              </label>
              <textarea
                rows={4}
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Document your key investment thesis, hurdle assumptions, and rationale..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  color: 'var(--text)',
                  backgroundColor: 'var(--bg, #FFFFFF)',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="btn btn-secondary"
                style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModel}
                disabled={saveSuccess}
                className="btn btn-primary"
                style={{ height: '44px', minHeight: '44px', padding: '0 20px', fontSize: '13px' }}
              >
                {saveSuccess ? 'Saved' : 'Save Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
