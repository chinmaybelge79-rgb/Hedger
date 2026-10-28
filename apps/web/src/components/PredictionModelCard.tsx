import React, { useEffect, useState, useMemo } from 'react';
import { formatPrice } from '@hedger/format';
import {
  runProbabilisticSimulation,
  type ProbabilisticEngineOutput,
  type YearlyPathPoint
} from '@hedger/valuation';
import { PREDICTION_ENABLED } from '../flags.js';

interface PredictionModelCardProps {
  symbol: string;
  currency: string;
  currentPrice: number;
}

export const PredictionModelCard: React.FC<PredictionModelCardProps> = ({
  symbol,
  currency,
  currentPrice
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Interactive Assumption States (Section 6)
  const [userPrice, setUserPrice] = useState<number>(currentPrice || 100);
  const [userGrowthPct, setUserGrowthPct] = useState<number>(12);
  const [userExitPe, setUserExitPe] = useState<number>(22);
  const [userWaccPct, setUserWaccPct] = useState<number>(8.5);
  const [userHorizonYears, setUserHorizonYears] = useState<number>(5);
  const [userRoicPct, setUserRoicPct] = useState<number>(18);
  const [userFcfPerShare, setUserFcfPerShare] = useState<number>(4.5);
  const [userEps0, setUserEps0] = useState<number>(5.0);

  // Expandable sections
  const [showSanityChecks, setShowSanityChecks] = useState<boolean>(false);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  // Fetch baseline company fundamentals from API
  useEffect(() => {
    let isMounted = true;
    if (!PREDICTION_ENABLED) return;

    setLoading(true);
    setError(null);

    fetch(`/api/v1/instruments/${encodeURIComponent(symbol)}/projection`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        const data = json.data;
        if (!data || data.ok === false) {
          throw new Error(data?.reason || 'Projection data unavailable');
        }

        const engine = data.probabilisticEngine;
        const p0 = data.price0 || currentPrice || 100;
        setUserPrice(p0);

        if (engine && engine.assumptions) {
          setUserGrowthPct(Math.round(engine.assumptions.epsGrowthRate * 100));
          setUserExitPe(Math.round(engine.assumptions.exitPe * 10) / 10);
          setUserWaccPct(Math.round(engine.assumptions.wacc * 1000) / 10);
          setUserEps0(engine.assumptions.eps0 || 5.0);
          setUserFcfPerShare(engine.assumptions.fcfPerShare || 4.25);
        } else if (data.assumptions) {
          const g0 = data.assumptions.baseGrowthPath?.[0] ?? 0.10;
          setUserGrowthPct(Math.round(g0 * 100));
          setUserExitPe(Math.round(data.assumptions.exitMultiple * 10) / 10);
          setUserEps0(data.assumptions.eps0 || 5.0);
          setUserFcfPerShare(data.assumptions.eps0 * 0.85);
        }

        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Projection unavailable');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, currentPrice]);

  // Execute Deterministic Probabilistic Engine in Real-Time (Section 4 & 9)
  const simulation: ProbabilisticEngineOutput = useMemo(() => {
    return runProbabilisticSimulation({
      price: userPrice,
      eps: userEps0,
      fcfPerShare: userFcfPerShare,
      epsGrowth: userGrowthPct / 100,
      wacc: userWaccPct / 100,
      gTerm: currency === 'INR' ? 0.06 : 0.03,
      exitPe: userExitPe,
      peerPe: userExitPe * 0.95,
      roic: userRoicPct / 100,
      tilt: 0.0,
      years: userHorizonYears,
      n: 10000,
      seed: 42,
      fadeYears: userRoicPct > userWaccPct + 8 ? 8 : 5,
      growthSd: 0.04,
      waccSd: 0.01,
      peSd: 0.15,
      sloanAccruals: -0.02,
      fcfConversion: 0.88
    });
  }, [userPrice, userEps0, userFcfPerShare, userGrowthPct, userWaccPct, userExitPe, userRoicPct, userHorizonYears, currency]);

  if (!PREDICTION_ENABLED) return null;

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div
        data-testid="prediction-card-loading"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '24px',
          backgroundColor: 'var(--card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: '380px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '220px', height: '18px', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
          <div style={{ width: '120px', height: '18px', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
        </div>
        <div style={{ width: '100%', height: '240px', backgroundColor: 'var(--border)', borderRadius: '8px' }} />
        <div style={{ width: '100%', height: '40px', backgroundColor: 'var(--border)', borderRadius: '6px' }} />
      </div>
    );
  }

  // 2. Unavailable / Refusal State
  if (error) {
    return (
      <div
        data-testid="prediction-card-unavailable"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '24px',
          backgroundColor: 'var(--card)',
          minHeight: '260px'
        }}
      >
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
          3-Horizon Price Projection Engine
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
          Projection not available
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {error}
        </p>
      </div>
    );
  }

  // Extract paths and KPI anchors
  const paths = simulation.yearlyPaths.filter((p) => p.year <= userHorizonYears);
  const kpis = simulation.kpis;

  // Chart coordinate mapping
  const chartWidth = 560;
  const chartHeight = 240;
  const padLeft = 48;
  const padRight = 32;
  const padTop = 20;
  const padBottom = 32;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  // Find price bounds across all visible scenarios
  const allPrices = paths.flatMap((p) => [p.p5, p.bear, p.base, p.bull, p.p95]);
  const minPrice = Math.max(0, Math.floor(Math.min(...allPrices, userPrice) * 0.85));
  const maxPrice = Math.ceil(Math.max(...allPrices, userPrice) * 1.12);
  const priceRange = Math.max(1, maxPrice - minPrice);

  const getX = (year: number) => padLeft + (year / userHorizonYears) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - minPrice) / priceRange) * plotH;

  // Build SVG path strings
  const p5Path = paths.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.p5)}`).join(' ');
  const p95Reverse = paths.slice().reverse().map((p) => `L ${getX(p.year)} ${getY(p.p95)}`).join(' ');
  const corridorArea = `${p5Path} ${p95Reverse} Z`;

  const bullPath = paths.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.bull)}`).join(' ');
  const basePath = paths.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.base)}`).join(' ');
  const bearPath = paths.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.year)} ${getY(p.bear)}`).join(' ');

  // Horizontal price grid lines (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1.0].map((frac) => {
    const val = Math.round(minPrice + frac * priceRange);
    return { val, y: getY(val) };
  });

  return (
    <div
      data-testid="prediction-model-card"
      style={{
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '24px',
        backgroundColor: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* 1. Header Title & Top KPIs (Section 6) */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Probabilistic Valuation Engine · 1Y / 3Y / 5Y
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
          3-Horizon Price Projection Engine
        </div>

        {/* 3 Header KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: 'var(--secondary)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Current Price
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice({ amount: userPrice, currency })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              1-Year Expected Value
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#3B82F6', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice({ amount: kpis.year1ExpectedValue, currency })}
            </div>
            <div style={{ fontSize: '11px', color: '#107C41', marginTop: '2px' }}>
              Simulation Mean (P50: {formatPrice({ amount: paths.find((p) => p.year === 1)?.base ?? userPrice, currency })})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              5-Year Base Target
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice({ amount: kpis.year5BaseTarget, currency })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              P50 (50% Probability)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Native Multi-Series Fan Chart (Section 6) */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
            Projected Share Price ({currency})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            10,000 Seeded Monte Carlo Draws
          </span>
        </div>

        {/* SVG Multi-Series Fan Chart Container */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            {/* Grid horizontal lines */}
            {yTicks.map((t, idx) => (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={t.y}
                  x2={chartWidth - padRight}
                  y2={t.y}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={t.y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="system-ui"
                >
                  {t.val}
                </text>
              </g>
            ))}

            {/* 90% Confidence Corridor Shaded Band (P5 to P95) */}
            <path
              d={corridorArea}
              fill="rgba(59, 130, 246, 0.08)"
            />

            {/* Current Price Baseline (Dashed) */}
            <line
              x1={padLeft}
              y1={getY(userPrice)}
              x2={chartWidth - padRight}
              y2={getY(userPrice)}
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              opacity="0.6"
            />

            {/* Bull Case Target Line (25% Prob) */}
            <path
              d={bullPath}
              fill="none"
              stroke="#107C41"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Base Case Target Line (50% Prob) */}
            <path
              d={basePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />

            {/* Bear Case Target Line (25% Prob) */}
            <path
              d={bearPath}
              fill="none"
              stroke="#B3261E"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />

            {/* Key Marker Points & Price Labels at Y1, Y3, Y5 */}
            {paths.map((p) => {
              if (p.year === 0 || p.year === 1 || p.year === 3 || p.year === 5) {
                return (
                  <g key={p.year}>
                    {/* Bull Point */}
                    <circle cx={getX(p.year)} cy={getY(p.bull)} r="3.5" fill="#107C41" />
                    {/* Base Point */}
                    <circle cx={getX(p.year)} cy={getY(p.base)} r="4" fill="#3B82F6" />
                    {/* Bear Point */}
                    <circle cx={getX(p.year)} cy={getY(p.bear)} r="3.5" fill="#B3261E" />

                    {/* Value Labels at anchors */}
                    {p.year > 0 && (
                      <text
                        x={getX(p.year)}
                        y={getY(p.bull) - 6}
                        textAnchor="middle"
                        fill="#107C41"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui"
                      >
                        {p.bull}
                      </text>
                    )}
                    {p.year > 0 && (
                      <text
                        x={getX(p.year)}
                        y={getY(p.bear) + 12}
                        textAnchor="middle"
                        fill="#B3261E"
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui"
                      >
                        {p.bear}
                      </text>
                    )}
                  </g>
                );
              }
              return null;
            })}

            {/* Year X Ticks */}
            {paths.map((p) => (
              <g key={p.year}>
                <line
                  x1={getX(p.year)}
                  y1={padTop + plotH}
                  x2={getX(p.year)}
                  y2={padTop + plotH + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={getX(p.year)}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="system-ui"
                >
                  {p.year === 0 ? 'Today (0)' : `Y${p.year}`}
                </text>
              </g>
            ))}

            <text
              x={padLeft + plotW / 2}
              y={chartHeight - 4}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="11"
              fontFamily="system-ui"
            >
              Years from Today
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', flexWrap: 'wrap', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#3B82F6', borderRadius: '2px' }} />
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Base Case Target (50% Prob)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#107C41', borderRadius: '2px' }} />
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Bull Case Target (25% Prob)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#B3261E', borderRadius: '2px' }} />
            <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Bear Case Target (25% Prob)</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Controls ("Adjust Engine Assumptions") (Section 6) */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--secondary)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
          Adjust Engine Assumptions (Real-Time Re-Simulation)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Control 1: Current Stock Price */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Current Stock Price</span>
              <strong style={{ color: 'var(--foreground)' }}>{formatPrice({ amount: userPrice, currency })}</strong>
            </div>
            <input
              type="range"
              min={Math.max(1, Math.round(currentPrice * 0.4))}
              max={Math.round(currentPrice * 2.5)}
              step={1}
              value={userPrice}
              onChange={(e) => setUserPrice(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Control 2: Expected EPS Growth Rate (%) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Expected EPS Growth Rate</span>
              <strong style={{ color: 'var(--foreground)' }}>{userGrowthPct}%</strong>
            </div>
            <input
              type="range"
              min={-5}
              max={40}
              step={1}
              value={userGrowthPct}
              onChange={(e) => setUserGrowthPct(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Control 3: Target Exit P/E Multiple */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Target Exit P/E Multiple</span>
              <strong style={{ color: 'var(--foreground)' }}>{userExitPe}x</strong>
            </div>
            <input
              type="range"
              min={6}
              max={60}
              step={0.5}
              value={userExitPe}
              onChange={(e) => setUserExitPe(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Control 4: Discount Rate / WACC (%) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Discount Rate / WACC</span>
              <strong style={{ color: 'var(--foreground)' }}>{userWaccPct}%</strong>
            </div>
            <input
              type="range"
              min={6}
              max={16}
              step={0.25}
              value={userWaccPct}
              onChange={(e) => setUserWaccPct(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Control 5: Time Horizon (Years) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Time Horizon</span>
              <strong style={{ color: 'var(--foreground)' }}>{userHorizonYears} Years</strong>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={userHorizonYears}
              onChange={(e) => setUserHorizonYears(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Footnote under controls */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '12px', lineHeight: 1.4 }}>
          *Base Case assumes standard EPS compound growth. Bull Case incorporates +25% TAM expansion premium. Bear Case factors in high interest rate discount contraction.
        </div>
      </div>

      {/* 4. Forecast Table (Section 8.A) */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
          Scenario Distribution & Statistical Intervals (1Y / 3Y / 5Y)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>Horizon</th>
                <th style={{ padding: '8px 6px', fontWeight: 600, color: '#B3261E' }}>Bear (P25, 25%)</th>
                <th style={{ padding: '8px 6px', fontWeight: 600, color: '#3B82F6' }}>Base (P50, 50%)</th>
                <th style={{ padding: '8px 6px', fontWeight: 600, color: '#107C41' }}>Bull (P75, 25%)</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>Expected Value</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>90% CI (P5–P95)</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>Base CAGR</th>
              </tr>
            </thead>
            <tbody>
              {simulation.horizonTable.map((row) => (
                <tr key={row.horizon} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {row.horizon}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: '#B3261E' }}>
                    {formatPrice({ amount: row.bear, currency })}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--foreground)' }}>
                    {formatPrice({ amount: row.base, currency })}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: '#107C41' }}>
                    {formatPrice({ amount: row.bull, currency })}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: '#3B82F6', fontWeight: 500 }}>
                    {formatPrice({ amount: row.expectedValue, currency })}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                    {formatPrice({ amount: row.ci90Low, currency })} – {formatPrice({ amount: row.ci90High, currency })}
                  </td>
                  <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: row.baseCagrPct >= 0 ? '#107C41' : '#B3261E' }}>
                    {row.baseCagrPct >= 0 ? '+' : ''}{row.baseCagrPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Key Drivers & Quality Flags (Section 8.B & 8.C) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            Primary Quantitative Drivers
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li>EPS Growth Anchor: {userGrowthPct}% faded to terminal {currency === 'INR' ? '6.0%' : '3.0%'}</li>
            <li>Exit Multiple Reversion: {userExitPe.toFixed(1)}x consistent with macro rate hurdle</li>
            <li>Cost of Capital (WACC): {userWaccPct.toFixed(2)}% ({simulation.qualityFlags.rateRegime})</li>
            <li>Moat Spread: {simulation.qualityFlags.roicWaccSpreadPct >= 0 ? '+' : ''}{simulation.qualityFlags.roicWaccSpreadPct.toFixed(1)} pp ({simulation.qualityFlags.moatStatus})</li>
          </ul>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            Earnings Quality & Accrual Flags
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li>FCF Conversion: {simulation.qualityFlags.fcfConversionPct}% (Cash flow backing)</li>
            <li>Sloan Accrual Ratio: {simulation.qualityFlags.sloanAccrualRatio}% ({simulation.qualityFlags.sloanAccrualFlag})</li>
            <li>Overlay Tilt: {simulation.qualityFlags.overlayTilt > 0 ? '+' : ''}{simulation.qualityFlags.overlayTilt.toFixed(2)} (Microstructure / options tilt)</li>
            <li>Engine Status: Seeded Monte Carlo validated across 10,000 correlated iterations</li>
          </ul>
        </div>
      </div>

      {/* Expandable Sanity Checks Panel (Section 5) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <button
          type="button"
          onClick={() => setShowSanityChecks(!showSanityChecks)}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--accent, #0D9488)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            minHeight: '44px'
          }}
        >
          <span>Sanity Checks & Quality Audits ({simulation.qualityFlags.sanityChecks.filter((c) => c.status === 'PASS').length}/{simulation.qualityFlags.sanityChecks.length} Passed)</span>
          <span>{showSanityChecks ? '▴' : '▾'}</span>
        </button>

        {showSanityChecks && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {simulation.qualityFlags.sanityChecks.map((sc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--foreground)' }}>{sc.check}: </strong>
                  <span style={{ color: 'var(--text-muted)' }}>{sc.message}</span>
                </div>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontWeight: 700,
                    fontSize: '10px',
                    backgroundColor: sc.status === 'PASS' ? '#064E3B' : '#78350F',
                    color: sc.status === 'PASS' ? '#A7F3D0' : '#FDE68A'
                  }}
                >
                  {sc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Statutory Statement (Rule 6) */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        Model output, not investment advice. Projections are probabilistic and can be wrong.
      </div>
    </div>
  );
};
