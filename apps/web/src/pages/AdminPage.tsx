import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HedgerLogo } from '../components/HedgerLogo.js';

interface UserTelemetry {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'apple' | 'github' | 'email';
  avatar?: string | null;
  plan: 'basic' | 'plus' | 'pro' | 'ultra';
  createdAt: string;
  updatedAt: string;
  savedModelsCount: number;
  thesesGeneratedCount: number;
  thesesDownloadedCount: number;
  stockAnalysesCount: number;
  valuationVisitsCount: number;
  lastActive?: string | number | null;
}

interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string | null;
}

interface ActiveSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string | null;
}

interface SystemMetrics {
  totalUsers: number;
  planCounts: {
    ultra: number;
    pro: number;
    plus: number;
    basic: number;
  };
  activeSessionsCount: number;
  totalModelsSaved: number;
  totalThesesGenerated: number;
  totalDownloads: number;
}

export const AdminPage: React.FC = () => {
  // Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('hedger_admin_token');
    } catch {
      return null;
    }
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'sessions'>('users');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<UserTelemetry[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'ultra' | 'pro' | 'plus' | 'basic'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'email' | 'google' | 'github' | 'apple'>('all');

  // Verify Admin Session on Mount
  useEffect(() => {
    if (!adminToken) return;

    fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          setAdminToken(null);
          sessionStorage.removeItem('hedger_admin_token');
        }
      })
      .catch(() => {
        setAdminToken(null);
      });
  }, [adminToken]);

  // Load Dashboard Data when authenticated
  const loadDashboardData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [metricsRes, usersRes, logsRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/logs?limit=100', { headers }),
        fetch('/api/admin/sessions', { headers })
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m.metrics);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l.logs || []);
      }
      if (sessionsRes.ok) {
        const s = await sessionsRes.json();
        setSessions(s.sessions || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadDashboardData();
    }
  }, [adminToken]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication rejected');
        return;
      }

      setAdminToken(data.token);
      sessionStorage.setItem('hedger_admin_token', data.token);
    } catch {
      setLoginError('Network failure connecting to control plane');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    setAdminToken(null);
    sessionStorage.removeItem('hedger_admin_token');
  };

  // Upgrade or Degrade User Plan
  const handleUpdatePlan = async (userId: string, targetPlan: 'basic' | 'plus' | 'pro' | 'ultra', userName: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: targetPlan })
      });

      const data = await res.json();
      if (res.ok) {
        setActionFeedback(`Updated subscription for ${userName} to ${targetPlan.toUpperCase()}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, plan: targetPlan } : u))
        );
        setTimeout(() => setActionFeedback(null), 4000);
      } else {
        alert(data.error || 'Failed to update plan');
      }
    } catch {
      alert('Error updating user subscription');
    }
  };

  // Revoke Active Session
  const handleRevokeSession = async (token: string, userDesc: string) => {
    if (!adminToken) return;
    if (!confirm(`Revoke active session for ${userDesc}?`)) return;

    try {
      const res = await fetch(`/api/admin/sessions/${token}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.token !== token));
        setActionFeedback(`Session terminated successfully`);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      alert('Failed to revoke session');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPlan = planFilter === 'all' || u.plan === planFilter;
      const matchProvider = providerFilter === 'all' || u.provider === providerFilter;

      return matchSearch && matchPlan && matchProvider;
    });
  }, [users, searchQuery, planFilter, providerFilter]);

  // Color helper for plan badges
  const getPlanBadgeStyle = (plan: string): React.CSSProperties => {
    switch (plan) {
      case 'ultra':
        return {
          backgroundColor: 'rgba(217, 119, 6, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(217, 119, 6, 0.35)'
        };
      case 'pro':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.35)'
        };
      case 'plus':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.35)'
        };
      default:
        return {
          backgroundColor: 'rgba(161, 161, 170, 0.1)',
          color: '#a1a1aa',
          border: '1px solid var(--border)'
        };
    }
  };

  // ==========================================
  // VIEW A: ADMIN LOGIN GATEWAY
  // ==========================================
  if (!adminToken) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#f4f4f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px'
        }}
      >
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <HedgerLogo trimmed height={32} />
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#a1a1aa',
                marginTop: '16px',
                marginBottom: '6px'
              }}
            >
              Control Plane & Telemetry
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Administrative Portal
            </h1>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '8px 0 0 0', lineHeight: 1.5 }}>
              Enter privileged credentials to access user surveillance, telemetry steps, and subscription management.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '32px 24px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.7)'
            }}
          >
            {loginError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '20px'
                }}
              >
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#a1a1aa',
                    marginBottom: '6px'
                  }}
                >
                  Admin Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="GODDESS"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#a1a1aa',
                    marginBottom: '6px'
                  }}
                >
                  Admin Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s ease'
                }}
                className="hover:opacity-90"
              >
                {isLoggingIn ? 'Verifying Identity...' : 'Authenticate as GODDESS →'}
              </button>
            </form>

            {/* Quick Prefill Pill for Administrator Convenience */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #27272a', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setUsernameInput('GODDESS');
                  setPasswordInput('Live4Anusha$$');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                className="hover:text-zinc-300"
              >
                Auto-fill GODDESS Credentials
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/" style={{ color: '#71717a', fontSize: '12px', textDecoration: 'none' }} className="hover:text-white">
              ← Return to Hedger Terminal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', paddingBottom: '64px' }}>
      {/* Admin Top Command Header */}
      <header style={{ borderBottom: '1px solid #27272a', backgroundColor: '#121215', padding: '16px 0' }}>
        <div className="page-container" style={{ paddingBlock: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <HedgerLogo trimmed height={24} />
            </Link>
            <div style={{ borderLeft: '1px solid #27272a', paddingLeft: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
                HEDGER CONTROL PLANE
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Surveillance · Telemetry · Subscription Modification
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#34d399'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Superuser: GODDESS</span>
            </div>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              style={{
                padding: '6px 12px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#f4f4f5',
                fontSize: '12px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              className="hover:border-zinc-500"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
              className="hover:bg-red-950/40"
            >
              Exit Control Plane
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Banner */}
      {actionFeedback && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#10b981',
            color: '#000000',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          ✓ {actionFeedback}
        </div>
      )}

      <div className="page-container" style={{ paddingBlock: '32px' }}>
        {/* System Telemetry Metrics Cards */}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em' }}>
                Total Registered Users
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {metrics.totalUsers}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                PostgreSQL persistent accounts
              </div>
            </div>

            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em' }}>
                Ultra Subscriptions
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#fbbf24', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {metrics.planCounts.ultra}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                Unlimited thesis & export quota
              </div>
            </div>

            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em' }}>
                Pro & Plus Users
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#60a5fa', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {metrics.planCounts.pro + metrics.planCounts.plus}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                {metrics.planCounts.pro} Pro · {metrics.planCounts.plus} Plus
              </div>
            </div>

            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.04em' }}>
                Active Sessions
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#34d399', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                {metrics.activeSessionsCount}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                Redis / PostgreSQL cached tokens
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #27272a', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid #ffffff' : '2px solid transparent',
              color: activeTab === 'users' ? '#ffffff' : '#a1a1aa',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            User Surveillance & Subscriptions ({filteredUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '2px solid #ffffff' : '2px solid transparent',
              color: activeTab === 'logs' ? '#ffffff' : '#a1a1aa',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            User Steps & Audit Telemetry ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sessions' ? '2px solid #ffffff' : '2px solid transparent',
              color: activeTab === 'sessions' ? '#ffffff' : '#a1a1aa',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Live Active Sessions ({sessions.length})
          </button>
        </div>

        {/* ==========================================
            TAB 1: USERS & SUBSCRIPTION MANAGEMENT
           ========================================== */}
        {activeTab === 'users' && (
          <div>
            {/* Search and Filters Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter users by name, email, or ID..."
                  style={{
                    minWidth: '280px',
                    padding: '8px 12px',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Subscription Tiers</option>
                  <option value="ultra">Ultra Only</option>
                  <option value="pro">Pro Only</option>
                  <option value="plus">Plus Only</option>
                  <option value="basic">Basic Only</option>
                </select>

                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Auth Providers</option>
                  <option value="email">Email</option>
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                  <option value="apple">Apple</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: '#71717a' }}>
                Showing {filteredUsers.length} of {users.length} accounts
              </div>
            </div>

            {/* Users Table */}
            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#18181b', color: '#a1a1aa' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>User / Identifier</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email Address</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Auth Method</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Current Plan</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Modify Subscription (Upgrade/Degrade)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>AI Theses / Quota</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                        No user accounts match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #1c1c20' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>{u.id}</div>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#e4e4e7', fontFamily: 'monospace' }}>
                          {u.email}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#18181b',
                              border: '1px solid #27272a',
                              textTransform: 'uppercase',
                              color: '#a1a1aa'
                            }}
                          >
                            {u.provider}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              ...getPlanBadgeStyle(u.plan)
                            }}
                          >
                            {u.plan}
                          </span>
                        </td>

                        {/* Upgrade / Degrade Modifier Action Buttons */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'inline-flex', gap: '4px', backgroundColor: '#18181b', padding: '3px', borderRadius: '6px', border: '1px solid #27272a' }}>
                            {(['basic', 'plus', 'pro', 'ultra'] as const).map((tier) => {
                              const isActive = u.plan === tier;
                              return (
                                <button
                                  key={tier}
                                  onClick={() => handleUpdatePlan(u.id, tier, u.name)}
                                  disabled={isActive}
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: isActive ? 'default' : 'pointer',
                                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                                    color: isActive ? '#000000' : '#a1a1aa',
                                    transition: 'all 0.15s ease'
                                  }}
                                  className={!isActive ? "hover:text-white hover:bg-zinc-800" : undefined}
                                >
                                  {tier}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums', color: '#a1a1aa' }}>
                          <div>Generated: <span style={{ color: '#ffffff' }}>{u.thesesGeneratedCount}</span></div>
                          <div style={{ fontSize: '11px', color: '#71717a' }}>Downloads: {u.thesesDownloadedCount}</div>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#71717a', fontSize: '12px' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: USER STEPS & AUDIT TRAIL
           ========================================== */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '13px' }}>
              Granular surveillance trail recording user logins, subscription alterations, and platform interactions.
            </div>

            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#18181b', color: '#a1a1aa' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>User Identity</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Recorded Step / Action</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Step Details</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #1c1c20' }}>
                        <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleTimeString()} · {new Date(log.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>
                            {log.userName || (log.userId ? log.userId : 'Anonymous / System')}
                          </div>
                          {log.userEmail && (
                            <div style={{ fontSize: '11px', color: '#71717a' }}>{log.userEmail}</div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#18181b',
                              border: '1px solid #27272a',
                              color: log.action.includes('OVERRIDE') ? '#fbbf24' : '#60a5fa'
                            }}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#d4d4d8', fontFamily: 'monospace' }}>
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#71717a', fontSize: '12px', fontFamily: 'monospace' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: LIVE ACTIVE SESSIONS
           ========================================== */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ marginBottom: '16px', color: '#a1a1aa', fontSize: '13px' }}>
              Live authenticated session tokens currently active in Redis and PostgreSQL.
            </div>

            <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '10px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#18181b', color: '#a1a1aa' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Session Token Prefix</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>User Account</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tier</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Created</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client Details</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                        No active sessions found.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.token} style={{ borderBottom: '1px solid #1c1c20' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#a1a1aa' }}>
                          {s.token.substring(0, 16)}...
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{s.userName || 'Authorized User'}</div>
                          <div style={{ fontSize: '11px', color: '#71717a' }}>{s.userEmail || s.userId}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              ...getPlanBadgeStyle(s.userPlan || 'pro')
                            }}
                          >
                            {s.userPlan || 'PRO'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', color: '#71717a', fontSize: '12px' }}>
                          {new Date(s.createdAt).toLocaleTimeString()}
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#a1a1aa' }}>
                          <div>IP: {s.ipAddress || '127.0.0.1'}</div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleRevokeSession(s.token, s.userName || s.userEmail || 'User')}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '4px',
                              color: '#fca5a5',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            className="hover:bg-red-950/40"
                          >
                            Terminate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
