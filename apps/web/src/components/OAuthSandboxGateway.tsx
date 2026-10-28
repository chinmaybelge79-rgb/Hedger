import React, { useState } from 'react';
import { useAuth, UserProfile } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

interface OAuthSandboxGatewayProps {
  onSuccess?: (user: UserProfile) => void;
  title?: string;
  subtitle?: string;
  actionReason?: string;
  compact?: boolean;
}

interface SandboxPersona {
  name: string;
  email: string;
  role: string;
  plan: 'pro' | 'ultra';
}

const PRESET_SANDBOX_PERSONAS: SandboxPersona[] = [
  {
    name: 'Alex Morgan',
    email: 'alex.researcher@gmail.com',
    role: 'Senior Equities Analyst',
    plan: 'pro'
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    role: 'Portfolio Manager',
    plan: 'pro'
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.quant@gmail.com',
    role: 'Quantitative Strategist',
    plan: 'ultra'
  }
];

export const OAuthSandboxGateway: React.FC<OAuthSandboxGatewayProps> = ({
  onSuccess,
  title,
  subtitle,
  actionReason,
  compact = false
}) => {
  const { signInWithOAuth } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showSandboxPicker, setShowSandboxPicker] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleProviderLogin = async (
    provider: 'google' | 'apple' | 'github',
    payload?: { email?: string; name?: string; sandbox?: boolean; plan?: 'pro' | 'ultra' }
  ) => {
    setError(null);
    setLoadingProvider(provider);
    try {
      const user = await signInWithOAuth(provider, payload);
      if (onSuccess && user) {
        onSuccess(user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to authenticate with ${provider}`;
      setError(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleCustomSandboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError('Please provide a sandbox email address.');
      return;
    }
    const cleanMail = customEmail.trim();
    const cleanName = customName.trim() || cleanMail.split('@')[0];
    await handleProviderLogin('google', {
      email: cleanMail,
      name: cleanName,
      sandbox: true,
      plan: 'pro'
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '8px' : '12px',
        width: '100%'
      }}
    >
      {/* Title & Subtitle if provided */}
      {(title || subtitle || actionReason) && (
        <div style={{ marginBottom: '4px', textAlign: 'center' }}>
          {title && (
            <h4
              style={{
                fontSize: compact ? '14px' : '16px',
                fontWeight: 600,
                color: 'var(--foreground)',
                margin: '0 0 4px 0'
              }}
            >
              {title}
            </h4>
          )}
          {actionReason && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: isDark ? '#93c5fd' : '#1D4ED8',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                padding: '6px 12px',
                borderRadius: '6px',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE',
                margin: '0 0 8px 0'
              }}
            >
              {actionReason}
            </p>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.45
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FCA5A5',
            color: isDark ? '#FCA5A5' : '#DC2626',
            fontSize: '12px',
            lineHeight: 1.4
          }}
        >
          {error}
        </div>
      )}

      {/* Primary Action 1: Google Login Sandbox */}
      <div
        style={{
          border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: isDark ? '#141416' : '#FAFAFC'
        }}
      >
        <button
          type="button"
          onClick={() =>
            handleProviderLogin('google', {
              email: 'alex.researcher@gmail.com',
              name: 'Alex Morgan',
              sandbox: true,
              plan: 'pro'
            })
          }
          disabled={loadingProvider !== null}
          style={{
            height: '44px',
            minHeight: '44px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            backgroundColor: isDark ? '#18181b' : '#FFFFFF',
            color: 'var(--foreground)',
            border: 'none',
            borderBottom: showSandboxPicker ? (isDark ? '1px solid #27272a' : '1px solid #E5E7EB') : 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loadingProvider !== null ? 'wait' : 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <span>
              {loadingProvider === 'google' ? 'Authenticating Sandbox...' : 'Google Login Sandbox'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
                color: isDark ? '#93c5fd' : '#1D4ED8',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid #BFDBFE'
              }}
            >
              SANDBOX
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSandboxPicker((prev) => !prev);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Select Google Sandbox Persona or Custom Account"
            >
              {showSandboxPicker ? 'Close' : 'Switch'}
            </button>
          </div>
        </button>

        {/* Expandable Google Sandbox Account Switcher */}
        {showSandboxPicker && (
          <div style={{ padding: '12px 14px', backgroundColor: isDark ? '#111113' : '#F4F4F6' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}
            >
              Choose Google Sandbox Persona
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {PRESET_SANDBOX_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() =>
                    handleProviderLogin('google', {
                      email: p.email,
                      name: p.name,
                      sandbox: true,
                      plan: p.plan
                    })
                  }
                  disabled={loadingProvider !== null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid #27272a' : '1px solid #E5E7EB',
                    backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {p.email} · {p.role}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)'
                    }}
                  >
                    {p.plan}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Google Sandbox Email input */}
            <form onSubmit={handleCustomSandboxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Or sign in with custom sandbox email:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="analyst@firm.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '6px',
                    border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
                    backgroundColor: isDark ? '#18181b' : '#FFFFFF',
                    color: 'var(--foreground)',
                    padding: '0 10px',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="submit"
                  disabled={loadingProvider !== null || !customEmail.trim()}
                  className="btn btn-secondary"
                  style={{
                    height: '36px',
                    minHeight: '36px',
                    padding: '0 12px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Use Custom
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Action 2: Apple Sign-In */}
      <button
        type="button"
        onClick={() =>
          handleProviderLogin('apple', {
            email: 'julian.thorne@privaterelay.appleid.com',
            name: 'Julian Thorne',
            plan: 'pro'
          })
        }
        disabled={loadingProvider !== null}
        style={{
          height: '44px',
          minHeight: '44px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          backgroundColor: isDark ? '#18181b' : '#FFFFFF',
          color: 'var(--foreground)',
          border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: loadingProvider !== null ? 'wait' : 'pointer',
          transition: 'background-color 0.15s ease, border-color 0.15s ease'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 7.02c.61-.74 1.03-1.77.92-2.81-.9.04-1.99.6-2.63 1.34-.57.65-.99 1.7-.87 2.71 1.01.08 1.97-.5 2.58-1.24z" />
        </svg>
        <span>{loadingProvider === 'apple' ? 'Authenticating Apple...' : 'Continue with Apple'}</span>
      </button>

      {/* Action 3: GitHub Sign-In */}
      <button
        type="button"
        onClick={() =>
          handleProviderLogin('github', {
            email: 'marcus.vance@hedger.capital',
            name: 'Marcus Vance',
            plan: 'pro'
          })
        }
        disabled={loadingProvider !== null}
        style={{
          height: '44px',
          minHeight: '44px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          backgroundColor: isDark ? '#18181b' : '#FFFFFF',
          color: 'var(--foreground)',
          border: isDark ? '1px solid #27272a' : '1px solid #D1D5DB',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: loadingProvider !== null ? 'wait' : 'pointer',
          transition: 'background-color 0.15s ease, border-color 0.15s ease'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
        <span>{loadingProvider === 'github' ? 'Authenticating GitHub...' : 'Continue with GitHub'}</span>
      </button>

      {/* Safety & Sync Notice */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.4,
          marginTop: '2px'
        }}
      >
        Instant verified sandbox session · Persists watchlists, research, and saved models
      </div>
    </div>
  );
};
