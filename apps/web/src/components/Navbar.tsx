import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HedgerLogo } from './HedgerLogo.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { AuthModal } from './AuthModal.js';
import { SettingsModal } from './SettingsModal.js';
import { getUserInitials } from '@hedger/format';

export const Navbar: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const displayName = isAuthenticated && user ? user.name : 'Alex Morgan';
  const displayEmail = isAuthenticated && user ? user.email : 'alex.morgan@hedger.capital';
  const userInitials = getUserInitials(displayName, displayEmail);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'dashboard' | 'prediction' | 'settings'>('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Global ESC key listener for dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && profileMenuOpen) {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileMenuOpen]);

  // Main navigation links: uncrowded, focused purely on research tools
  const navLinks = [
    { to: '/markets', label: 'Markets' },
    { to: '/screener', label: 'Screener' },
    { to: '/compare', label: 'Compare' },
    { to: '/models', label: 'Models' },
    { to: '/pricing', label: 'Pricing' }
  ];

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setProfileMenuOpen(false);
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenSettings = (tab: 'dashboard' | 'prediction' | 'settings') => {
    setProfileMenuOpen(false);
    setSettingsTab(tab);
    setSettingsModalOpen(true);
  };

  return (
    <>
      <header className="nav-header">
        <div className="nav-container">
          {/* Brand Logo & Name: professional lockup with increased gap and balanced placement */}
          <Link
            to="/"
            onClick={() => setProfileMenuOpen(false)}
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              height: '44px',
              flexShrink: 0
            }}
            className="hover:opacity-85 transition-opacity"
            title="Hedger — Homepage Landing"
          >
            <HedgerLogo trimmed height={28} />
            <span
              style={{
                fontWeight: 500,
                fontSize: '26px',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              Hedger
            </span>
          </Link>

          {/* Center Navigation Links (Clean & Uncrowded) */}
          <nav
            className="nav-links-list"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px'
            }}
          >
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-item-link ${isActive ? 'active' : ''}`}
                  style={{
                    height: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: isActive ? 500 : 400,
                    padding: '0 8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: Search, Sign Up, Circular Profile Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, position: 'relative' }}>
            {/* Global Spotlight Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="btn btn-secondary"
              style={{
                height: '44px',
                minHeight: '44px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle, #F9F9FB)',
                borderColor: 'var(--border, #E5E5EA)',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Spotlight Search (⌘K)"
            >
              <span className="nav-search-label" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                Search
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--card-bg, #FFFFFF)',
                  border: '1px solid var(--border)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                ⌘K
              </span>
            </button>

            {/* Call to Action: Single narrow Get Started button */}
            {!isAuthenticated && (
              <button
                onClick={() => handleOpenAuth('signup')}
                className="btn btn-primary"
                style={{
                  height: '36px',
                  minHeight: '36px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent, #1D1D1F)',
                  color: 'var(--bg, #FFFFFF)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  letterSpacing: '-0.01em',
                  transition: 'opacity 0.15s ease, transform 0.15s ease'
                }}
                title="Get Started with Hedger"
              >
                Get Started
              </button>
            )}

            {/* Circular Profile Icon with User Initials: only appears on hover + click */}
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                type="button"
                onMouseEnter={() => setIsProfileHovered(true)}
                onMouseLeave={() => setIsProfileHovered(false)}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                style={{
                  width: '36px',
                  height: '36px',
                  minHeight: '36px',
                  minWidth: '36px',
                  borderRadius: '50%',
                  padding: 0,
                  border: profileMenuOpen
                    ? '2px solid var(--primary)'
                    : isProfileHovered
                    ? '1px solid var(--primary)'
                    : '1px solid var(--border)',
                  backgroundColor: isProfileHovered ? 'var(--card-bg, #FFFFFF)' : 'var(--secondary)',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  userSelect: 'none',
                  transition: 'transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
                  transform: isProfileHovered ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: profileMenuOpen
                    ? '0 0 0 2px var(--border)'
                    : isProfileHovered
                    ? '0 2px 8px rgba(0, 0, 0, 0.08)'
                    : 'none'
                }}
                title={`Account & Settings (${userInitials})`}
                aria-label={`Profile and Settings Menu for ${displayName}`}
                aria-expanded={profileMenuOpen}
              >
                {userInitials}
              </button>

              {/* Profile & Settings Dropdown Popover */}
              {profileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: '0',
                    width: '280px',
                    backgroundColor: 'var(--card-bg, #FFFFFF)',
                    border: '1px solid var(--border, #E5E5EA)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
                    padding: '16px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* User Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--secondary)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        userSelect: 'none',
                        flexShrink: 0
                      }}
                    >
                      {userInitials}
                    </div>
                    <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {isAuthenticated && user ? user.name : 'Alex Morgan'}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {isAuthenticated && user ? user.email : 'alex.morgan@hedger.capital'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        backgroundColor: 'var(--accent, #1D1D1F)',
                        color: 'var(--bg, #FFFFFF)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {user?.plan || 'PRO'}
                    </span>
                  </div>

                  {/* Navigation Hub */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile?tab=dashboard');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: 'var(--text)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      className="hover:bg-[var(--bg-hover,#F2F2F5)] transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>Dashboard & Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile?tab=watchlist');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: 'var(--text)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      className="hover:bg-[var(--bg-hover,#F2F2F5)] transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Active Watchlist</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile?tab=saved');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: 'var(--text)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      className="hover:bg-[var(--bg-hover,#F2F2F5)] transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 2 2h12a2 2 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Saved Valuation Models</span>
                    </button>
                  </div>

                  {/* Settings & Appearance (Inside the profile icon as requested) */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
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
                      Appearance & Settings
                    </div>

                    {/* Quick Light / Dark / System Mode Switcher */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '4px',
                        backgroundColor: 'var(--bg-hover, #F2F2F5)',
                        padding: '3px',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <button
                        onClick={() => setTheme('light')}
                        style={{
                          height: '28px',
                          fontSize: '11px',
                          fontWeight: theme === 'light' ? 600 : 400,
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: theme === 'light' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                          color: theme === 'light' ? 'var(--text)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: theme === 'light' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                      >
                        Light
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        style={{
                          height: '28px',
                          fontSize: '11px',
                          fontWeight: theme === 'dark' ? 600 : 400,
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: theme === 'dark' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                          color: theme === 'dark' ? 'var(--text)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: theme === 'dark' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setTheme('system')}
                        style={{
                          height: '28px',
                          fontSize: '11px',
                          fontWeight: theme === 'system' ? 600 : 400,
                          borderRadius: '5px',
                          border: 'none',
                          backgroundColor: theme === 'system' ? 'var(--card-bg, #FFFFFF)' : 'transparent',
                          color: theme === 'system' ? 'var(--text)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: theme === 'system' ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                      >
                        System
                      </button>
                    </div>

                    {/* Terminal Preferences Link */}
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/profile?tab=settings');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: 'var(--text)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      className="hover:bg-[var(--bg-hover,#F2F2F5)] transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Terminal Preferences</span>
                    </button>
                  </div>

                  {/* Sign Out / Sign In */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    {isAuthenticated && user ? (
                      <button
                        onClick={() => {
                          signOut();
                          setProfileMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: 'var(--negative)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          fontWeight: 500
                        }}
                        className="hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenAuth('signin')}
                          className="btn btn-secondary"
                          style={{ flex: 1, height: '36px', fontSize: '12px' }}
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => handleOpenAuth('signup')}
                          className="btn btn-primary"
                          style={{ flex: 1, height: '36px', fontSize: '12px' }}
                        >
                          Sign Up
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      {/* Settings Modal (User Dashboard, Portfolio Prediction, Website Settings) */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
        initialTab={settingsTab}
      />
    </>
  );
};
