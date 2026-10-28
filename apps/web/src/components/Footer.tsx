import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { HedgerLogo } from './HedgerLogo.js';
import { useTheme } from '../context/ThemeContext.js';

export const Footer: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <footer
      style={{
        borderTop: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border)',
        backgroundColor: isLanding ? (isDark ? '#000000' : '#FFFFFF') : 'var(--bg, #FFFFFF)',
        color: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.7)' : '#52525b') : 'inherit',
        marginTop: isLanding ? 0 : '64px',
        padding: '40px 0 48px'
      }}
    >
      <div
        className="page-container"
        style={{
          paddingBlock: 0,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HedgerLogo trimmed height={20} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: isLanding ? (isDark ? '#ffffff' : '#171717') : 'var(--text)' }}>
              Hedger Terminal
            </span>
          </div>
          <p style={{ fontSize: '12px', color: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-muted)') : 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.5, margin: '0 0 12px 0' }}>
            Independent institutional equity research and valuation terminal. Financial models are mathematical estimations, not investment advice. Audited fundamentals with zero fabricated figures.
          </p>

          {/* Direct Founder Channels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
            <a
              href="mailto:chinmaybelge79@gmail.com"
              title="Email Chinmay Belge"
              style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              className={isDark ? "hover:text-white" : "hover:text-black"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>chinmaybelge79@gmail.com</span>
            </a>

            <a
              href="https://github.com/ChinmayBelge79-rgb"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub: chinmaybelge79-rgb"
              style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              className={isDark ? "hover:text-white" : "hover:text-black"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/chinmay-belge-a10833357/"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn: Chinmay Belge"
              style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              className={isDark ? "hover:text-white" : "hover:text-black"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.63 1.63 0 1 0 0-3.26 1.63 1.63 0 0 0 0 3.26m1.4 9.74V9.96H5.06v8.54z" />
              </svg>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://x.com/ChinmayBelge"
              target="_blank"
              rel="noopener noreferrer"
              title="X: @ChinmayBelge"
              style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              className={isDark ? "hover:text-white" : "hover:text-black"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@ChinmayBelge</span>
            </a>

            <a
              href="https://instagram.com/fxchinmay"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram: @fxchinmay"
              style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              className={isDark ? "hover:text-white" : "hover:text-black"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>@fxchinmay</span>
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '12px', color: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.6)' : 'var(--text-muted)') : 'var(--text-muted)' }}>
          <Link
            to="/about"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            About
          </Link>
          <Link
            to="/pricing"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Pricing
          </Link>
          <Link
            to="/models"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Methodology
          </Link>
          <Link
            to="/support"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Advisory Desk
          </Link>
          <Link
            to="/provenance"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Data Provenance
          </Link>
          <Link
            to="/api-docs"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            API Documentation
          </Link>
          <Link
            to="/admin"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Admin Portal
          </Link>
          <Link
            to="/terms"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            style={{ color: 'inherit', textDecoration: 'none' }}
            className={isDark ? "hover:text-white transition-colors" : "hover:text-black transition-colors"}
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};
