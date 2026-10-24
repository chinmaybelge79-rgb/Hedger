import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updatePlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (plan: 'basic' | 'plus' | 'pro' | 'ultra') => {
    if (isAuthenticated) {
      updatePlan(plan);
      navigate('/profile');
    } else {
      navigate('/screener');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '16px' }}>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            marginBottom: '12px',
            lineHeight: 1.15
          }}
        >
          Institutional-Grade Equity Research in Your Hands
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            maxWidth: '580px',
            margin: '0 auto 24px',
            lineHeight: 1.5
          }}
        >
          Deterministic valuation engines, audited fundamentals, and cross-border peer comparisons calibrated to your portfolio scale.
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px',
            backgroundColor: 'var(--bg-hover, #F2F2F5)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '12px',
              fontWeight: billingCycle === 'monthly' ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: billingCycle === 'monthly' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
              color: billingCycle === 'monthly' ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
            }}
          >
            Billed Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              height: '36px',
              padding: '0 16px',
              fontSize: '12px',
              fontWeight: billingCycle === 'yearly' ? 600 : 400,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: billingCycle === 'yearly' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
              color: billingCycle === 'yearly' ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              boxShadow: billingCycle === 'yearly' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Billed Annually</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                color: 'var(--positive)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 4 Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '64px' }}>
        {/* Basic */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
              Basic
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '36px', marginBottom: '16px', lineHeight: 1.4 }}>
              Core fundamental screening and valuation overview for individual allocators.
            </p>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                $0
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Free forever · Zero commitment
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text)' }}>
              <div>[✓] Global screener across NSE, US, EU, and Asia</div>
              <div>[✓] 15-minute delayed quotes and historical charts</div>
              <div>[✓] 3 institutional DCF valuations per day</div>
              <div>[✓] 5-year audited financial statements</div>
              <div>[✓] Global equity search (⌘K)</div>
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('basic')}
            className="btn btn-secondary"
            style={{ width: '100%', height: '44px', minHeight: '44px', marginTop: '24px', fontSize: '13px', fontWeight: 500 }}
          >
            {user?.plan === 'basic' ? 'Current Tier' : 'Get Started Free'}
          </button>
        </div>

        {/* Plus */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
              Plus
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '36px', marginBottom: '16px', lineHeight: 1.4 }}>
              Real-time streaming and unlimited valuation sensitivity for active allocators.
            </p>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                  {billingCycle === 'yearly' ? '$3.99' : '$4.99'}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {billingCycle === 'yearly' ? 'Billed annually ($47.90/yr · 20% off)' : 'Billed monthly ($4.99/mo)'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text)' }}>
              <div>[✓] Real-time price streaming (NSE & US)</div>
              <div>[✓] Unlimited DCF & Reverse DCF valuations</div>
              <div>[✓] Interactive 5x5 WACC vs growth sensitivity grid</div>
              <div>[✓] 10-year audited financial statement history</div>
              <div>[✓] Clean spreadsheet CSV data export</div>
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('plus')}
            className="btn btn-secondary"
            style={{ width: '100%', height: '44px', minHeight: '44px', marginTop: '24px', fontSize: '13px', fontWeight: 500 }}
          >
            {user?.plan === 'plus' ? 'Current Tier' : 'Choose Plus'}
          </button>
        </div>

        {/* Pro */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '2px solid var(--accent, #1D1D1F)',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              backgroundColor: 'var(--accent, #1D1D1F)',
              color: 'var(--bg, #FFFFFF)',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '3px 10px',
              borderRadius: '4px'
            }}
          >
            Institutional Standard
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
              Pro
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '36px', marginBottom: '16px', lineHeight: 1.4 }}>
              Full cross-border peer benchmarking and multi-model equity valuation workbench.
            </p>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                  {billingCycle === 'yearly' ? '$7.99' : '$9.99'}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {billingCycle === 'yearly' ? 'Billed annually ($95.90/yr · 20% off)' : 'Billed monthly ($9.99/mo)'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text)' }}>
              <div>[✓] Everything in Plus included</div>
              <div>[✓] Cross-Border Peer Comparison Workbench</div>
              <div>[✓] Automatic FX conversion & fiscal year alignment</div>
              <div>[✓] Banking Excess Returns & Dividend Discount models</div>
              <div>[✓] Unlimited model persistence & parameter notes</div>
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('pro')}
            className="btn btn-primary"
            style={{ width: '100%', height: '44px', minHeight: '44px', marginTop: '24px', fontSize: '13px', fontWeight: 600 }}
          >
            {user?.plan === 'pro' ? 'Current Tier' : 'Choose Pro'}
          </button>
        </div>

        {/* Ultra */}
        <div
          className="card"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0' }}>
              Ultra
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '36px', marginBottom: '16px', lineHeight: 1.4 }}>
              Predictive simulation, stress testing, and balance-sheet audits for desks and funds.
            </p>

            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
                  {billingCycle === 'yearly' ? '$15.99' : '$19.99'}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ month</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {billingCycle === 'yearly' ? 'Billed annually ($191.90/yr · 20% off)' : 'Billed monthly ($19.99/mo)'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text)' }}>
              <div>[✓] Everything in Pro included</div>
              <div>[✓] Forward Portfolio Prediction & Monte Carlo stress testing</div>
              <div>[✓] Deterministic Financial Health & Quality audits</div>
              <div>[✓] Custom WACC and capital structure builder</div>
              <div>[✓] Dedicated valuation methodology support</div>
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('ultra')}
            className="btn btn-secondary"
            style={{ width: '100%', height: '44px', minHeight: '44px', marginTop: '24px', fontSize: '13px', fontWeight: 500 }}
          >
            {user?.plan === 'ultra' ? 'Current Tier' : 'Choose Ultra'}
          </button>
        </div>
      </div>
    </div>
  );
};
