import React, { useEffect, useState } from 'react';
import { formatPrice } from '@hedger/format';
import { PREDICTION_ENABLED } from '../flags.js';

interface FactorReading {
  key: string;
  label: string;
  measures: string;
  source: string;
  asOf: string;
  reading: 'Positive' | 'Neutral' | 'Negative' | 'No data';
  score: number | null;
  effect: string;
  state: 'active' | 'no_data';
}

interface PredictionData {
  ok: boolean;
  reason?: string;
  horizonDate: string;
  currency: string;
  price0: number;
  p10: number;
  p50: number;
  p90: number;
  changePct: number;
  reliability: 'High' | 'Medium' | 'Low';
  factors: FactorReading[];
  assumptions: {
    eps0: number;
    eps5: number;
    gLong: number;
    baseGrowthPath: number[];
    structuralAdjustmentPp: number;
    sentimentAdjustmentPp: number;
    peAnchor: number;
    mCycle: number;
    mHype: number;
    exitMultiple: number;
    simulations: number;
    seed: number;
  };
}

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
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

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
        // Verify meta.symbol matches requested symbol (guardrail)
        if (json.meta && json.meta.symbol && json.meta.symbol.toUpperCase() !== symbol.toUpperCase()) {
          throw new Error('Symbol mismatch in projection response');
        }
        setData(json.data);
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
  }, [symbol]);

  if (!PREDICTION_ENABLED) {
    return null;
  }

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
          justifyContent: 'space-between',
          minHeight: '260px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ width: '140px', height: '14px', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
          <div style={{ width: '96px', height: '14px', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
        </div>
        <div style={{ width: '160px', height: '40px', backgroundColor: 'var(--border)', borderRadius: '6px', marginBottom: '8px' }} />
        <div style={{ width: '80px', height: '14px', backgroundColor: 'var(--border)', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ width: '120px', height: '24px', backgroundColor: 'var(--border)', borderRadius: '4px', marginBottom: '16px' }} />
        <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--border)', borderRadius: '4px' }} />
      </div>
    );
  }

  // 2. Unavailable / Refusal State
  if (error || !data || data.ok === false) {
    const refusalReason = data?.reason || error || 'Projection not available for this instrument';
    return (
      <div
        data-testid="prediction-card-unavailable"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '24px',
          backgroundColor: 'var(--card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '260px'
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Model projection · 5 years
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Reliability: Low
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
            Projection not available
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {refusalReason}
          </p>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px', lineHeight: 1.4 }}>
          Projections require positive trailing twelve-month earnings and historical multiple coverage.
        </div>
      </div>
    );
  }

  // 3. Normal Active Projection State
  const changeFraction = data.changePct;
  const changePercent = Math.abs(changeFraction * 100);
  const isUp = changeFraction > 0.0005;
  const isDown = changeFraction < -0.0005;

  // Exact color requirement: green #107C41 up / red #B3261E down / muted grey #71717A flat
  const changeColor = isUp ? '#107C41' : isDown ? '#B3261E' : '#71717A';
  const changeArrow = isUp ? '▲ ' : isDown ? '▼ ' : '';
  const changeSign = isUp ? '+' : isDown ? '-' : '';
  const changeText = isUp || isDown ? `${changeArrow}${changeSign}${changePercent.toFixed(1)}%` : '0.0%';

  const ariaDescription = `Model projection in 5 years: ${formatPrice({ amount: data.p50, currency })}, ${isUp ? 'up' : isDown ? 'down' : 'flat'} ${changePercent.toFixed(1)} percent`;

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
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* Top Header Line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Model projection · 5 years
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Reliability: {data.reliability}
          </span>
        </div>

        {/* Big 40px/600 Stock Value */}
        <div
          aria-label={ariaDescription}
          style={{
            fontSize: '40px',
            fontWeight: 600,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {formatPrice({ amount: data.p50, currency })}
        </div>

        {/* Horizon Date Line */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '8px' }}>
          by {data.horizonDate}
        </div>

        {/* 20px/500 Percentage Change with Arrow and Sign */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: 500,
            color: changeColor,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          <span>{changeText}</span>
        </div>

        {/* Likely Range 80% */}
        <div style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Likely range </span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice({ amount: data.p10, currency })} – {formatPrice({ amount: data.p90, currency })}
          </strong>
          <span style={{ color: 'var(--text-muted)' }}> · 80% of simulations</span>
        </div>

        {/* Always Visible "Based on" Line */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            marginBottom: '12px'
          }}
        >
          Based on: news · financial health · sector competition · sector regulation · market cycle · peer valuation · legal rulings · public reviews · public attention · model reliability
        </div>

        {/* Expandable Breakdown Button */}
        <div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 0',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--foreground)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '44px'
            }}
          >
            <span>How this is predicted</span>
            <span>{expanded ? '▴' : '▾'}</span>
          </button>
        </div>

        {/* Expanded Breakdown Table & Assumptions */}
        {expanded && (
          <div
            data-testid="prediction-breakdown-panel"
            style={{
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Factor</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>What it measures</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Data source and date</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Current reading</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Effect on the projection</th>
                  </tr>
                </thead>
                <tbody>
                  {data.factors.map((f) => {
                    const readingColor =
                      f.reading === 'Positive'
                        ? '#107C41'
                        : f.reading === 'Negative'
                          ? '#B3261E'
                          : 'var(--text-muted)';
                    return (
                      <tr key={f.key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 500, color: 'var(--foreground)' }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>
                          {f.measures}
                        </td>
                        <td style={{ padding: '8px 6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                          {f.source} · {f.asOf}
                        </td>
                        <td style={{ padding: '8px 6px', fontWeight: 500, color: readingColor }}>
                          {f.reading}
                        </td>
                        <td style={{ padding: '8px 6px', fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)' }}>
                          {f.effect}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assumptions Summary */}
            <div
              style={{
                backgroundColor: 'var(--secondary)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                color: 'var(--foreground)',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Key model assumptions:</div>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                <li>
                  Base EPS path: {data.assumptions.eps0.toFixed(2)} {currency} fades along {data.assumptions.baseGrowthPath.map((g) => `${(g * 100).toFixed(1)}%`).join(', ')} to terminal growth {(data.assumptions.gLong * 100).toFixed(1)}%
                </li>
                <li>
                  Exit multiple: {data.assumptions.exitMultiple.toFixed(2)}x (anchor {data.assumptions.peAnchor.toFixed(1)}x, cycle adjustment {data.assumptions.mCycle >= 0 ? '+' : ''}{data.assumptions.mCycle.toFixed(1)}%, attention adjustment {data.assumptions.mHype.toFixed(1)}%)
                </li>
                <li>
                  Projection horizon: 5 years ({data.horizonDate}) across {data.assumptions.simulations.toLocaleString()} seeded iterations
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Statutory Statement at bottom */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '16px' }}>
        Model-generated projection from the factors shown. Not a forecast, recommendation or guarantee; actual results can differ materially.
      </div>
    </div>
  );
};
