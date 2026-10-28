import React, { useEffect, useState } from 'react';
import { formatPrice } from '@hedger/format';
import type {
  FactorReading,
  InstitutionalPredictionSynthesis,
  HorizonOutput,
  GateResult
} from '@hedger/valuation';
import { PREDICTION_ENABLED } from '../flags.js';

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
  institutionalSynthesis?: InstitutionalPredictionSynthesis;
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
  const [expandedFactors, setExpandedFactors] = useState<boolean>(false);
  const [expandedGates, setExpandedGates] = useState<boolean>(false);
  const [selectedHorizon, setSelectedHorizon] = useState<'1Y' | '3Y' | '5Y'>('1Y');

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
              Institutional scenario model · v1.0
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
          Institutional models require positive trailing earnings, balance sheet depth, and audited filing coverage.
        </div>
      </div>
    );
  }

  // 3. Institutional Active Horizon State
  const synthesis = data.institutionalSynthesis;
  const horizonData: HorizonOutput | undefined = synthesis?.horizons ? synthesis.horizons[selectedHorizon] : undefined;

  // Active prices and IRR for selected horizon
  const displayPrice = horizonData ? horizonData.probWeightedPrice : data.p50;
  const displayP10 = horizonData ? horizonData.p10 : data.p10;
  const displayP90 = horizonData ? horizonData.p90 : data.p90;
  const displayHorizonDate = horizonData ? horizonData.horizonDate : data.horizonDate;
  const displayIrrPct = horizonData ? horizonData.expectedIrrPct : (data.changePct * 100);

  const isUp = displayIrrPct > 0.05;
  const isDown = displayIrrPct < -0.05;
  const changeColor = isUp ? '#107C41' : isDown ? '#B3261E' : '#71717A';
  const changeArrow = isUp ? '▲ ' : isDown ? '▼ ' : '';
  const changeSign = isUp ? '+' : isDown ? '-' : '';
  const changeText = isUp || isDown ? `${changeArrow}${changeSign}${Math.abs(displayIrrPct).toFixed(1)}% expected IRR` : '0.0% expected IRR';

  // Valuation Stance Styling
  const stance = synthesis?.valuationStance || 'Fairly valued / neutral';
  const stanceColor =
    stance === 'Attractive risk/reward'
      ? { bg: '#064E3B', text: '#A7F3D0', border: '#059669' }
      : stance === 'Reasonable risk/reward'
        ? { bg: '#042F2E', text: '#99F6E4', border: '#0D9488' }
        : stance === 'Fairly valued / neutral'
          ? { bg: '#27272A', text: '#E4E4E7', border: '#52525B' }
          : stance === 'Stretched'
            ? { bg: '#451A03', text: '#FDE68A', border: '#D97706' }
            : stance === 'Unfavourable risk/reward'
              ? { bg: '#450A0A', text: '#FECACA', border: '#DC2626' }
              : { bg: '#27272A', text: '#A1A1AA', border: '#3F3F46' };

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
      {/* Top Header Line with Stance and Horizon Switcher */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: stanceColor.bg,
                color: stanceColor.text,
                border: `1px solid ${stanceColor.border}`
              }}
            >
              {stance}
            </span>
            {synthesis?.evidenceGrade && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)'
                }}
              >
                Grade {synthesis.evidenceGrade}
              </span>
            )}
          </div>

          {/* Horizon Segmented Selector */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--secondary)',
              borderRadius: '6px',
              padding: '3px',
              gap: '4px'
            }}
          >
            {(['1Y', '3Y', '5Y'] as const).map((h) => {
              const active = selectedHorizon === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHorizon(h)}
                  style={{
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? 'var(--card)' : 'transparent',
                    color: active ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {h} Horizon
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Probability-Weighted Valuation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Probability-weighted price projection · {selectedHorizon}
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 600,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {formatPrice({ amount: displayPrice, currency })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: changeColor, fontVariantNumeric: 'tabular-nums' }}>
              {changeText}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              by {displayHorizonDate} (current: {formatPrice({ amount: currentPrice, currency })})
            </span>
          </div>
        </div>

        {/* 10th-90th Corridor Range */}
        <div style={{ fontSize: '13px', color: 'var(--foreground)', marginTop: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>80% probability corridor: </span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatPrice({ amount: displayP10, currency })} – {formatPrice({ amount: displayP90, currency })}
          </strong>
          {horizonData?.skewRatio && horizonData.skewRatio !== 'n/a' && (
            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
              · Skew ratio: {typeof horizonData.skewRatio === 'number' ? horizonData.skewRatio.toFixed(2) : horizonData.skewRatio}
            </span>
          )}
        </div>

        {/* Horizon Reading Guide Callout */}
        {horizonData?.readingGuide && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--secondary)',
              borderLeft: '3px solid var(--accent, #0D9488)',
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--foreground)'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--foreground)' }}>
              Operating Guidance for {selectedHorizon}:
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{horizonData.readingGuide}</div>
          </div>
        )}
      </div>

      {/* Scenario Breakdown Cards (Bear / Base / Bull) */}
      {horizonData && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Scenario Distribution · {selectedHorizon}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}
          >
            {/* Bear Scenario Card */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: 'var(--secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#B3261E' }}>Bear Scenario</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {(horizonData.bear.probability * 100).toFixed(0)}% weight
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice({ amount: horizonData.bear.price, currency })}
              </div>
              <div style={{ fontSize: '12px', color: horizonData.bear.irrPct >= 0 ? '#107C41' : '#B3261E', fontVariantNumeric: 'tabular-nums' }}>
                {horizonData.bear.irrPct >= 0 ? '+' : ''}{horizonData.bear.irrPct.toFixed(1)}% IRR
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target multiple: {horizonData.bear.targetMultiple.toFixed(1)}x
              </div>
            </div>

            {/* Base Scenario Card */}
            <div
              style={{
                border: '1px solid var(--accent, #0D9488)',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: 'var(--secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>Base Scenario</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {(horizonData.base.probability * 100).toFixed(0)}% weight
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice({ amount: horizonData.base.price, currency })}
              </div>
              <div style={{ fontSize: '12px', color: horizonData.base.irrPct >= 0 ? '#107C41' : '#B3261E', fontVariantNumeric: 'tabular-nums' }}>
                {horizonData.base.irrPct >= 0 ? '+' : ''}{horizonData.base.irrPct.toFixed(1)}% IRR
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target multiple: {horizonData.base.targetMultiple.toFixed(1)}x
              </div>
            </div>

            {/* Bull Scenario Card */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: 'var(--secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#107C41' }}>Bull Scenario</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {(horizonData.bull.probability * 100).toFixed(0)}% weight
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPrice({ amount: horizonData.bull.price, currency })}
              </div>
              <div style={{ fontSize: '12px', color: horizonData.bull.irrPct >= 0 ? '#107C41' : '#B3261E', fontVariantNumeric: 'tabular-nums' }}>
                {horizonData.bull.irrPct >= 0 ? '+' : ''}{horizonData.bull.irrPct.toFixed(1)}% IRR
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target multiple: {horizonData.bull.targetMultiple.toFixed(1)}x
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Evidence & Uncertainty Statements (Part K) */}
      {synthesis?.statements && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            fontSize: '12px',
            lineHeight: 1.5
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: '#107C41', marginBottom: '6px' }}>What evidence supports:</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-muted)' }}>
              {synthesis.statements.evidenceSupports.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#D97706', marginBottom: '6px' }}>What remains uncertain:</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-muted)' }}>
              {synthesis.statements.remainsUncertain.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>What would change this stance:</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-muted)' }}>
              {synthesis.statements.changeTriggers.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Expandable Controls: Reconciliation Gates and Factor Model */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Audit Gates Button */}
          {synthesis?.gates && (
            <button
              type="button"
              aria-expanded={expandedGates}
              onClick={() => setExpandedGates(!expandedGates)}
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
              <span>Audit 18 Reconciliation Gates ({synthesis.gates.filter(g => g.status === 'PASS').length}/18 Passed)</span>
              <span>{expandedGates ? '▴' : '▾'}</span>
            </button>
          )}

          {/* Factor Breakdown Button */}
          <button
            type="button"
            aria-expanded={expandedFactors}
            onClick={() => setExpandedFactors(!expandedFactors)}
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
            <span>Factor readings & model assumptions</span>
            <span>{expandedFactors ? '▴' : '▾'}</span>
          </button>
        </div>

        {/* 18 Reconciliation Gates Panel */}
        {expandedGates && synthesis?.gates && (
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              Independent Verification & Reconciliation Gates (Part I)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Gate</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Verification Rule</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesis.gates.map((g: GateResult, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {g.gate}
                      </td>
                      <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>
                        {g.check}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#064E3B',
                            color: '#A7F3D0'
                          }}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 6px', color: 'var(--foreground)' }}>
                        {g.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expanded Breakdown Table & Assumptions */}
        {expandedFactors && (
          <div
            data-testid="prediction-breakdown-panel"
            style={{
              paddingTop: '12px',
              borderTop: '1px dashed var(--border)'
            }}
          >
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Factor</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>What it measures</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Data source and date</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Current reading</th>
                    <th style={{ padding: '8px 6px', fontWeight: 600 }}>Effect on projection</th>
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
                marginBottom: '8px'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Key model parameters:</div>
              <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                <li>
                  Base EPS path: {data.assumptions.eps0.toFixed(2)} {currency} fades along {data.assumptions.baseGrowthPath.map((g) => `${(g * 100).toFixed(1)}%`).join(', ')} to terminal growth {(data.assumptions.gLong * 100).toFixed(1)}%
                </li>
                <li>
                  Exit multiple: {data.assumptions.exitMultiple.toFixed(2)}x (anchor {data.assumptions.peAnchor.toFixed(1)}x, cycle adjustment {data.assumptions.mCycle >= 0 ? '+' : ''}{data.assumptions.mCycle.toFixed(1)}%, attention adjustment {data.assumptions.mHype.toFixed(1)}%)
                </li>
                <li>
                  Seeded iterations: {data.assumptions.simulations.toLocaleString()} draws with Box-Muller normal distribution
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Statutory Statement at bottom */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        Institutional scenario probability distribution derived from stated assumptions. Not financial advice, transaction orders, or guaranteed returns; actual market results can differ materially.
      </div>
    </div>
  );
};
