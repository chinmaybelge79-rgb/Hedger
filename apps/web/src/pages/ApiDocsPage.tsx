import React from 'react';
import { Link } from 'react-router-dom';

export const ApiDocsPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header Container */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '40px 0 32px'
        }}
      >
        <div className="page-container" style={{ paddingBlock: 0 }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>API Documentation</span>
          </nav>

          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Institutional REST API
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: 1.5, margin: 0 }}>
            High-performance, deterministic endpoints for quantitative equity research, fundamental ratio retrieval, and financial valuation execution.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '880px' }}>
          
          {/* Overview Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--foreground)' }}>
              Core Architecture & SLA
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              All responses are returned as strict deterministic JSON payloads. Sub-millisecond in-memory cache layers ensure rapid query resolution without synthetic drift.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Base URL</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>https://api.hedger.capital/v1</span>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Format</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>application/json</span>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Authentication</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--foreground)' }}>Bearer Token</span>
              </div>
            </div>
          </div>

          {/* Endpoint 1: Search */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>GET</span>
              <span style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)' }}>/api/instruments/search</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Multi-factor query searching 15,000+ securities across NSE, BSE, NASDAQ, NYSE, TSE, and HKEX with market-partitioning support.
            </p>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>// Request Example</div>
              <div style={{ color: 'var(--foreground)', marginBottom: '12px' }}>curl -X GET "https://api.hedger.capital/api/instruments/search?q=NVDA&market=all"</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>// Response Sample (200 OK)</div>
              <pre style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.4, overflowX: 'auto' }}>{`[
  {
    "symbol": "NVDA",
    "name": "NVIDIA Corporation",
    "exchange": "NASDAQ",
    "currency": "USD",
    "country": "United States",
    "sector": "Semiconductors",
    "marketCap": 5094050889728,
    "price": 210.96
  }
]`}</pre>
            </div>
          </div>

          {/* Endpoint 2: Company Overview */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>GET</span>
              <span style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)' }}>/api/instruments/:symbol/overview</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Retrieves live pricing, fundamental metrics, 52-week trading bounds, institutional multiples, and verified regulatory filing references.
            </p>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>// Request Example</div>
              <div style={{ color: 'var(--foreground)', marginBottom: '12px' }}>curl -X GET "https://api.hedger.capital/api/instruments/RELIANCE.NS/overview"</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>// Response Sample (200 OK)</div>
              <pre style={{ margin: 0, color: 'var(--foreground)', lineHeight: 1.4, overflowX: 'auto' }}>{`{
  "symbol": "RELIANCE.NS",
  "name": "Reliance Industries Limited",
  "exchange": "NSE",
  "currency": "INR",
  "price": 1190.0,
  "marketCap": 16103642435650,
  "peRatio": 21.45,
  "sharesOutstanding": 13532472635,
  "provenance": {
    "source": "NSE/BSE Quarterly Filings",
    "asOf": "2026-10-24T00:00:00.000Z"
  }
}`}</pre>
            </div>
          </div>

          {/* Endpoint 3: Screener */}
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>GET</span>
              <span style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)' }}>/api/screener</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Quantitative screening supporting compound filters across P/E ratios, market capitalization tiers, sectors, and regional market scopes.
            </p>
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>// Request Example</div>
              <div style={{ color: 'var(--foreground)' }}>curl -X GET "https://api.hedger.capital/api/screener?market=in&sector=Technology&minPe=10&maxPe=30"</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
