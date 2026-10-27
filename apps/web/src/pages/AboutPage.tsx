import React from 'react';
import { Link } from 'react-router-dom';

interface SocialChannel {
  id: string;
  name: string;
  handle: string;
  href: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

export const AboutPage: React.FC = () => {
  const EmailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const GithubIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );

  const LinkedinIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.26 1.63 1.63 0 0 0 0 3.26m1.4 9.74V9.96H5.06v8.54z" />
    </svg>
  );

  const XIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const InstagramIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );

  const channels: SocialChannel[] = [
    {
      id: 'email',
      name: 'Direct Email',
      handle: 'chinmaybelge79@gmail.com',
      href: 'mailto:chinmaybelge79@gmail.com',
      badge: 'Primary Contact',
      description: 'Institutional research inquiries, feedback, and allocator collaboration.',
      icon: <EmailIcon />
    },
    {
      id: 'github',
      name: 'GitHub',
      handle: 'chinmaybelge79-rgb',
      href: 'https://github.com/ChinmayBelge79-rgb',
      badge: 'Open Source',
      description: 'Quantitative valuation engines, financial math, and platform architecture.',
      icon: <GithubIcon />
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      handle: 'in/chinmay-belge-a10833357',
      href: 'https://www.linkedin.com/in/chinmay-belge-a10833357/',
      badge: 'Professional',
      description: 'Career background, software engineering, and corporate finance networks.',
      icon: <LinkedinIcon />
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      handle: '@ChinmayBelge',
      href: 'https://x.com/ChinmayBelge',
      badge: 'Research & Macro',
      description: 'Real-time equity market thoughts, DCF insights, and valuation teardowns.',
      icon: <XIcon />
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: 'fxchinmay',
      href: 'https://instagram.com/fxchinmay',
      badge: 'Trading & Lifestyle',
      description: 'Discretionary market participation, discipline, martial arts, and building.',
      icon: <InstagramIcon />
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Navigation Breadcrumb */}
      <div className="page-container" style={{ paddingTop: '24px', paddingBottom: 0 }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>About the Founder</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section style={{ padding: '64px 0 48px' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <div style={{ maxWidth: '880px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}
            >
              Hedger Valuation · Founder Profile
            </div>

            <h1 className="founder-name" style={{ margin: '0 0 16px 0' }}>
              CHINMAY BELGE
            </h1>

            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--foreground)',
                letterSpacing: '-0.01em',
                marginBottom: '12px'
              }}
            >
              Founder & Creator, Hedger Valuation
            </div>

            <p
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                lineHeight: 1.4,
                letterSpacing: '-0.015em',
                margin: '0 0 24px 0'
              }}
            >
              Building a more rigorous approach to equity research and valuation.
            </p>

            {/* Quick Contact Badges Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {channels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.href}
                  target={ch.id === 'email' ? undefined : '_blank'}
                  rel={ch.id === 'email' ? undefined : 'noopener noreferrer'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                  className="hover:border-foreground/40 hover:bg-zinc-800/20"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                    {ch.icon}
                  </span>
                  <span>{ch.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Thin Divider */}
      <div className="page-container" style={{ paddingBlock: 0 }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
      </div>

      {/* Introduction Section */}
      <section style={{ padding: '48px 0' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', lineHeight: 1.7, color: 'var(--text)' }}>
            <p style={{ margin: 0 }}>
              I am an independent builder focused on fundamental equity research, corporate valuation, and financial markets. My work combines financial analysis, valuation methodologies, and technology to explore how businesses create value and how investors can make more informed decisions.
            </p>

            <p style={{ margin: 0 }}>
              Through Hedger Valuation, I am building an equity research platform designed to make institutional-style valuation more transparent, systematic, and accessible. The platform brings together discounted cash flow analysis, relative valuation, financial statement analysis, and scenario modelling within a unified research environment.
            </p>

            <p style={{ margin: 0 }}>
              My approach is grounded in analytical discipline, transparent assumptions, and independent thinking. I believe valuation should go beyond a single estimate of intrinsic value, presenting investors with a range of potential outcomes, the assumptions driving them, and the risks that could influence the investment thesis.
            </p>

            <p style={{ margin: 0 }}>
              With a background in computer science, an independent focus on finance, and over two years of self-directed market participation, I am working to bridge financial research and technology through tools built for clarity, precision, and usability.
            </p>

            <div
              style={{
                padding: '16px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                fontWeight: 600,
                color: 'var(--foreground)'
              }}
            >
              My objective: To make rigorous equity valuation more transparent and useful for investors.
            </div>
          </div>
        </div>
      </section>

      {/* Investment Philosophy (3 Columns) */}
      <section style={{ padding: '48px 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Core Principles
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)', marginTop: '4px' }}>
              Investment Philosophy
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
            <div style={{ borderLeft: '2px solid #b38a3e', paddingLeft: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: '8px' }}>
                FUNDAMENTAL THINKING
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                Understand businesses beyond their market prices. Analyze capital allocation, unit economics, return on invested capital, and structural competitive advantages.
              </p>
            </div>

            <div style={{ borderLeft: '2px solid #b38a3e', paddingLeft: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: '8px' }}>
                TRANSPARENT VALUATION
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                Make assumptions, calculations, and risks visible. Eliminate black-box formulas so every intrinsic value estimate is mathematically traceable to its source driver.
              </p>
            </div>

            <div style={{ borderLeft: '2px solid #b38a3e', paddingLeft: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--foreground)', marginBottom: '8px' }}>
                INDEPENDENT RESEARCH
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                Build a disciplined, evidence-driven approach to equity research. Avoid arbitrary Buy/Sell labels and present rigorous scenario ranges with explicit risk/reward skew.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Focus & Academic Foundation */}
      <section style={{ padding: '48px 0' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <div style={{ maxWidth: '820px' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Active Initiative
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)', marginTop: '4px' }}>
                Current Focus: Building Hedger Valuation
              </h2>
            </div>

            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text)', margin: '0 0 24px 0' }}>
              Developing a multi-method equity valuation platform for Indian and global markets, combining fundamental research, financial modelling, and intuitive research tools.
            </p>

            {/* Technical & Academic Background Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '32px' }}>
              <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Academic Foundation
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                  Jain University, Bengaluru
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  B.Tech in Computer Science & Engineering (Software Engineering) · CGPA: 8.8 / 10
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                  <strong>Coursework:</strong> Probability & Random Variables, Statistical Inference, Regression & Correlation Analysis, Sampling Theory, Financial Accounting, Corporate Finance, Equity Valuation.
                </div>
              </div>

              <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Market & Engineering Expertise
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                  Independent Market Participant (2+ Years)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Discretionary Trading, Price Action & Risk Control
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-muted)' }}>
                  <strong>Technical Stack:</strong> Multi-Stage FCFF DCF, Reverse DCF, CAPM / WACC, Hamada Re-levering, Monte Carlo Simulations, Altman Z & Piotroski F Scoring, TypeScript, Python, Node.js, PostgreSQL.
                </div>
              </div>
            </div>

            {/* Experience & Certifications */}
            <div style={{ marginTop: '24px', padding: '20px 24px', borderRadius: '12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  JPMorgan Chase Software Engineering Simulation (Forage) & Elite Finance Training
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Engineering high-performance deterministic financial software for institutional asset allocators.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Channels Grid Section */}
      <section style={{ padding: '48px 0 64px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="page-container" style={{ paddingBlock: 0 }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Direct Correspondence
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)', marginTop: '4px' }}>
              Connect with Chinmay Belge
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '640px', lineHeight: 1.5, margin: '8px 0 0 0' }}>
              Reach out directly for institutional collaboration, equity research methodology discussions, or technical inquiries.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px'
            }}
          >
            {channels.map((ch) => (
              <a
                key={ch.id}
                href={ch.href}
                target={ch.id === 'email' ? undefined : '_blank'}
                rel={ch.id === 'email' ? undefined : 'noopener noreferrer'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--card-bg, #09090b)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease'
                }}
                className="hover:border-foreground/40 hover:bg-zinc-800/10"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--foreground)'
                      }}
                    >
                      {ch.icon}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {ch.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
                    {ch.name}
                  </h3>
                  <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--foreground)', fontWeight: 500, marginBottom: '8px' }}>
                    {ch.handle}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                    {ch.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <span>Connect</span>
                  <span>→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Navigation Bar */}
      <section style={{ padding: '32px 0 64px', borderTop: '1px solid var(--border)' }}>
        <div className="page-container" style={{ paddingBlock: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div>
            Bengaluru, India · <a href="mailto:chinmaybelge79@gmail.com" style={{ color: 'var(--foreground)', textDecoration: 'underline' }}>chinmaybelge79@gmail.com</a>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/models" style={{ color: 'inherit', textDecoration: 'none' }}>Valuation Models</Link>
            <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing & Membership</Link>
            <Link to="/support" style={{ color: 'inherit', textDecoration: 'none' }}>Methodology Support</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
