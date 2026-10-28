import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useThesis } from '../context/ThesisContext.js';
import { PricingUpgradeModal } from './PricingUpgradeModal.js';

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

const STORAGE_GENERATED_KEY = 'hedger_theses_generated_symbols';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plan = user?.plan || 'basic';
  const isGlobalGenerating = isGenerating || isGeneratingSymbol(symbol);

  // Check how many symbols have been generated on this browser/account
  const getGeneratedSymbols = (): string[] => {
    try {
      const item = localStorage.getItem(STORAGE_GENERATED_KEY);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  };

  const recordGeneratedSymbol = (sym: string) => {
    try {
      const list = getGeneratedSymbols();
      const upper = sym.toUpperCase();
      if (!list.includes(upper)) {
        list.push(upper);
        localStorage.setItem(STORAGE_GENERATED_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  };

  const generatedSymbols = getGeneratedSymbols();
  const isBasic = plan === 'basic';
  const hasUsedBasicQuota = isBasic && generatedSymbols.length >= 1 && !generatedSymbols.includes(symbol.toUpperCase());

  const steps = [
    'Ingesting audited regulatory statements & consensus feeds...',
    'Calibrating WACC, 10-Year Multi-Stage FCFF and Equity Bridge...',
    'Running Reverse DCF expectations & Peer Multiples...',
    'Executing Sloan accrual audit & ROIC-WACC spread analysis...',
    'Synthesizing 18-Section Hedger Investment Research Dossier...'
  ];

  // Sync with background thesis manager or cached thesis on mount
  useEffect(() => {
    const bgThesis = getThesisForSymbol(symbol);
    if (bgThesis) {
      setThesisMarkdown(bgThesis);
      recordGeneratedSymbol(symbol);
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
          recordGeneratedSymbol(symbol);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [symbol, getThesisForSymbol]);

  // Handle Generation with Free/Basic Quota Check
  const handleGenerate = async () => {
    // Basic tier restriction: Only 1 thesis allowed
    if (hasUsedBasicQuota) {
      setShowUpgradeModal(true);
      return;
    }

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
        recordGeneratedSymbol(symbol);
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
        marginTop: '32px'
      }}
    >
      <div
        data-testid="ai-investment-thesis-card"
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
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)'
                }}
              >
                Equity Research Dossier
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--secondary)',
                  color: isBasic && hasUsedBasicQuota ? '#D97706' : 'var(--foreground)'
                }}
              >
                {isBasic ? (hasUsedBasicQuota ? 'Basic Tier: 1/1 Used' : 'Basic Tier: 1 Complimentary') : `${plan.toUpperCase()} Plan`}
              </span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
              Institutional Investment Thesis & Financial Health
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
              Deterministic fundamental equity research for {companyName} ({symbol}). Integrates audited financial statements, reverse DCF expectations, Sloan accrual audits, and 3-horizon scenario distributions.
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
                  fontWeight: 500
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
                cursor: isGlobalGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {isGlobalGenerating
                ? 'Synthesizing Live Thesis...'
                : hasUsedBasicQuota
                  ? 'Upgrade to Unlock More Theses'
                  : thesisMarkdown
                    ? 'Re-Generate Live Thesis'
                    : 'Generate Live Thesis'}
            </button>
          </div>
        </div>

        {/* Feature Metadata Badges (Clean monochrome) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['Audited Financial Filings', '18-Section Research Template', 'ROIC vs WACC Moat Audit', 'Reverse DCF Expectations'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--secondary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: 'rgb(239, 68, 68)',
              fontSize: '12px'
            }}
          >
            {error}
          </div>
        )}

        {/* Live Generation Progress Terminal */}
        {isGlobalGenerating && (
          <div
            style={{
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              padding: '20px'
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
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                Fundamental Research Synthesis ({symbol})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {Math.min(activeStep + 1, steps.length)} of {steps.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((st, sIdx) => {
                const isDone = activeStep > sIdx;
                const isCurrent = activeStep === sIdx;
                return (
                  <div
                    key={sIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12px',
                      color: isDone ? 'var(--foreground)' : isCurrent ? 'var(--foreground)' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 600 : 400
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: isDone ? 'var(--primary)' : isCurrent ? 'var(--card)' : 'transparent',
                        color: isDone ? '#FFFFFF' : 'inherit',
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

        {/* Ready State Banner */}
        {thesisMarkdown && !isGlobalGenerating && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent, #0D9488)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                Institutional Research Dossier Ready
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                {companyName} ({symbol}) — Complete 18-Section Analysis
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Multi-stage DCF, Sloan accrual audit, ROIC-WACC spreads, and Bear / Base / Bull scenario distributions.
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/company/${encodeURIComponent(symbol)}/thesis`, {
                  state: { thesis: thesisMarkdown, symbol }
                })
              }
              className="btn btn-secondary"
              style={{
                height: '36px',
                fontSize: '12px',
                padding: '0 16px',
                fontWeight: 600
              }}
            >
              Open Dossier →
            </button>
          </div>
        )}

        {/* Basic Plan Quota Notice */}
        {isBasic && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              borderTop: '1px solid var(--border)',
              paddingTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <span>
              Basic Free plan includes 1 complimentary research thesis. {hasUsedBasicQuota ? 'Limit reached (1/1 used).' : 'Available (0/1 used).'}
            </span>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent, #0D9488)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upgrade to Pro for Unlimited Theses →
            </button>
          </div>
        )}
      </div>

      {/* Pricing Upgrade Modal on Quota Exhaustion */}
      <PricingUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Unlock Unlimited Investment Theses"
        description="Basic Free tier includes 1 complimentary research dossier. Upgrade to Pro for unlimited institutional equity theses, custom DCF workbench, and financial report exports."
      />
    </div>
  );
};
