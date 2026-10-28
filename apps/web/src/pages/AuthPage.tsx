import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { HedgerLogo } from '../components/HedgerLogo.js';
import { OAuthSandboxGateway } from '../components/OAuthSandboxGateway.js';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'signin' }) => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [mode, setMode] = useState<'signin' | 'signup'>(
    modeParam === 'signup' || initialMode === 'signup' ? 'signup' : 'signin'
  );

  const redirectParam = searchParams.get('redirect');
  const redirectTarget = redirectParam ? decodeURIComponent(redirectParam) : '/markets';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user, token, signInWithOAuth, signInWithEmail, signUpWithEmail } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();

  // Automatic redirect if already authenticated or if redirected from OAuth callback
  React.useEffect(() => {
    const hasAuthToken = Boolean(token || localStorage.getItem('hedger-token'));
    const isAuthSuccess = searchParams.get('auth_success') === '1';
    if (user || (hasAuthToken && isAuthSuccess)) {
      const dest = redirectTarget && !redirectTarget.includes('/signin') && !redirectTarget.includes('/signup')
        ? redirectTarget
        : '/markets';
      navigate(dest, { replace: true });
    }
  }, [user, token, searchParams, redirectTarget, navigate]);

  const handleOAuth = async (provider: 'google' | 'apple' | 'github') => {
    setError(null);
    setOauthLoading(provider);
    try {
      await signInWithOAuth(provider);
      navigate(redirectTarget);
    } catch (err: any) {
      setError(err.message || `Failed to authenticate with ${provider}`);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, name, password);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(redirectTarget);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        backgroundColor: isDark ? '#000000' : '#F9F9FB'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: isDark ? '#09090b' : '#FFFFFF',
          border: isDark ? '1px solid #27272a' : '1px solid #E5E5EA',
          borderRadius: '12px',
          padding: '32px 24px',
          boxShadow: isDark
            ? '0 24px 60px rgba(0, 0, 0, 0.85)'
            : '0 16px 40px rgba(0, 0, 0, 0.06)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <HedgerLogo size={32} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: isDark ? '#FFFFFF' : '#111827',
              margin: '0 0 6px 0'
            }}
          >
            WELCOME TO HEDGER
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? '#a1a1aa' : '#6B7280',
              margin: '0 0 12px 0',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            LET'S START
          </p>
          <p
            style={{
              fontSize: '13px',
              color: isDark ? '#71717a' : '#6B7280',
              margin: 0,
              lineHeight: 1.45
            }}
          >
            {mode === 'signup'
              ? 'Create your institutional account to proceed with valuation models.'
              : 'Sign in to access institutional valuation models, market data, and AI research.'}
          </p>
        </div>

        {/* Task Notification Banner if redirected */}
        {redirectParam && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #BFDBFE',
              color: isDark ? '#93c5fd' : '#1D4ED8',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: '16px'
            }}
          >
            Sign in or sign up to proceed with your valuation task.
          </div>
        )}

        {/* Segmented Mode Switcher (Sign In / Sign Up) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: isDark ? '#18181b' : '#F3F4F6',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '20px',
            border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mode === 'signin' ? (isDark ? '#27272a' : '#FFFFFF') : 'transparent',
              color: mode === 'signin' ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? '#a1a1aa' : '#6B7280'),
              boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: mode === 'signup' ? (isDark ? '#27272a' : '#FFFFFF') : 'transparent',
              color: mode === 'signup' ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? '#a1a1aa' : '#6B7280'),
              boxShadow: mode === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FCA5A5',
              color: isDark ? '#FCA5A5' : '#DC2626',
              fontSize: '12px',
              lineHeight: 1.4,
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        {/* OAuth Gateway (Google, Apple, GitHub) */}
        <div style={{ marginBottom: '20px' }}>
          <OAuthSandboxGateway
            onSuccess={() => navigate(redirectTarget)}
            subtitle="Sign in with Google, Apple, or GitHub to access and sync your research models and watchlists."
          />
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#27272a' : '#E5E5EA' }} />
          <span style={{ fontSize: '11px', color: isDark ? '#71717a' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            or continue with credentials
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: isDark ? '#27272a' : '#E5E5EA' }} />
        </div>

        {/* Email & Password Form — No pre-filled email or password */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="name-input"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDark ? '#d4d4d8' : '#374151',
                  marginBottom: '6px'
                }}
              >
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Institutional Analyst"
                required={mode === 'signup'}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                  border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
                  borderRadius: '6px',
                  color: isDark ? '#FFFFFF' : '#111827',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: isDark ? '#d4d4d8' : '#374151',
                marginBottom: '6px'
              }}
            >
              Institutional Email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
                borderRadius: '6px',
                color: isDark ? '#FFFFFF' : '#111827',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="password-input"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isDark ? '#d4d4d8' : '#374151'
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#a1a1aa' : '#6B7280',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
                borderRadius: '6px',
                color: isDark ? '#FFFFFF' : '#111827',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || oauthLoading !== null}
            style={{
              height: '44px',
              width: '100%',
              backgroundColor: isDark ? '#FFFFFF' : '#111827',
              color: isDark ? '#000000' : '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              marginTop: '8px',
              transition: 'opacity 0.15s ease'
            }}
            className="hover:opacity-90"
          >
            {loading
              ? 'Verifying...'
              : mode === 'signup'
              ? "Let's Start → Create Account"
              : "Let's Start →"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {mode === 'signup' ? (
            <p style={{ fontSize: '13px', color: isDark ? '#a1a1aa' : '#6B7280', margin: 0 }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#FFFFFF' : '#111827',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: isDark ? '#a1a1aa' : '#6B7280', margin: 0 }}>
              Don't have an institutional profile?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#FFFFFF' : '#111827',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Create Account
              </button>
            </p>
          )}
        </div>


        {/* Institutional Regulatory Footnote */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: isDark ? '1px solid #27272a' : '1px solid #E5E5EA',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '11px', color: isDark ? '#71717a' : '#9CA3AF', margin: 0, lineHeight: 1.4 }}>
            By continuing, you acknowledge Hedger&apos;s{' '}
            <Link to="/terms" style={{ color: isDark ? '#FFFFFF' : '#111827', textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: isDark ? '#FFFFFF' : '#111827', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            .
          </p>
          <p style={{ fontSize: '10px', color: isDark ? '#52525b' : '#9CA3AF', margin: '6px 0 0 0', lineHeight: 1.4 }}>
            Enterprise Single Sign-On and OAuth session tokens are cryptographically secured with PostgreSQL and Redis.
          </p>
        </div>
      </div>
    </div>
  );
};
