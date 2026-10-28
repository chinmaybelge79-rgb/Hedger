import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

interface PricingUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export const PricingUpgradeModal: React.FC<PricingUpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName = 'Custom DCF Simulation & Workbench',
  description = 'Advanced simulation sliders, Monte Carlo engines, and downloadable financial reports are reserved for Pro and Ultra subscribers.'
}) => {
  const navigate = useNavigate();
  const { updatePlan } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!isOpen) return null;

  const handleSelect = (plan: 'pro' | 'ultra') => {
    updatePlan(plan);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: isDark ? '#121215' : '#FFFFFF',
          border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 32px rgba(59, 130, 246, 0.15)'
            : '0 20px 48px rgba(0, 0, 0, 0.12)',
          color: isDark ? '#F4F4F5' : '#111827'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF',
              color: isDark ? '#93C5FD' : '#1D4ED8',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE'
            }}
          >
            Tier Upgrade Required
          </span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#71717A' : '#9CA3AF',
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px 0' }}>
          Unlock {featureName}
        </h2>
        <p style={{ fontSize: '13px', color: isDark ? '#A1A1AA' : '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {description} Basic Free tier includes canonical securities and delayed overviews. Upgrade to access live customizable assumptions and programmatic REST API limits.
        </p>

        {/* Upgrade Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          {/* Pro Tier */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: isDark ? '1px solid #3B82F6' : '1px solid #2563EB',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.05)' : '#F0F7FF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Pro</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#111827', margin: '6px 0' }}>
                $29 <span style={{ fontSize: '11px', fontWeight: 500, color: isDark ? '#A1A1AA' : '#6B7280' }}>/ month</span>
              </div>
              <ul style={{ margin: '12px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: isDark ? '#D4D4D8' : '#374151', lineHeight: 1.6 }}>
                <li>Custom DCF sliders & workbench</li>
                <li>1,000 monthly API fetches</li>
                <li>10 research report downloads</li>
                <li>Full Monte Carlo simulation</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelect('pro')}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Ultra Tier */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: isDark ? '1px solid #27272A' : '1px solid #E5E7EB',
              backgroundColor: isDark ? '#18181B' : '#F9FAFB',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>Ultra</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#111827', margin: '6px 0' }}>
                $79 <span style={{ fontSize: '11px', fontWeight: 500, color: isDark ? '#A1A1AA' : '#6B7280' }}>/ month</span>
              </div>
              <ul style={{ margin: '12px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: isDark ? '#D4D4D8' : '#374151', lineHeight: 1.6 }}>
                <li>5,000 monthly API fetches</li>
                <li>Unlimited DCF workbenches</li>
                <li>20 thesis document exports</li>
                <li>Priority NVIDIA NIM reasoning</li>
              </ul>
            </div>
            <button
              onClick={() => handleSelect('ultra')}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                backgroundColor: isDark ? '#27272A' : '#E5E7EB',
                color: isDark ? '#FFFFFF' : '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upgrade to Ultra
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: isDark ? '1px solid #27272A' : '1px solid #E5E7EB', fontSize: '12px' }}>
          <span style={{ color: isDark ? '#71717A' : '#9CA3AF' }}>Need institutional seat licensing?</span>
          <button
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isDark ? '#60A5FA' : '#2563EB',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            View Full Pricing Breakdown →
          </button>
        </div>
      </div>
    </div>
  );
};
