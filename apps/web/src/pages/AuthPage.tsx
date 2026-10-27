import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { HedgerLogo } from '../components/HedgerLogo.js';

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

  const { signInWithOAuth, signInWithEmail, signUpWithEmail } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();

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

        {/* OAuth Gateway Buttons — 21st.dev Standard Icon Geometry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={oauthLoading !== null || loading}
            style={{
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              backgroundColor: isDark ? '#18181b' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: oauthLoading !== null ? 'wait' : 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            className="hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{oauthLoading === 'google' ? 'Authenticating...' : 'Continue with Google'}</span>
          </button>

          {/* Apple ID Sign In — 21st.dev Clean Apple Vector */}
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={oauthLoading !== null || loading}
            style={{
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              backgroundColor: isDark ? '#18181b' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: oauthLoading !== null ? 'wait' : 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            className="hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 7.02c.61-.74 1.03-1.77.92-2.81-.9.04-1.99.6-2.63 1.34-.57.65-.99 1.7-.87 2.71 1.01.08 1.97-.5 2.58-1.24z" />
            </svg>
            <span>{oauthLoading === 'apple' ? 'Authenticating...' : 'Continue with Apple'}</span>
          </button>

          {/* GitHub Sign In — 21st.dev Clean GitHub Vector */}
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={oauthLoading !== null || loading}
            style={{
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              backgroundColor: isDark ? '#18181b' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: oauthLoading !== null ? 'wait' : 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            className="hover:border-zinc-400 dark:hover:border-zinc-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>{oauthLoading === 'github' ? 'Authenticating...' : 'Continue with GitHub'}</span>
          </button>
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

        {/* Link to Administrative Portal */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', fontSize: '12px' }}>
          <Link to="/admin" style={{ color: isDark ? '#71717a' : '#9CA3AF', textDecoration: 'underline' }}>
            Administrative Portal
          </Link>
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
            Enterprise Single Sign-On and OAuth session tokens are cryptographically secured with PostgreSQL and Redis.
          </p>
        </div>
      </div>
    </div>
  );
};
