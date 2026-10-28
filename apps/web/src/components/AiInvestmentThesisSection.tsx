import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useThesis } from '../context/ThesisContext.js';
import { HedgerOrb } from './HedgerOrb.js';

interface AiInvestmentThesisSectionProps {
  symbol: string;
  companyName: string;
  companyType?: 'standard' | 'bank' | 'nbfc' | 'insurance';
  currentPrice?: number;
  currency?: string;
  marketCap?: number;
  dcfInputs?: Record<string, unknown>;
  analysisData?: Record<string, unknown>;
}

export const AiInvestmentThesisSection: React.FC<AiInvestmentThesisSectionProps> = ({
  symbol,
  companyName,
  dcfInputs,
  analysisData
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startGeneration, isGeneratingSymbol, getThesisForSymbol } = useThesis();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [thesisMarkdown, setThesisMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = user?.plan || 'basic';
  const isGlobalGenerating = isGenerating || isGeneratingSymbol(symbol);

  const steps = [
    'Initializing Hedger Intelligence fundamental synthesis engine...',
    'Ingesting audited regulatory statements & consensus feeds...',
    'Calibrating WACC, 10-Year Multi-Stage FCFF and Equity Bridge...',
    'Running Reverse DCF expectations & Peer Multiples...',
    'Synthesizing 18-Section Hedger Investment Thesis...'
  ];

  // Sync with background thesis manager or cached thesis on mount
  useEffect(() => {
    const bgThesis = getThesisForSymbol(symbol);
    if (bgThesis) {
      setThesisMarkdown(bgThesis);
      return;
    }

    fetch(`/api/ai/thesis/${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.thesis) {
          setThesisMarkdown(data.thesis);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [symbol, getThesisForSymbol]);

  // Handle Live Generation (Runs in persistent background manager)
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setActiveStep(0);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      const generated = await startGeneration(symbol, dcfInputs, analysisData);
      clearInterval(stepInterval);
      if (generated) {
        setThesisMarkdown(generated);
        setActiveStep(steps.length);
      } else {
        throw new Error('Generation failed. Please try again.');
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="ai-investment-thesis-section"
      style={{
        marginTop: '48px',
        paddingTop: '8px'
      }}
    >
      <div
        className="ai-thesis-highlight-card"
        style={{
          position: 'relative',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.32)',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.04) 0%, rgba(139, 92, 246, 0.06) 45%, rgba(236, 72, 153, 0.04) 100%), var(--card)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35), 0 0 24px -4px rgba(0, 240, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          padding: '24px 32px',
          overflow: 'hidden'
        }}
      >
        {/* Luminous Top Accent Line with Energy Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #00f0ff 0%, #3b82f6 30%, #8b5cf6 70%, #ec4899 100%)',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.8)'
          }}
        />

        {/* Ambient Plasma Glow Aura */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(0, 240, 255, 0.08) 45%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(24px)'
          }}
        />

        {/* Top Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div>
            {/* Live Three.js Glowing Plasma Orb Component in front of HEDGER INTELLIGENCE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <HedgerOrb size={44} speed={1.15} />
              <span className="hedger-intelligence-title">
                HEDGER INTELLIGENCE
              </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
              AI Investment Thesis & Financial Analysis
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
              Live fundamental equity research synthesized in real time for {companyName} ({symbol}). Integrates Reverse DCF expectations, audited statements, capital structure health, and probability-weighted Bear / Base / Bull scenarios.
            </p>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {thesisMarkdown && (
              <button
                onClick={() =>
                  navigate(`/company/${encodeURIComponent(symbol)}/thesis`, {
                    state: { thesis: thesisMarkdown, symbol }
                  })
                }
                className="btn btn-secondary"
                style={{
                  height: '38px',
                  fontSize: '12px',
                  padding: '0 16px',
                  fontWeight: 500,
                  borderColor: 'rgba(139, 92, 246, 0.35)'
                }}
              >
                Open Full Thesis Page →
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGlobalGenerating}
              className="btn btn-primary"
              style={{
                height: '38px',
                fontSize: '12px',
                padding: '0 20px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 50%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(0, 240, 255, 0.35)',
                cursor: isGlobalGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {isGlobalGenerating ? 'Synthesizing Live Thesis...' : thesisMarkdown ? 'Re-Generate Live Thesis' : 'Generate Live Thesis'}
            </button>
          </div>
        </div>

        {/* Eyecatching Feature Trait Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--foreground)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00f0ff' }} />
            18-Section Hedger Template
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--foreground)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
            Reverse DCF Expectations & Catalysts
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(236, 72, 153, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--foreground)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ec4899' }} />
            Deterministic 3-Scenario Matrix
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: 'rgb(239, 68, 68)',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            {error}
          </div>
        )}

        {/* Live Generation Progress Terminal */}
        {isGlobalGenerating && (
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              padding: '24px',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#00f0ff',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #00f0ff'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Live Fundamental Synthesis ({symbol})
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {Math.min(activeStep + 1, steps.length)} of {steps.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {steps.map((st, sIdx) => {
                const isDone = activeStep > sIdx;
                const isCurrent = activeStep === sIdx;
                return (
                  <div
                    key={sIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      color: isDone ? 'var(--foreground)' : isCurrent ? 'var(--foreground)' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 600 : 400
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: isDone ? '#00f0ff' : isCurrent ? 'var(--secondary)' : 'transparent',
                        color: isDone ? '#000000' : 'inherit',
                        fontWeight: isDone ? 700 : 400
                      }}
                    >
                      {isDone ? '✓' : sIdx + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Case when thesis is already generated */}
        {thesisMarkdown && !isGlobalGenerating && (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              backgroundColor: 'rgba(0, 240, 255, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Institutional Thesis Ready
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: '4px 0 2px 0' }}>
                {companyName} ({symbol}) — Complete 18-Section Research Dossier
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Validated DCF scenario matrix, variant perception, ROIC economic value-add, and timeline catalysts.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/company/${encodeURIComponent(symbol)}/thesis`, {
                  state: { thesis: thesisMarkdown, symbol }
                })
              }
              className="btn btn-primary"
              style={{
                height: '36px',
                fontSize: '12px',
                padding: '0 16px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600
              }}
            >
              Open Thesis Page →
            </button>
          </div>
        )}

        {/* Case when no thesis has been generated yet: Preview Traits Grid */}
        {!thesisMarkdown && !isGlobalGenerating && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '4px'
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Pillar 01 · Moat & Solvency
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Balance Sheet Resilience
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Solvency health, Piotroski F-Score, Altman Z-Score distress zones, and organic cash conversion.
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Pillar 02 · Expectations Gap
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Reverse DCF Implied Growth
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Deconstructs the exact growth rate and margin durability currently priced in by market consensus.
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#ec4899', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Pillar 03 · Tri-Scenario Matrix
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Bear / Base / Bull Valuations
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Full 9-cell valuation grid across 1-Year, 2-Year, and 5-Year horizons with pre-mortem risk breakers.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
