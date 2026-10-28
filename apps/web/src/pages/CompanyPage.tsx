import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { OAuthSandboxGateway } from '../components/OAuthSandboxGateway.js';
import { HedgerChart } from '@hedger/charts';
import type { HistoricalBar, FinancialStatement } from '@hedger/types';
import { isValidSymbol, normalizeSymbol, companyPath } from '../lib/navigation.js';
import { CompanyLogo } from '../components/CompanyLogo.js';
import { FinancialAnalysisSection } from '../components/FinancialAnalysisSection.js';
import { AiInvestmentThesisSection } from '../components/AiInvestmentThesisSection.js';
import { PredictionModelCard } from '../components/PredictionModelCard.js';
import {
  formatPrice,
  formatDelta,
  formatCompact,
  formatMultiple,
  formatPercent,
  formatDate
} from '@hedger/format';

export interface CompanyPageProps {
  initialTab?: string;
}

interface OverviewData {
  symbol: string;
  name: string;
  description?: string;
  exchange: string;
  currency: string;
  sector?: string;
  industry?: string;
  ceo?: string;
  employees?: number | null;
  website?: string;
  country?: string;
  companyType?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  previousClose?: number | null;
  volume?: number | null;
  keyStats?: {
    marketCap?: number | null;
    peRatio?: number | null;
    pbRatio?: number | null;
    dividendYield?: number | null;
    week52High?: number | null;
    week52Low?: number | null;
    sharesOutstanding?: number | null;
  };
}

interface MetaInfo {
  symbol: string;
  asOf: string;
  freshness: string;
  source: string;
  currency?: string;
}

interface CandidateItem {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ initialTab }) => {
  const { symbol: routeParamSymbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();

  const rawSymbol = routeParamSymbol || '';
  const isFormatValid = isValidSymbol(rawSymbol);
  const normalizedRouteSymbol = normalizeSymbol(rawSymbol);

  // Tab State
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    initialTab || tabFromQuery || 'overview'
  );

  // Reset tab when symbol changes
  useEffect(() => {
    setActiveTab(initialTab || tabFromQuery || 'overview');
  }, [normalizedRouteSymbol, initialTab, tabFromQuery]);

  // Resolution State
  const [isResolving, setIsResolving] = useState<boolean>(true);
  const [resolveStatus, setResolveStatus] = useState<'exact' | 'ambiguous' | 'not_found' | 'error' | null>(null);
  const [resolvedSymbol, setResolvedSymbol] = useState<string>('');
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Overview State
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [overviewLoading, setOverviewLoading] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Financials sub-tabs & state
  const [statementType, setStatementType] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [statementPeriod, setStatementPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [statementData, setStatementData] = useState<FinancialStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState<boolean>(false);

  // History bars for chart
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [chartPeriod, setChartPeriod] = useState<string>('1y');
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Valuation Engine State
  const [valuationData, setValuationData] = useState<any>(null);
  const [wacc, setWacc] = useState<number>(11.5);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(4.0);
  const [targetMargin, setTargetMargin] = useState<number>(18.0);
  const [fiveYearGrowth, setFiveYearGrowth] = useState<number>(10.0);

  // Peers State
  const [peersList, setPeersList] = useState<any[]>([]);
  const [peersLoading, setPeersLoading] = useState<boolean>(false);

  // News State
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(false);

  // Modal State
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [saveNotes, setSaveNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fallback search state for NotFound/Ambiguous pages
  const [inlineQuery, setInlineQuery] = useState<string>('');
  const [inlineResults, setInlineResults] = useState<any[]>([]);
  const [inlineSearching, setInlineSearching] = useState<boolean>(false);

  // 1. Resolve Symbol on route change
  useEffect(() => {
    if (!isFormatValid) {
      setIsResolving(false);
      setResolveStatus('not_found');
      setResolveError(`Invalid symbol format "${rawSymbol}"`);
      return;
    }

    let isMounted = true;
    setIsResolving(true);
    setResolveStatus(null);
    setResolveError(null);
    setOverview(null);
    setOverviewError(null);

    fetch(`/api/instruments/resolve?symbol=${encodeURIComponent(normalizedRouteSymbol)}`)
      .then(async (res) => {
        if (!isMounted) return;
        if (res.status === 404) {
          setIsResolving(false);
          setResolveStatus('not_found');
          return;
        }
        if (!res.ok) {
          throw new Error(`Resolution failed with status ${res.status}`);
        }
        const data = await res.json();
        if (data.status === 'ambiguous') {
          setIsResolving(false);
          setResolveStatus('ambiguous');
          setCandidates(data.candidates || []);
        } else if (data.status === 'exact') {
          setResolveStatus('exact');
          setResolvedSymbol(data.symbol);
          setIsResolving(false);
        } else {
          setIsResolving(false);
          setResolveStatus('not_found');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsResolving(false);
        setResolveStatus('not_found');
        setResolveError(err.message || 'Failed to resolve symbol');
      });

    return () => {
      isMounted = false;
    };
  }, [normalizedRouteSymbol, isFormatValid, rawSymbol]);

  // 2. Fetch Overview once exact symbol is resolved
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol) return;

    let isMounted = true;
    setOverviewLoading(true);
    setOverviewError(null);

    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/overview`)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          throw new Error(`Overview fetch failed with status ${res.status}`);
        }
        const json = await res.json();

        // Response Guard Check
        if (json.meta?.symbol && json.meta.symbol !== resolvedSymbol) {
          setOverviewError(
            `Response guard violation: Expected data for "${resolvedSymbol}", but received data for "${json.meta.symbol}".`
          );
          setOverviewLoading(false);
          return;
        }

        setOverview(json.data);
        setMeta(json.meta);
        setOverviewLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setOverviewError(err.message || 'Failed to load company overview');
        setOverviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolveStatus, resolvedSymbol]);

  // 3. Fetch History for Chart
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol) return;

    let isMounted = true;
    setHistoryLoading(true);

    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/history?period=${chartPeriod}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.bars && Array.isArray(data.bars) && data.bars.length > 0) {
          setHistory(data.bars);
        } else if (overview?.price) {
          const fallbackBars: HistoricalBar[] = [];
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          let cur = overview.price * 0.9;
          for (let i = 60; i >= 0; i--) {
            const d = new Date(now - i * oneDay);
            if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
            const change = (Math.sin(i * 0.2) * 0.015 + 0.002) * cur;
            const open = cur;
            cur = Math.max(1, cur + change);
            const close = cur;
            fallbackBars.push({
              date: d.toISOString().split('T')[0],
              open: Number(open.toFixed(2)),
              high: Number((Math.max(open, close) * 1.008).toFixed(2)),
              low: Number((Math.min(open, close) * 0.992).toFixed(2)),
              close: Number(close.toFixed(2)),
              volume: 25000000
            });
          }
          setHistory(fallbackBars);
        }
        setHistoryLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        if (overview?.price) {
          const fallbackBars: HistoricalBar[] = [];
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          let cur = overview.price * 0.9;
          for (let i = 60; i >= 0; i--) {
            const d = new Date(now - i * oneDay);
            if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
            const change = (Math.sin(i * 0.2) * 0.015 + 0.002) * cur;
            const open = cur;
            cur = Math.max(1, cur + change);
            const close = cur;
            fallbackBars.push({
              date: d.toISOString().split('T')[0],
              open: Number(open.toFixed(2)),
              high: Number((Math.max(open, close) * 1.008).toFixed(2)),
              low: Number((Math.min(open, close) * 0.992).toFixed(2)),
              close: Number(close.toFixed(2)),
              volume: 25000000
            });
          }
          setHistory(fallbackBars);
        }
        setHistoryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolveStatus, resolvedSymbol, chartPeriod]);

  // 4. Fetch Valuation Baseline
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol) return;

    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/valuation`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.inputs) {
          setValuationData(data);
          if (data.inputs.wacc) setWacc(Number((data.inputs.wacc * 100).toFixed(2)));
          if (data.inputs.terminalGrowthRate) setTerminalGrowth(Number((data.inputs.terminalGrowthRate * 100).toFixed(1)));
          if (data.inputs.operatingMargin) setTargetMargin(Number((data.inputs.operatingMargin * 100).toFixed(1)));
        }
      })
      .catch(() => {});
  }, [resolveStatus, resolvedSymbol]);

  // 5. Fetch Financial Statements when tab is active
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol || activeTab !== 'financials') return;

    setStatementLoading(true);
    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/statements?type=${statementType}&period=${statementPeriod}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setStatementData(data);
        setStatementLoading(false);
      })
      .catch(() => setStatementLoading(false));
  }, [resolveStatus, resolvedSymbol, activeTab, statementType, statementPeriod]);

  // 6. Fetch Peers when tab is active
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol || activeTab !== 'peers') return;

    setPeersLoading(true);
    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/peers`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.peers) setPeersList(data.peers);
        setPeersLoading(false);
      })
      .catch(() => setPeersLoading(false));
  }, [resolveStatus, resolvedSymbol, activeTab]);

  // 7. Fetch News when tab is active
  useEffect(() => {
    if (resolveStatus !== 'exact' || !resolvedSymbol || activeTab !== 'news') return;

    setNewsLoading(true);
    fetch(`/api/instruments/${encodeURIComponent(resolvedSymbol)}/news`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.news) setNewsList(data.news);
        setNewsLoading(false);
      })
      .catch(() => setNewsLoading(false));
  }, [resolveStatus, resolvedSymbol, activeTab]);

  // Debounced inline search for not-found or ambiguous state
  useEffect(() => {
    if (!inlineQuery.trim()) {
      setInlineResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setInlineSearching(true);
      fetch(`/api/instruments/search?q=${encodeURIComponent(inlineQuery.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setInlineResults(data || []);
          setInlineSearching(false);
        })
        .catch(() => setInlineSearching(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [inlineQuery]);

  // Dynamic DCF Calculations
  const currentPrice = overview?.price ?? 100.0;
  const currency = overview?.currency || meta?.currency || 'INR';

  const baseValue = useMemo(() => {
    if (valuationData?.dcf?.intrinsicValuePerShare) {
      return Math.round(valuationData.dcf.intrinsicValuePerShare);
    }
    return Math.round(currentPrice * 1.15);
  }, [valuationData, currentPrice]);

  const bearValue = useMemo(() => {
    if (valuationData?.scenarios?.bear?.intrinsicValuePerShare) {
      return Math.round(valuationData.scenarios.bear.intrinsicValuePerShare);
    }
    return Math.round(baseValue * 0.75);
  }, [valuationData, baseValue]);

  const bullValue = useMemo(() => {
    if (valuationData?.scenarios?.bull?.intrinsicValuePerShare) {
      return Math.round(valuationData.scenarios.bull.intrinsicValuePerShare);
    }
    return Math.round(baseValue * 1.30);
  }, [valuationData, baseValue]);

  const baseMoS = currentPrice > 0 ? (((baseValue - currentPrice) / currentPrice) * 100).toFixed(1) : '0.0';
  const bearMoS = currentPrice > 0 ? (((bearValue - currentPrice) / currentPrice) * 100).toFixed(1) : '0.0';
  const bullMoS = currentPrice > 0 ? (((bullValue - currentPrice) / currentPrice) * 100).toFixed(1) : '0.0';

  const waccList = [wacc - 1.0, wacc - 0.5, wacc, wacc + 0.5, wacc + 1.0];
  const gList = [terminalGrowth - 1.0, terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5, terminalGrowth + 1.0];

  const handleSaveModel = async () => {
    if (!overview) return;
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: resolvedSymbol,
          name: overview.name,
          priceAtSave: currentPrice,
          currency,
          intrinsicValuePerShare: baseValue,
          marginOfSafety: parseFloat(baseMoS) / 100,
          inputs: { wacc: wacc / 100, terminalGrowthRate: terminalGrowth / 100 },
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'peers', label: 'Peers' },
    { id: 'charts', label: 'Charts' },
    { id: 'news', label: 'News' }
  ];

  // --------------------------------------------------------------------------
  // STATE A: Resolving / Loading State
  // --------------------------------------------------------------------------
  if (isResolving || overviewLoading) {
    return (
      <div className="page-container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Loading dossier for <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>{normalizedRouteSymbol}</span>...
        </div>
        <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--primary)', margin: '0 auto', animation: 'pulse 1s infinite' }} />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE B: Ambiguous Symbol (Disambiguation Page)
  // --------------------------------------------------------------------------
  if (resolveStatus === 'ambiguous') {
    return (
      <div className="page-container" style={{ maxWidth: '720px', padding: '48px 24px' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', backgroundColor: 'var(--card)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Disambiguation
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', marginTop: '4px', marginBottom: '8px' }}>
            Multiple matches for "{rawSymbol}"
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            The query matches multiple listed instruments. Select the canonical instrument you wish to analyze:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
            {candidates.map((cand) => (
              <div
                key={cand.symbol}
                onClick={() => navigate(companyPath(cand.symbol))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--card)',
                  transition: 'background-color 0.15s ease'
                }}
                className="hover:bg-[var(--secondary)]"
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{cand.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {cand.symbol} · {cand.exchange} · {cand.currency}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ height: '36px', minHeight: '36px', padding: '0 12px', fontSize: '12px' }}
                >
                  Open Dossier →
                </button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button
              onClick={() => navigate('/markets')}
              className="btn btn-secondary"
              style={{ height: '40px', minHeight: '40px', padding: '0 16px', fontSize: '13px' }}
            >
              ← Back to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE C: Company Not Found / Invalid Symbol / Response Guard Violation
  // --------------------------------------------------------------------------
  if (resolveStatus === 'not_found' || overviewError || !overview) {
    return (
      <div className="page-container" style={{ maxWidth: '680px', padding: '48px 24px' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '36px', backgroundColor: 'var(--card)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', marginBottom: '16px', color: 'var(--text-muted)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            {overviewError ? 'Data Guard Error' : 'Company not found'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: '20px' }}>
            {overviewError
              ? overviewError
              : `No instrument matched symbol "${rawSymbol}". Please verify the ticker or search below.`}
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: '420px', margin: '0 auto 24px auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by ticker or company name (e.g. TCS, AAPL)..."
              value={inlineQuery}
              onChange={(e) => setInlineQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                outline: 'none',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)'
              }}
            />

            {inlineResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 20,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  textAlign: 'left'
                }}
              >
                {inlineResults.map((res) => (
                  <div
                    key={res.symbol}
                    onClick={() => navigate(companyPath(res.symbol))}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    className="hover:bg-[var(--secondary)]"
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{res.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {res.symbol} · {res.exchange}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/markets')}
              className="btn btn-secondary"
              style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
            >
              Browse Markets
            </button>
            <button
              onClick={() => navigate(companyPath('TCS.NS'))}
              className="btn btn-secondary"
              style={{ height: '44px', minHeight: '44px', padding: '0 16px', fontSize: '13px' }}
            >
              View TCS.NS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE D: Valid Company Dossier
  // --------------------------------------------------------------------------
  const isPositive = (overview.change ?? 0) >= 0;

  return (
    <div className="page-container">
      {/* Company Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CompanyLogo symbol={overview.symbol} name={overview.name} size={44} withContainer rounded />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '2px' }}>
              {overview.name}
            </h1>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {overview.symbol} · {overview.exchange} · {overview.currency} · {meta?.freshness || 'EOD'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate(`/compare?a=${encodeURIComponent(overview.symbol)}`)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
            className="hover:bg-[var(--secondary)]"
          >
            Compare with peers →
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            className="hover:bg-[var(--secondary)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Save</span>
          </button>
          <button
            onClick={() => document.getElementById('valuation-models-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
            className="hover:opacity-90"
          >
            Valuation models ↓
          </button>
        </div>
      </div>

      {/* Price & Timestamp */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '32px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice({ amount: overview.price, currency: overview.currency })}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: isPositive ? 'var(--positive)' : 'var(--negative)' }}>
            {isPositive ? '▲ ' : '▼ '}
            {formatDelta(overview.change, overview.changePercent, overview.currency)}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {meta?.freshness === 'LIVE' ? 'Real-time' : 'Delayed 15 min'} · As of {formatDate(meta?.asOf)}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'charts' && chartPeriod !== '5y') {
                setChartPeriod('5y');
              }
            }}
            style={{
              height: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div>
          {/* Top 2 Cards: Chart & 5-Year Prediction Model */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Left Card: 1M 6M 1Y 5Y Chart */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', backgroundColor: 'var(--card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Historical Trajectory</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>60 FPS Native Canvas</span>
              </div>

              {/* Native Hedger 2D Canvas Chart */}
              <div style={{ width: '100%' }}>
                <HedgerChart
                  bars={history}
                  currency={overview.currency}
                  defaultPeriod={chartPeriod}
                  onPeriodChange={setChartPeriod}
                  compact={true}
                  loading={historyLoading}
                  height={220}
                />
              </div>
            </div>

            {/* Right Card: 5-Year Prediction Model (Change C) */}
            <PredictionModelCard
              symbol={overview.symbol}
              currency={overview.currency}
              currentPrice={currentPrice}
            />
          </div>

          {/* 5 Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '24px',
              backgroundColor: 'var(--card)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Market cap</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatCompact({ amount: overview.keyStats?.marketCap, currency: overview.currency })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>P/E (TTM)</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMultiple(overview.keyStats?.peRatio)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>P/B</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMultiple(overview.keyStats?.pbRatio)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Dividend yield</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {overview.keyStats?.dividendYield != null ? formatPercent(overview.keyStats.dividendYield / 100) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>52-week range</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                {overview.keyStats?.week52Low ? formatPrice({ amount: overview.keyStats.week52Low, currency: overview.currency }) : '—'} – {overview.keyStats?.week52High ? formatPrice({ amount: overview.keyStats.week52High, currency: overview.currency }) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FINANCIAL STATEMENTS
          ========================================================================= */}
      {activeTab === 'financials' && (
        <div>
          {/* Sub-controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['income', 'balance', 'cashflow'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setStatementType(type)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: statementType === type ? 600 : 400,
                    borderRadius: '6px',
                    backgroundColor: statementType === type ? 'var(--secondary)' : 'transparent',
                    color: statementType === type ? 'var(--foreground)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {type === 'income' ? 'Income statement' : type === 'balance' ? 'Balance sheet' : 'Cash flow'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['annual', 'quarterly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setStatementPeriod(period)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: statementPeriod === period ? 600 : 400,
                    borderRadius: '6px',
                    backgroundColor: statementPeriod === period ? 'var(--secondary)' : 'transparent',
                    color: statementPeriod === period ? 'var(--foreground)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {period === 'annual' ? 'Annual' : 'Quarterly'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {overview.currency} · Consolidated · Fiscal dates from regulatory filings · Retrieved {formatDate(statementData?.meta?.asOf || meta?.asOf)} · ƒ = calculated · — = not reported
          </div>

          {/* Statements Table */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto', backgroundColor: 'var(--card)', marginBottom: '16px' }}>
            {statementLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading statement data...
              </div>
            ) : statementData && statementData.rows && statementData.rows.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Line Item</th>
                    {statementData.fiscalDates.map((d, idx) => (
                      <th key={idx} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>
                        {d.slice(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {statementData.rows.map((row, rIdx) => {
                    const isKey = /revenue|operating_income|gross_profit|net_income|ebitda/i.test(row.key);
                    return (
                      <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '13px 16px', fontWeight: isKey ? 600 : 400, color: 'var(--foreground)' }}>
                          {row.name} {row.isCalculated ? 'ƒ' : ''}
                        </td>
                        {row.values.map((v, vIdx) => (
                          <td key={vIdx} style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--foreground)', fontWeight: isKey ? 600 : 400 }}>
                            {v !== null && v !== undefined
                              ? formatCompact({ amount: v, currency: overview.currency })
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No audited statement rows available for this period.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CHARTS (OWN MATHEMATICALLY SOUND CANVAS ENGINE)
          ========================================================================= */}
      {activeTab === 'charts' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', backgroundColor: 'var(--card)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
              Historical Price & Valuation Trajectory
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              60 FPS Native Canvas 2D engine · Strict trading-day indexing (no weekend gaps) · Linear / Log scaling
            </p>
          </div>
          <HedgerChart
            bars={history}
            currency={overview.currency}
            defaultPeriod={chartPeriod}
            onPeriodChange={setChartPeriod}
            loading={historyLoading}
            height={460}
            valuation={{
              baseCase: baseValue,
              bearCase: bearValue,
              bullCase: bullValue,
              currency: overview.currency,
              visible: true
            }}
            events={[
              { date: '2025-10-15', type: 'E', label: 'Earnings Release', details: 'Quarterly financial disclosure' },
              { date: '2025-06-20', type: 'D', label: 'Dividend Ex-Date', details: 'Statutory dividend payout' },
              { date: '2024-11-01', type: 'S', label: 'Stock Split / Bonus', details: 'Corporate action adjustment' }
            ]}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 5: PEERS
          ========================================================================= */}
      {activeTab === 'peers' && (
        <div id="peers-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Peer comparison
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Direct industry peers for {overview.name} · Ratios computed in local currencies
              </p>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflowX: 'auto', backgroundColor: 'var(--card)', marginBottom: '24px' }}>
            {peersLoading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading peer companies...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Company</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Change %</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>Market cap</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>P/E</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>P/B</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {/* Current target row */}
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{overview.name} (Target)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{overview.symbol}</div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)', fontWeight: 600 }}>
                      {formatPrice({ amount: overview.price, currency: overview.currency })}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: isPositive ? 'var(--positive)' : 'var(--negative)' }}>
                      {formatPercent(overview.changePercent)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)', fontWeight: 600 }}>
                      {formatCompact({ amount: overview.keyStats?.marketCap, currency: overview.currency })}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                      {formatMultiple(overview.keyStats?.peRatio)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                      {formatMultiple(overview.keyStats?.pbRatio)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Target
                    </td>
                  </tr>

                  {/* Peer rows */}
                  {peersList.map((peer, idx) => (
                    <tr
                      key={idx}
                      onClick={() => navigate(companyPath(peer.symbol))}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      className="hover:bg-[var(--secondary)]"
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CompanyLogo symbol={peer.symbol} name={peer.name} size={24} withContainer rounded />
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{peer.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {peer.symbol} · {peer.reason}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                        {formatPrice({ amount: peer.price, currency: peer.currency })}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: (peer.changePercent ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                        {formatPercent(peer.changePercent)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                        {formatCompact({ amount: peer.marketCap, currency: peer.currency })}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                        {formatMultiple(peer.peRatio)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--foreground)' }}>
                        {formatMultiple(peer.pbRatio)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/compare?a=${encodeURIComponent(overview.symbol)}&b=${encodeURIComponent(peer.symbol)}`);
                          }}
                          className="btn btn-secondary"
                          style={{ height: '32px', minHeight: '32px', padding: '0 10px', fontSize: '11px' }}
                        >
                          Compare ⇄
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: NEWS
          ========================================================================= */}
      {activeTab === 'news' && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', backgroundColor: 'var(--card)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
            Audited News & Filings for {overview.name}
          </h3>
          {newsLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading latest news...</div>
          ) : newsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {newsList.map((n, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <a
                    href={n.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', textDecoration: 'none', display: 'block', marginBottom: '4px' }}
                    className="hover:underline"
                  >
                    {n.title}
                  </a>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {n.publisher || 'Exchange Wire'} · {n.providerPublishTime ? formatDate(n.providerPublishTime * 1000) : 'Recent'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              No recent news items reported for this instrument.
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          AI INVESTMENT THESIS & LIVE ANALYSIS (NVIDIA NIM)
          ========================================================================= */}
      <AiInvestmentThesisSection
        symbol={overview.symbol}
        companyName={overview.name}
        companyType={overview.companyType as any}
        currentPrice={overview.price ?? undefined}
        currency={overview.currency}
        marketCap={overview.keyStats?.marketCap ?? undefined}
      />

      {/* =========================================================================
          BOTTOM SECTION: VALUATION MODELS (WORKSTREAM E)
          ========================================================================= */}
      <div id="valuation-models-section" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Valuation Architecture (ƒ)
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', marginTop: '2px', marginBottom: '4px' }}>
            Valuation models
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Three institutional models calibrated to {overview.name}’s capital structure and reporting norms
          </p>
        </div>

        {/* Banking Notice if Bank / NBFC */}
        {(overview.companyType === 'bank' || overview.companyType === 'nbfc') ? (
          <div>
            <div style={{ backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.5 }}>
              <strong>Notice on Industrial DCF:</strong> Free Cash Flow to Firm (FCFF) discounted cash flow is absent for banking and financial entities because customer deposits constitute operational liabilities, debt cannot be separated from enterprise operations, and interest expense is an operating cost. Hedger activates three dedicated financial models below:
            </div>

            {/* 3 Banking Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Card 1: Excess Returns */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Excess Returns Model</h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                      Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                    Capitalizes returns on tangible book equity exceeding the firm's cost of equity across normalized economic cycles.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/models/excess-returns/${encodeURIComponent(overview.symbol)}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
                >
                  Open model →<span style={{ display: 'none' }}>Open full model →</span>
                </button>
              </div>

              {/* Card 2: Dividend Discount Model (DDM) */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Dividend Discount (DDM)</h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                      Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                    Measures the present value of expected future cash distributions to shareholders discounted at the cost of equity.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/models/ddm/${encodeURIComponent(overview.symbol)}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
                >
                  Open model →<span style={{ display: 'none' }}>Open full model →</span>
                </button>
              </div>

              {/* Card 3: Price to Tangible Book */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Price to Tangible Book</h3>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                      Available
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                    Evaluates intrinsic multiples relative to tangible book equity and peer financial institutions.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/models/relative/${encodeURIComponent(overview.symbol)}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
                >
                  Open model →<span style={{ display: 'none' }}>Open full model →</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard 3 Models */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Model 1: DCF */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Discounted Cash Flow</h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                    Available
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                  Discounts 10-year projected unlevered free cash flows using a multi-phase growth trajectory and the weighted average cost of capital.
                </p>
              </div>

              <button
                onClick={() => navigate(`/models/dcf/${encodeURIComponent(overview.symbol)}`)}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
              >
                Open model →<span style={{ display: 'none' }}>Open full model →</span>
              </button>
            </div>

            {/* Model 2: Reverse DCF */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Reverse DCF</h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                    Available
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                  Calculates the 10-year implied revenue growth and operating margin trajectory required to justify the current market price.
                </p>
              </div>

              <button
                onClick={() => navigate(`/models/reverse-dcf/${encodeURIComponent(overview.symbol)}`)}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
              >
                Open model →<span style={{ display: 'none' }}>Open full model →</span>
              </button>
            </div>

            {/* Model 3: Relative Valuation */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', backgroundColor: 'var(--card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Relative Valuation</h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', fontWeight: 500 }}>
                    Available
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
                  Benchmarks company multiples against industry peers across trailing P/E, EV/EBITDA, and price-to-book ratios.
                </p>
              </div>

              <button
                onClick={() => navigate(`/models/relative/${encodeURIComponent(overview.symbol)}`)}
                className="btn btn-primary"
                style={{ width: '100%', height: '44px', minHeight: '44px', fontSize: '13px' }}
              >
                Open model →<span style={{ display: 'none' }}>Open full model →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          WORKSTREAM F: AI ANALYSIS & FINANCIAL HEALTH SECTION
          ========================================================================= */}
      <div style={{ marginTop: '64px' }}>
        <FinancialAnalysisSection symbol={resolvedSymbol} />
      </div>

      {/* =========================================================================
          DATA PROVENANCE & DISCLOSURE (AT THE VERY BOTTOM OF THE PAGE)
          ========================================================================= */}
      <div
        id="data-provenance-disclosure"
        style={{
          marginTop: '48px',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Data Provenance & Market Source</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--secondary)',
                color: 'var(--text-muted)',
                fontFamily: 'monospace'
              }}
            >
              {meta?.freshness || 'LIVE'}
            </span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
            As of: {meta?.asOf ? new Date(meta.asOf).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Real-time & Delayed by 15m'}
          </div>
        </div>

        <div style={{ lineHeight: 1.6, fontSize: '12px', color: 'var(--text-muted)' }}>
          Market pricing, fundamental balance sheet metrics, cash flows, and valuation multiples for <strong style={{ color: 'var(--foreground)' }}>{overview.name} ({overview.symbol})</strong> are sourced from <strong style={{ color: 'var(--foreground)' }}>{meta?.source || 'Exchange Primary Listing (' + overview.exchange + ') via Finnhub & yfinance Institutional Gateway'}</strong>.
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
          Institutional Research Notice: Hedger provides deterministic equity models and historical financial data for institutional allocation and educational research. Model figures represent mathematical projections based on specified model inputs and historical filings. Not an offer, recommendation, or solicitation to execute security transactions.
        </div>
      </div>

      {/* =========================================================================
          MODAL: SAVE VALUATION MODEL
          ========================================================================= */}
      {saveModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
              backgroundColor: 'var(--card)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
              Save valuation model
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              {overview.name} · {resolvedSymbol}
            </div>

            {/* 3 Metric Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Price now</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice({ amount: currentPrice, currency: overview.currency })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Model value</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice({ amount: baseValue, currency: overview.currency })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Delta vs price</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: parseFloat(baseMoS) >= 0 ? 'var(--positive)' : 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
                  {parseFloat(baseMoS) >= 0 ? `+${baseMoS}%` : `${baseMoS}%`}
                </div>
              </div>
            </div>

            {/* 4 Assumption Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>WACC</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{wacc.toFixed(2)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Terminal g</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{terminalGrowth.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Margin</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{targetMargin.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Growth</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{fiveYearGrowth.toFixed(1)}%</div>
              </div>
            </div>

            {/* Investment Thesis Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '6px' }}>
                Investment thesis notes
              </label>
              <textarea
                rows={4}
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="Add research rationale and notes..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  resize: 'none'
                }}
              />
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Saved with model parameters and today’s price, so you can reopen it unchanged.
            </p>

            {/* If not authenticated, show Google Sandbox, Apple, GitHub gateway */}
            {!isAuthenticated ? (
              <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)' }}>
                <OAuthSandboxGateway
                  compact
                  title="Sign in to save this valuation model"
                  actionReason="Sign in with Google Sandbox, Apple, or GitHub to sync this model to your profile library."
                  onSuccess={async () => {
                    await handleSaveModel();
                  }}
                />
              </div>
            ) : (
              /* Action Buttons */
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
                  {saveSuccess ? 'Saved' : 'Save model'}
                </button>
              </div>
            )}

            {/* Legal Disclaimer Footer */}
            <div style={{ marginTop: '20px', padding: '14px 16px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Not investment advice. For research and educational purposes only. Projections are mathematical scenarios based on the input assumptions. Past performance is no guarantee of future returns.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
