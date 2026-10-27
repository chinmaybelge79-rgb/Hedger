import React, { useEffect, useState } from 'react';
import { formatDate } from '@hedger/format';
import { VALUATION_STATUS_ENABLED } from '../flags.js';

interface MetricEvaluation {
  key: string;
  name: string;
  value: number | null;
  unit: '%' | 'x' | 'ratio';
  weakThreshold: number;
  strongThreshold: number;
  direction: 'higher' | 'lower';
  score: number | null;
  period?: string;
  isAvailable: boolean;
}

interface AnalysisPillar {
  name: string;
  weight: number;
  score: number | null;
  metrics: MetricEvaluation[];
  isAvailable: boolean;
}

interface FinancialAnalysisData {
  symbol: string;
  companyType: 'standard' | 'bank';
  score: number | null;
  label: string;
  meaning: string;
  completeness: number;
  pillars: AnalysisPillar[];
  narrative: string[];
  disclaimer: string;
  asOf: string;
  meta: {
    symbol: string;
    asOf: string;
    freshness: string;
    source: string;
  };
}

interface ValuationStatusData {
  status: 'Overvalued' | 'Fairly valued' | 'Undervalued' | 'Not enough data';
  rHist: number | null;
  rPeer: number | null;
  metricName: string;
  summaryText: string;
  footerText: string;
}

interface FinancialAnalysisSectionProps {
  symbol: string;
}

export const FinancialAnalysisSection: React.FC<FinancialAnalysisSectionProps> = ({ symbol }) => {
  const [data, setData] = useState<FinancialAnalysisData | null>(null);
  const [valStatus, setValStatus] = useState<ValuationStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/instruments/${encodeURIComponent(symbol)}/analysis`).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      VALUATION_STATUS_ENABLED
        ? fetch(`/api/v1/instruments/${encodeURIComponent(symbol)}/valuation-status`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        : Promise.resolve(null)
    ])
      .then(([analysisJson, statusJson]) => {
        if (!isMounted) return;
        setData(analysisJson);
        if (statusJson && statusJson.data) {
          setValStatus(statusJson.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load financial analysis');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div
        id="financial-analysis-section"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: 'var(--card)',
          marginBottom: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}
      >
        Loading financial health and quality analysis for {symbol}...
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const formatMetricVal = (m: MetricEvaluation) => {
    if (m.value === null || m.value === undefined) return '—';
    if (m.unit === '%') return `${(m.value * 100).toFixed(1)}%`;
    if (m.unit === 'x') return `${m.value.toFixed(1)}x`;
    return m.value.toFixed(2);
  };

  const formatThreshold = (val: number, unit: '%' | 'x' | 'ratio') => {
    if (unit === '%') return `${(val * 100).toFixed(0)}%`;
    if (unit === 'x') return `${val.toFixed(1)}x`;
    return val.toFixed(1);
  };

  return (
    <section
      id="financial-analysis-section"
      data-testid="ai-analysis-section"
      style={{
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        backgroundColor: 'var(--card)',
        marginBottom: '32px'
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Evidence-Based Assessment
            </span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--secondary)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              DETERMINISTIC
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em', margin: 0 }}>
            Financial Health & Quality Analysis
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Objective reading of audited fundamentals against standardized thresholds without opinions or advice.
          </p>
        </div>

        {/* Change B: Plain Valuation Status Chip (neutral outline, no green/red, no rating chip) */}
        {VALUATION_STATUS_ENABLED && valStatus && (
          <div
            data-testid="valuation-status-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              maxWidth: '380px'
            }}
          >
            <div
              data-testid="valuation-status-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.01em'
              }}
            >
              {valStatus.status}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4 }}>
              {valStatus.summaryText}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.85 }}>
              {valStatus.footerText}
            </div>
          </div>
        )}
      </div>

      {/* 5 Pillars Progress Grid (Change A: descriptive pillars without a verdict chip) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '16px' }}>
          Five Pillars Breakdown
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          {data.pillars.map((pillar) => {
            const pScore = pillar.score ?? 0;
            const pColor = pScore >= 65 ? 'var(--positive)' : pScore >= 40 ? 'var(--foreground)' : 'var(--negative)';

            return (
              <div
                key={pillar.name}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px',
                  backgroundColor: 'var(--secondary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)' }}>{pillar.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{(pillar.weight * 100).toFixed(0)}% wt</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: pColor, fontVariantNumeric: 'tabular-nums' }}>
                    {pillar.score !== null ? `${pillar.score}` : '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                </div>

                {/* Progress track */}
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, pScore))}%`,
                      height: '100%',
                      backgroundColor: pColor,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                {/* Individual Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {pillar.metrics.map((m) => (
                    <div key={m.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }} title={m.name}>
                        {m.name.split(' ')[0]}
                      </span>
                      <strong style={{ color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMetricVal(m)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Factual Narrative Statements */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 24px', backgroundColor: 'var(--card)', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px' }}>
          Factual Statement Summary
        </div>
        <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.narrative.map((statement, idx) => (
            <li key={idx} style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: '20px' }}>
              {statement}
            </li>
          ))}
        </ul>
      </div>

      {/* "How this is calculated" Collapsible Expander */}
      <details
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--secondary)',
          marginBottom: '24px',
          cursor: 'pointer'
        }}
      >
        <summary style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', outline: 'none' }}>
          How this is calculated (Thresholds, Weights & Formulas)
        </summary>
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            The financial health score is a deterministic weighted index of five pillars: Profitability (25%), Growth (20%), Cash quality (20%), Balance sheet (20%), and Valuation context (15%). Missing metrics are excluded and weights are renormalized.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Directional Scoring Formula:</strong>
            <br />
            Higher is better: <code style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)', padding: '0 4px', borderRadius: '4px' }}>score = clamp(100 × (x − weak) / (strong − weak), 0, 100)</code>
            <br />
            Lower is better: <code style={{ backgroundColor: 'var(--secondary)', color: 'var(--foreground)', padding: '0 4px', borderRadius: '4px' }}>score = clamp(100 × (weak − x) / (weak − strong), 0, 100)</code>
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--foreground)' }}>
                <th style={{ padding: '6px 8px' }}>Metric</th>
                <th style={{ padding: '6px 8px' }}>Weak (Score 0)</th>
                <th style={{ padding: '6px 8px' }}>Strong (Score 100)</th>
                <th style={{ padding: '6px 8px' }}>Direction</th>
              </tr>
            </thead>
            <tbody>
              {data.pillars.flatMap((p) => p.metrics).map((m) => (
                <tr key={m.key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--foreground)' }}>{m.name}</td>
                  <td style={{ padding: '6px 8px' }}>{formatThreshold(m.weakThreshold, m.unit)}</td>
                  <td style={{ padding: '6px 8px' }}>{formatThreshold(m.strongThreshold, m.unit)}</td>
                  <td style={{ padding: '6px 8px' }}>{m.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Compliance & Disclosure Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <div>
          {data.disclaimer} Not investment advice or an endorsement. Deterministic financial model output for research purposes.
        </div>
        <div style={{ fontFamily: 'monospace' }}>
          As of {formatDate(data.asOf)} · Completeness: {data.completeness}%
        </div>
      </div>
    </section>
  );
};
