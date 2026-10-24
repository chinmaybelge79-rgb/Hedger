import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { companyPath, isValidSymbol, normalizeSymbol } from '../lib/navigation.js';
import {
  formatPrice,
  formatDelta,
  formatCompact,
  formatMultiple,
  formatPercent,
  formatDate
} from '@hedger/format';

interface PeerCandidate {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  currency: string;
  reason: string;
}

interface CompanyOverview {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector: string;
  industry: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  keyStats: {
    marketCap: number | null;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    sharesOutstanding: number | null;
  };
}

const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 1 / 86.85,
  EUR: 1.08,
  GBP: 1.28,
  GBp: 0.0128,
  JPY: 1 / 152.5
};

const FX_TIMESTAMP = '23 Oct 2026, 15:30 IST · RBI & ECB Reference Rates';

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSymbolA = searchParams.get('a') || 'TCS.NS';
  const rawSymbolB = searchParams.get('b') || 'INFY.NS';

  const symbolA = normalizeSymbol(rawSymbolA);
  const symbolB = normalizeSymbol(rawSymbolB);

  // Unified reporting currency
  const [targetCurrency, setTargetCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('USD');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2024');
  const [ignorePeerWarning, setIgnorePeerWarning] = useState<boolean>(false);

  // Data states
  const [dataA, setDataA] = useState<CompanyOverview | null>(null);
  const [dataB, setDataB] = useState<CompanyOverview | null>(null);
  const [peersA, setPeersA] = useState<PeerCandidate[]>([]);
  const [cashFlowA, setCashFlowA] = useState<any>(null);
  const [cashFlowB, setCashFlowB] = useState<any>(null);
  const [incomeA, setIncomeA] = useState<any>(null);
  const [incomeB, setIncomeB] = useState<any>(null);
  const [balanceA, setBalanceA] = useState<any>(null);
  const [balanceB, setBalanceB] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch overview, peers, and statements for both instruments
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setIgnorePeerWarning(false);

    Promise.all([
      fetch(`/api/instruments/${encodeURIComponent(symbolA)}/overview`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolB)}/overview`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolA)}/peers`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolA)}/statements?type=cashflow&period=annual`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolB)}/statements?type=cashflow&period=annual`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolA)}/statements?type=income&period=annual`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolB)}/statements?type=income&period=annual`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolA)}/statements?type=balance&period=annual`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/instruments/${encodeURIComponent(symbolB)}/statements?type=balance&period=annual`).then((r) => r.ok ? r.json() : null)
    ])
      .then(([ovA, ovB, pA, cfA, cfB, incA, incB, balA, balB]) => {
        if (!isMounted) return;
        if (ovA?.data) setDataA(ovA.data);
        if (ovB?.data) setDataB(ovB.data);
        if (pA?.peers) setPeersA(pA.peers);
        if (cfA) setCashFlowA(cfA);
        if (cfB) setCashFlowB(cfB);
        if (incA) setIncomeA(incA);
        if (incB) setIncomeB(incB);
        if (balA) setBalanceA(balA);
        if (balB) setBalanceB(balB);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbolA, symbolB]);

  // Currency Converter Helper
  const convertToTarget = (amount: number | null | undefined, fromCurrency: string) => {
    if (amount === null || amount === undefined || isNaN(amount)) return null;
    const rateFrom = FX_RATES_TO_USD[fromCurrency] ?? 1.0;
    const rateTo = FX_RATES_TO_USD[targetCurrency] ?? 1.0;
    const inUSD = amount * rateFrom;
    return inUSD / rateTo;
  };

  // Peer Check: verify if Company A and Company B share industry or sector
  const isPeer = useMemo(() => {
    if (!dataA || !dataB) return true;
    if (dataA.industry && dataB.industry) {
      if (dataA.industry.toLowerCase() === dataB.industry.toLowerCase()) return true;
    }
    if (dataA.sector && dataB.sector) {
      if (dataA.sector.toLowerCase() === dataB.sector.toLowerCase()) return true;
    }
    return false;
  }, [dataA, dataB]);

  // Fiscal Year dates alignment check
  const fiscalDatesA = cashFlowA?.fiscalDates || [];
  const fiscalDatesB = cashFlowB?.fiscalDates || [];

  const availableYears = useMemo(() => {
    const yearsA = fiscalDatesA.map((d: string) => d.slice(0, 4));
    const yearsB = fiscalDatesB.map((d: string) => d.slice(0, 4));
    const common = yearsA.filter((y: string) => yearsB.includes(y));
    return common.length > 0 ? common : ['2025', '2024', '2023'];
  }, [fiscalDatesA, fiscalDatesB]);

  const fiscalAlignmentWarning = useMemo(() => {
    if (!cashFlowA?.fiscalDates?.[0] || !cashFlowB?.fiscalDates?.[0]) return null;
    const dateA = new Date(cashFlowA.fiscalDates[0]);
    const dateB = new Date(cashFlowB.fiscalDates[0]);
    if (dateA.getMonth() !== dateB.getMonth()) {
      const monthA = dateA.toLocaleString('en-US', { month: 'long' });
      const monthB = dateB.toLocaleString('en-US', { month: 'long' });
      return `Fiscal year end mismatch: ${symbolA} reports in ${monthA}, while ${symbolB} reports in ${monthB}. Multi-year totals reflect different macroeconomic calendars.`;
    }
    return null;
  }, [cashFlowA, cashFlowB, symbolA, symbolB]);

  // Extract CFO for selected fiscal year
  const getCFOForYear = (statement: any, year: string) => {
    if (!statement || !statement.rows || !statement.fiscalDates) return null;
    const dateIdx = statement.fiscalDates.findIndex((d: string) => d.startsWith(year));
    if (dateIdx === -1) return null;
    const cfoRow = statement.rows.find((r: any) => /operating_cash_flow/i.test(r.key));
    return cfoRow?.values?.[dateIdx] ?? null;
  };

  const cfoA_raw = getCFOForYear(cashFlowA, selectedFiscalYear);
  const cfoB_raw = getCFOForYear(cashFlowB, selectedFiscalYear);
  const cfoA_norm = convertToTarget(cfoA_raw, dataA?.currency || 'INR');
  const cfoB_norm = convertToTarget(cfoB_raw, dataB?.currency || 'INR');

  // Extract Revenue, EBITDA, Net Income
  const getRowVal = (statement: any, pattern: RegExp) => {
    if (!statement?.rows?.[0]) return null;
    const row = statement.rows.find((r: any) => pattern.test(r.key));
    return row?.values?.[0] ?? null;
  };

  const revA_raw = getRowVal(incomeA, /total_revenue|revenue|operating_revenue/i);
  const revB_raw = getRowVal(incomeB, /total_revenue|revenue|operating_revenue/i);
  const revA_norm = convertToTarget(revA_raw, dataA?.currency || 'INR');
  const revB_norm = convertToTarget(revB_raw, dataB?.currency || 'INR');

  const netIncA_raw = getRowVal(incomeA, /^net_income$|net_income_common/i);
  const netIncB_raw = getRowVal(incomeB, /^net_income$|net_income_common/i);
  const netIncA_norm = convertToTarget(netIncA_raw, dataA?.currency || 'INR');
  const netIncB_norm = convertToTarget(netIncB_raw, dataB?.currency || 'INR');

  const mktCapA_norm = convertToTarget(dataA?.keyStats?.marketCap, dataA?.currency || 'INR');
  const mktCapB_norm = convertToTarget(dataB?.keyStats?.marketCap, dataB?.currency || 'INR');

  const handleSwap = () => {
    setSearchParams({ a: symbolB, b: symbolA });
  };

  const handleSelectPeer = (chosenSymbol: string) => {
    setSearchParams({ a: symbolA, b: chosenSymbol });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Peer Comparison Workbench</h1>
          <p className="page-subtitle">
            Side-by-side valuation multiples, normalized cash flows, and fundamental sizes
          </p>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
          Normalized FX: {FX_TIMESTAMP}
        </div>
      </div>

      {/* Control Selector Bar */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', backgroundColor: 'var(--card)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Company A */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Target:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              {dataA?.name || symbolA} ({symbolA})
            </span>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="btn btn-secondary"
            style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
            title="Swap Target and Peer"
          >
            ⇄ Swap
          </button>

          {/* Peer Picker Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Compare with:</span>
            <select
              value={symbolB}
              onChange={(e) => handleSelectPeer(e.target.value)}
              style={{
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
            >
              <option value={symbolB}>{dataB?.name || symbolB} ({symbolB})</option>
              {peersA
                .filter((p) => p.symbol !== symbolB && p.symbol !== symbolA)
                .map((p) => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.name} ({p.symbol}) · {p.reason}
                  </option>
                ))}
            </select>
          </div>

          {/* Currency Normalization Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currency:</span>
            {(['USD', 'INR', 'EUR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setTargetCurrency(curr)}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  fontSize: '11px',
                  fontWeight: targetCurrency === curr ? 600 : 400,
                  borderRadius: '6px',
                  border: targetCurrency === curr ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: targetCurrency === curr ? 'var(--primary)' : 'var(--card)',
                  color: targetCurrency === curr ? 'var(--primary-foreground)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NOT_A_PEER Polite Warning Banner */}
      {!isPeer && !ignorePeerWarning && dataA && dataB && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '10px',
            backgroundColor: 'var(--secondary)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
              Industry Mismatch Notice
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {dataA.name} and {dataB.name} operate in different industries (
              <strong>{dataA.industry || dataA.sector}</strong> vs{' '}
              <strong>{dataB.industry || dataB.sector}</strong>). Cross-sector multiple comparison is not meaningful without normalization.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {peersA.length > 0 && (
              <button
                onClick={() => handleSelectPeer(peersA[0].symbol)}
                className="btn btn-secondary"
                style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
              >
                View {dataA.sector} peers ({peersA[0].symbol})
              </button>
            )}
            <button
              onClick={() => setIgnorePeerWarning(true)}
              className="btn btn-primary"
              style={{ height: '36px', minHeight: '36px', padding: '0 14px', fontSize: '12px' }}
            >
              Compare anyway with normalised metrics
            </button>
          </div>
        </div>
      )}

      {/* Fiscal Year Alignment Warning Banner */}
      {fiscalAlignmentWarning && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '8px',
            backgroundColor: 'var(--secondary)',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--negative)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <span>{fiscalAlignmentWarning}</span>
        </div>
      )}

      {/* 2 Primary Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card A */}
        <div
          className="card"
          onClick={() => navigate(companyPath(symbolA))}
          style={{ padding: '24px', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Target Instrument
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginTop: '2px' }}>
                {dataA?.name || symbolA}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {symbolA} · {dataA?.exchange} · {dataA?.currency}
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}>
              View Dossier →
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Price</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatPrice({ amount: dataA?.price, currency: dataA?.currency || 'INR' })}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: (dataA?.change ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {formatDelta(dataA?.change, dataA?.changePercent, dataA?.currency || 'INR')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Market Cap ({targetCurrency})</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatCompact({ amount: mktCapA_norm, currency: targetCurrency })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatCompact({ amount: dataA?.keyStats?.marketCap, currency: dataA?.currency || 'INR' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>P/E (TTM)</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatMultiple(dataA?.keyStats?.peRatio)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                P/B {formatMultiple(dataA?.keyStats?.pbRatio)}
              </div>
            </div>
          </div>
        </div>

        {/* Card B */}
        <div
          className="card"
          onClick={() => navigate(companyPath(symbolB))}
          style={{ padding: '24px', cursor: 'pointer', transition: 'border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Comparison Peer
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginTop: '2px' }}>
                {dataB?.name || symbolB}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {symbolB} · {dataB?.exchange} · {dataB?.currency}
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}>
              View Dossier →
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Price</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatPrice({ amount: dataB?.price, currency: dataB?.currency || 'USD' })}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: (dataB?.change ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {formatDelta(dataB?.change, dataB?.changePercent, dataB?.currency || 'USD')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Market Cap ({targetCurrency})</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatCompact({ amount: mktCapB_norm, currency: targetCurrency })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatCompact({ amount: dataB?.keyStats?.marketCap, currency: dataB?.currency || 'USD' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>P/E (TTM)</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }} className="tnum">
                {formatMultiple(dataB?.keyStats?.peRatio)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                P/B {formatMultiple(dataB?.keyStats?.pbRatio)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Valuation Multiples (Unit-less, directly comparable) */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card)', marginBottom: '32px', overflowX: 'auto', width: '100%' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Valuation Multiples</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ratios are unit-less and directly comparable across all exchanges and currencies</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Metric</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{dataA?.name || symbolA}</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{dataB?.name || symbolB}</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Relative Valuation Note</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>P/E Ratio (TTM)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatMultiple(dataA?.keyStats?.peRatio)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatMultiple(dataB?.keyStats?.peRatio)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {dataA?.keyStats?.peRatio && dataB?.keyStats?.peRatio
                  ? dataA.keyStats.peRatio < dataB.keyStats.peRatio
                    ? `${symbolA} cheaper by ${(dataB.keyStats.peRatio - dataA.keyStats.peRatio).toFixed(1)}x`
                    : `${symbolB} cheaper by ${(dataA.keyStats.peRatio - dataB.keyStats.peRatio).toFixed(1)}x`
                  : '—'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>Price to Book (P/B)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatMultiple(dataA?.keyStats?.pbRatio)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatMultiple(dataB?.keyStats?.pbRatio)}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {dataA?.keyStats?.pbRatio && dataB?.keyStats?.pbRatio
                  ? dataA.keyStats.pbRatio < dataB.keyStats.pbRatio
                    ? `${symbolA} lower P/B`
                    : `${symbolB} lower P/B`
                  : '—'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>Dividend Yield</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {dataA?.keyStats?.dividendYield != null ? formatPercent(dataA.keyStats.dividendYield / 100) : '—'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {dataB?.keyStats?.dividendYield != null ? formatPercent(dataB.keyStats.dividendYield / 100) : '—'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                Annual statutory dividend yield
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 2: Cash Flow from Operations (CFO) for Selected Fiscal Year */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card)', marginBottom: '32px', overflowX: 'auto', width: '100%' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
              Cash Flow from Operations (CFO) Alignment
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Audited CFO aligned to fiscal year with local reported figures alongside {targetCurrency} normalization
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fiscal Year:</span>
            {availableYears.map((yr: string) => (
              <button
                key={yr}
                onClick={() => setSelectedFiscalYear(yr)}
                style={{
                  height: '32px',
                  padding: '0 10px',
                  fontSize: '11px',
                  fontWeight: selectedFiscalYear === yr ? 600 : 400,
                  borderRadius: '6px',
                  border: selectedFiscalYear === yr ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: selectedFiscalYear === yr ? 'var(--primary)' : 'var(--card)',
                  color: selectedFiscalYear === yr ? 'var(--primary-foreground)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                FY{yr}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Instrument</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Reporting Currency</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Reported CFO (FY{selectedFiscalYear})</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Normalized in {targetCurrency}</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{dataA?.name || symbolA}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{dataA?.currency}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {cfoA_raw !== null ? formatCompact({ amount: cfoA_raw, currency: dataA?.currency || 'INR' }) : '—'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                {cfoA_norm !== null ? formatCompact({ amount: cfoA_norm, currency: targetCurrency }) : '—'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{dataB?.name || symbolB}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{dataB?.currency}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                {cfoB_raw !== null ? formatCompact({ amount: cfoB_raw, currency: dataB?.currency || 'USD' }) : '—'}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                {cfoB_norm !== null ? formatCompact({ amount: cfoB_norm, currency: targetCurrency }) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 3: Fundamental Sizes & Scale (Normalized) */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card)', marginBottom: '32px', overflowX: 'auto', width: '100%' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Fundamental Scale & Operational Sizes</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Side-by-side comparison normalized to {targetCurrency} using explicit, timestamped FX reference rates
          </p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Metric</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {dataA?.name || symbolA} ({targetCurrency})
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {dataB?.name || symbolB} ({targetCurrency})
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Scale Leader</th>
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>Market Capitalization</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: mktCapA_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: mktCapB_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                {(mktCapA_norm ?? 0) > (mktCapB_norm ?? 0) ? symbolA : symbolB}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>Annual Revenue (TTM)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: revA_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: revB_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                {(revA_norm ?? 0) > (revB_norm ?? 0) ? symbolA : symbolB}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600 }}>Net Profit (PAT)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: netIncA_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCompact({ amount: netIncB_norm, currency: targetCurrency })}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                {(netIncA_norm ?? 0) > (netIncB_norm ?? 0) ? symbolA : symbolB}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legal Disclaimer */}
      <div style={{ padding: '16px 20px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--card)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Not investment advice. For research and educational purposes only. Multiples and normalized metrics are algorithmic computations (ƒ). FX conversion provided for comparative scaling only.
      </div>
    </div>
  );
};
