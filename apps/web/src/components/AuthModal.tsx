import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { HedgerLogo } from './HedgerLogo.js';
import { OAuthSandboxGateway } from './OAuthSandboxGateway.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithOAuth, signInWithEmail, signUpWithEmail } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [isOpen, initialMode]);

  // Global ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOAuth = async (provider: 'google' | 'apple' | 'github') => {
    setLoading(true);
    try {
      await signInWithOAuth(provider);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, name, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account Authentication"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '420px',
          backgroundColor: 'var(--card-bg, #FFFFFF)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.16)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          padding: '32px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <HedgerLogo size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
            {mode === 'signin' ? 'Sign in to Hedger Terminal' : 'Create your Hedger Account'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Institutional equity research, valuation, and peer analysis
          </p>
        </div>

        {/* OAuth Buttons (Google Sandbox, Apple, GitHub) */}
        <div style={{ marginBottom: '20px' }}>
          <OAuthSandboxGateway
            onSuccess={onClose}
            subtitle="Sign in with Google Sandbox, Apple, or GitHub to save your models, watchlists, and research data."
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg, #FFFFFF)',
                  padding: '0 12px',
                  fontSize: '13px',
                  color: 'var(--text)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="allocator@firm.com"
              required
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg, #FFFFFF)',
                padding: '0 12px',
                fontSize: '13px',
                color: 'var(--text)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg, #FFFFFF)',
                padding: '0 12px',
                fontSize: '13px',
                color: 'var(--text)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '44px',
              minHeight: '44px',
              width: '100%',
              borderRadius: '8px',
              backgroundColor: 'var(--accent, #1D1D1F)',
              color: 'var(--bg, #FFFFFF)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'opacity 0.15s ease'
            }}
            className="hover:opacity-90"
          >
            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Free Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Footnote */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          By continuing, you agree to Hedger's Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};
