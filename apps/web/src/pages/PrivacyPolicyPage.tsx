import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
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
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}
          >
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Privacy Policy</span>
          </nav>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--foreground)',
              margin: '0 0 12px 0'
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              maxWidth: '780px',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            Effective Date: October 28, 2026 · Institutional Data Protections, Google API Limited Use Compliance, and User Privacy Rights for Hedger Terminal.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>

          {/* Section 1: Introduction */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              1. Introduction
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Hedger Terminal (&quot;Hedger&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an institutional equity research and valuation modeling platform. This Privacy Policy describes how we collect, use, store, and protect your information when you access or use our web application at <a href="https://hedger-beta.vercel.app" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>https://hedger-beta.vercel.app</a>, our APIs, and associated services.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              We are committed to maintaining institutional-grade privacy, zero third-party commercial tracking, and complete transparency regarding how your data is handled.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              2. Information We Collect
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              We collect only the minimum information necessary to authenticate your identity, persist your financial valuation models, and operate the platform securely:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px 0', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--foreground)' }}>OAuth Profile Data (Google, Apple, GitHub):</strong> When you sign in with Google, Apple, or GitHub, we receive basic account details authorized by you, including your name, email address, profile avatar URL, and provider-assigned user identifier.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Institutional Account Credentials:</strong> If you register directly with an email address and password, we store your email address, full name, and a cryptographically hashed, salted password representation. We never store plaintext passwords.
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Financial Valuation Models & Research:</strong> Parameters you choose to save, including Discounted Cash Flow (DCF) inputs, Weighted Average Cost of Capital (WACC), terminal growth rates, EBIT margins, scenario assumptions, investment thesis reports, and portfolio watchlist tickers.
              </li>
              <li>
                <strong style={{ color: 'var(--foreground)' }}>Technical & Session Telemetry:</strong> Essential session tokens (<code style={{ fontSize: '12px', backgroundColor: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px' }}>hedger_session</code>), IP addresses for rate limiting and fraud prevention, browser type, and diagnostic system timestamps.
              </li>
            </ul>
          </section>

          {/* Section 3: Google API Limited Use Disclosure */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--primary)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)'
                }}
              >
                Google Compliance
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                3. Google API Services User Data Policy & Limited Use
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Hedger&apos;s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Specifically:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '6px' }}>We request only basic identity scopes (<code style={{ fontSize: '12px', backgroundColor: 'var(--secondary)', padding: '2px 4px', borderRadius: '4px' }}>openid</code>, <code style={{ fontSize: '12px', backgroundColor: 'var(--secondary)', padding: '2px 4px', borderRadius: '4px' }}>email</code>, <code style={{ fontSize: '12px', backgroundColor: 'var(--secondary)', padding: '2px 4px', borderRadius: '4px' }}>profile</code>) to authenticate your user account.</li>
              <li style={{ marginBottom: '6px' }}>We do not use Google user data to serve advertisements or retarget users.</li>
              <li style={{ marginBottom: '6px' }}>We do not sell, rent, or transfer Google user data to third parties, data brokers, or advertising networks.</li>
              <li style={{ marginBottom: '6px' }}>We do not use Google user data to train or fine-tune generalized machine learning or artificial intelligence models.</li>
              <li>Humans do not read your Google user data unless you have given explicit consent for troubleshooting, or as required by law.</li>
            </ul>
          </section>

          {/* Section 4: How We Use Your Information */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              4. How We Use Your Information
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              We use collected information solely for the following operational purposes:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '6px' }}>Providing secure user authentication and persistent sessions across devices.</li>
              <li style={{ marginBottom: '6px' }}>Saving, calculating, and presenting your custom valuation models, DCF scenarios, and investment thesis documents.</li>
              <li style={{ marginBottom: '6px' }}>Managing your plan entitlements (Basic, Plus, Pro, Ultra) and monthly feature quotas.</li>
              <li style={{ marginBottom: '6px' }}>Generating downloadable research exports (DOCX, Excel, Sheets, Markdown, PDF) requested by you.</li>
              <li>Detecting, preventing, and addressing security anomalies, rate-limit violations, and unauthorized platform access.</li>
            </ul>
          </section>

          {/* Section 5: Data Sharing & Third-Party Services */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              5. Data Sharing & Third-Party Disclosures
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              <strong style={{ color: 'var(--foreground)' }}>Hedger does not sell, lease, or monetize your personal or financial research data.</strong>
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              We share data only with trusted infrastructure providers required to operate our service under confidentiality and security agreements:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Cloud Hosting:</strong> Vercel Inc. (serverless API execution and static edge asset delivery).</li>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Database:</strong> Managed PostgreSQL infrastructure (secure, encrypted storage for accounts and saved models).</li>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Identity Providers:</strong> Google, Apple, and GitHub (strictly for authentication handshakes at your explicit request).</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Legal Obligations:</strong> We may disclose information only if required by a valid subpoena, court order, or applicable legal process.</li>
            </ul>
          </section>

          {/* Section 6: Data Retention & Security */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              6. Data Retention, Storage & Security
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              All communications between your browser and Hedger Terminal are encrypted in transit using industry-standard TLS 1.3 / HTTPS. Session identifiers are stored in HTTP-only, secure cookies with strict <code style={{ fontSize: '12px', backgroundColor: 'var(--secondary)', padding: '2px 4px', borderRadius: '4px' }}>SameSite=Lax</code> policies to prevent cross-site scripting (XSS) and request forgery (CSRF).
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Your account details and saved research data remain stored in our encrypted database for as long as your account is active. If you delete your account or submit a deletion request, all associated models, watchlists, and OAuth tokens are permanently deleted from our active database systems.
            </p>
          </section>

          {/* Section 7: User Rights (GDPR & CCPA) */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              7. Your Privacy Rights & Data Deletion Requests
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Depending on your location, you have statutory rights under the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and applicable privacy frameworks:
            </p>
            <ul style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px 0', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Right of Access:</strong> You can request a complete copy of the personal data we hold about you.</li>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Right to Rectification:</strong> You can update or correct your profile details anytime via your account settings.</li>
              <li style={{ marginBottom: '6px' }}><strong style={{ color: 'var(--foreground)' }}>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may request permanent deletion of your account and all saved financial models.</li>
              <li><strong style={{ color: 'var(--foreground)' }}>Right to Revoke OAuth Access:</strong> You may revoke Hedger&apos;s access at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Google Account Security Settings</a>, Apple ID account settings, or GitHub application settings.</li>
            </ul>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              To exercise any of these rights, email us at <a href="mailto:privacy@hedger.capital" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>privacy@hedger.capital</a>. We respond to and process all verified requests within 30 calendar days.
            </p>
          </section>

          {/* Section 8: Children's Privacy */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              8. Children&apos;s Privacy
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              Hedger is an institutional equity analytics platform designed strictly for financial professionals, individual investors, and corporate users aged 18 and older. We do not knowingly collect or solicit personal information from children under 13 (or under 16 in certain jurisdictions). If we learn that we have inadvertently collected such data, we will immediately delete it.
            </p>
          </section>

          {/* Section 9: Contact Information */}
          <section
            style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--card-bg, #09090b)'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--foreground)' }}>
              9. Contact Us
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              If you have any questions, regulatory inquiries, or requests concerning this Privacy Policy, our data practices, or Google API compliance, please contact our Data Governance Officer:
            </p>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--foreground)', fontFamily: 'monospace' }}>
              <div>Hedger Analytics & Capital Terminal</div>
              <div>Attn: Data Privacy & Governance</div>
              <div>Email: <a href="mailto:privacy@hedger.capital" style={{ color: 'var(--primary)' }}>privacy@hedger.capital</a></div>
              <div>General Support: <a href="mailto:support@hedger.capital" style={{ color: 'var(--primary)' }}>support@hedger.capital</a></div>
              <div>Website: <a href="https://hedger-beta.vercel.app" style={{ color: 'var(--primary)' }}>https://hedger-beta.vercel.app</a></div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};
