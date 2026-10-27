import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface Ticket {
  id: string;
  userEmail: string;
  userName?: string | undefined;
  userPlan: string;
  category: string;
  symbol?: string | undefined;
  subject: string;
  message: string;
  status: 'assigned' | 'under_review' | 'resolved';
  slaHours: number;
  assignedAnalyst: string;
  createdAt: string;
  analystResponse?: string | undefined;
}

export const MethodologySupportPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const currentPlan = user?.plan || 'basic';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<string>('Terminal Growth & Exit Multiples');
  const [symbol, setSymbol] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets', {
        headers: {
          'x-hedger-plan': currentPlan,
          'x-hedger-user-id': user?.id || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentPlan, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hedger-plan': currentPlan,
          'x-hedger-user-id': user?.id || ''
        },
        body: JSON.stringify({
          category,
          symbol: symbol.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          email: user?.email || 'guest.allocator@hedger.capital',
          name: user?.name || 'Institutional Allocator',
          plan: currentPlan
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(prev => [data.ticket, ...prev]);
        setSubject('');
        setMessage('');
        setSymbol('');
        setSuccessMessage(`Ticket ${data.ticket.id} submitted successfully. Response guaranteed within <${data.ticket.slaHours} hours.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch {
      // Error handling
    } finally {
      setSubmitting(false);
    }
  };

  const getSlaBadge = () => {
    switch (currentPlan) {
      case 'ultra':
        return {
          title: 'Dedicated Senior Valuation Lead Desk',
          sla: '< 2 Hours Guaranteed SLA',
          color: '#22c55e',
          bg: 'rgba(34, 197, 94, 0.12)'
        };
      case 'pro':
        return {
          title: 'Priority Institutional Methodology Desk',
          sla: '< 6 Hours SLA',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)'
        };
      case 'plus':
        return {
          title: 'Standard Quantitative Support Desk',
          sla: '< 24 Hours SLA',
          color: '#eab308',
          bg: 'rgba(234, 179, 8, 0.12)'
        };
      default:
        return {
          title: 'Community Documentation Desk',
          sla: 'Standard Documentation Support',
          color: 'var(--text-muted)',
          bg: 'var(--surface)'
        };
    }
  };

  const slaInfo = getSlaBadge();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '40px 0 32px' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/models" style={{ color: 'inherit', textDecoration: 'none' }}>Valuation Models</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Methodology Advisory Desk</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: slaInfo.bg, color: slaInfo.color, border: '1px solid var(--border)' }}>
              {slaInfo.sla}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tier Desk: {slaInfo.title}
            </span>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Valuation Methodology Support & Advisory
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '820px', lineHeight: 1.5, margin: 0 }}>
            Direct quantitative advisory and mathematical reconciliation desk. Submit methodology questions on terminal value triangulation, capital structure optimization, or custom DCF assumptions.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
          {/* Submit New Ticket Form */}
          <div className="card" style={{ padding: '24px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                Submit Methodology Inquiry
              </h2>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: slaInfo.bg, color: slaInfo.color }}>
                {currentPlan.toUpperCase()} TIER
              </span>
            </div>

            {successMessage && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', fontSize: '12px', marginBottom: '16px' }}>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Methodology Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
                >
                  <option value="Terminal Growth & Exit Multiples">Terminal Growth & Exit Multiples</option>
                  <option value="Hamada Unlevering & Betas">Hamada Unlevering & Betas</option>
                  <option value="Banking Excess Returns Calibration">Banking Excess Returns Calibration</option>
                  <option value="Fiscal Year Alignment / FX Normalization">Fiscal Year Alignment / FX Normalization</option>
                  <option value="Custom DCF Model Audit">Custom DCF Model Audit</option>
                  <option value="General Valuation Inquiry">General Valuation Inquiry</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Target Ticker / Symbol (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NVDA, RELIANCE.NS, AAPL"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Guidance on perpetual growth rate vs sovereign GDP"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Inquiry Details
                </label>
                <textarea
                  rows={4}
                  placeholder="State the specific valuation assumptions, source filings, or mathematical parameters you want our quantitative desk to review..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--foreground)', fontSize: '13px', lineHeight: 1.4, resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', height: '40px', minHeight: '40px', fontSize: '13px', fontWeight: 600 }}
              >
                {submitting ? 'Submitting to Advisory Desk...' : `Dispatch Inquiry (${slaInfo.sla})`}
              </button>
            </form>
          </div>

          {/* Active Tickets & Desk Tracking */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                Active Desk Inquiries ({tickets.length})
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Live Institutional Dispatch
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="card"
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--card-bg, #09090b)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)' }}>
                          {t.id}
                        </span>
                        {t.symbol && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                            {t.symbol}
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {t.category}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', margin: '4px 0' }}>
                        {t.subject}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: t.status === 'resolved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: t.status === 'resolved' ? '#22c55e' : '#3b82f6',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                    {t.message}
                  </p>

                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Desk Response · {t.assignedAnalyst}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.4 }}>
                      {t.analystResponse}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Methodology Standards Banner */}
        <div style={{ marginTop: '48px', padding: '24px', borderRadius: '12px', backgroundColor: 'var(--card-bg, #09090b)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
            Institutional Valuation Standards & Governance
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            All answers provided by the Hedger Advisory Desk adhere strictly to published academic valuation literature. We cross-verify every parameter against audited 10-K, 20-F, and SEBI annual regulatory filings.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/models" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'underline' }}>
              Models Directory →
            </Link>
            <Link to="/models/capital-structure" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'underline' }}>
              Capital Structure Optimizer →
            </Link>
            <Link to="/provenance" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'underline' }}>
              Data Provenance →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
