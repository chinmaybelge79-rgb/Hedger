import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HedgerLogo } from './HedgerLogo.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useMarket, getDefaultComparisonPair } from '../context/MarketContext.js';
import { AuthModal } from './AuthModal.js';
import { SettingsModal } from './SettingsModal.js';
import { getUserInitials } from '@hedger/format';

export const Navbar: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const displayName = isAuthenticated && user ? user.name : '';
  const displayEmail = isAuthenticated && user ? user.email : '';
  const userInitials = isAuthenticated && user ? getUserInitials(displayName, displayEmail) : '';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'dashboard' | 'prediction' | 'settings'>('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  const { activeMarket, setActiveMarket, marketConfig, allMarkets } = useMarket();
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const marketMenuRef = useRef<HTMLDivElement>(null);
  const profileHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleProfileMouseEnter = () => {
    if (profileHoverTimerRef.current) {
      clearTimeout(profileHoverTimerRef.current);
      profileHoverTimerRef.current = null;
    }
    setIsProfileHovered(true);
  };

  const handleProfileMouseLeave = () => {
    if (profileHoverTimerRef.current) {
      clearTimeout(profileHoverTimerRef.current);
    }
    profileHoverTimerRef.current = setTimeout(() => {
      setIsProfileHovered(false);
    }, 350);
  };

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Clean up all hover timers on unmount
  useEffect(() => {
    return () => {
      if (profileHoverTimerRef.current) clearTimeout(profileHoverTimerRef.current);
    };
  }, []);

  // Close profile and market dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (marketMenuRef.current && !marketMenuRef.current.contains(e.target as Node)) {
        setIsMarketOpen(false);
      }
    };
    if (profileMenuOpen || isMarketOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, isMarketOpen]);

  // Global ESC key listener for dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileMenuOpen) setProfileMenuOpen(false);
        if (isMarketOpen) setIsMarketOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileMenuOpen, isMarketOpen]);

  // Main navigation links: uncrowded, focused purely on research tools
  const navLinks = [
    { to: '/markets', label: 'Markets' },
    { to: '/screener', label: 'Screener' },
    { to: '/compare', label: 'Compare' },
    { to: '/models', label: 'Models' },
    { to: '/about', label: 'About' },
    { to: '/pricing', label: 'Pricing' }
  ];

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setProfileMenuOpen(false);
    navigate(`/${mode}`);
  };

  const handleOpenSettings = (tab: 'dashboard' | 'prediction' | 'settings') => {
    setProfileMenuOpen(false);
    setSettingsTab(tab);
    setSettingsModalOpen(true);
  };

  return (
    <>
      <header
        className={`nav-header ${isLanding ? 'nav-header-landing' : ''}`}
        style={
          isLanding
            ? {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 99999
              }
            : undefined
        }
      >
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
              marginLeft: '4px',
              height: '44px',
              flexShrink: 0
            }}
            className="hover:opacity-85 transition-opacity"
            title="Hedger — Homepage Landing"
          >
            <HedgerLogo trimmed height={24} />
            <span
              style={{
                fontWeight: 800,
                fontSize: '28px',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: isLanding ? (isDark ? '#ffffff' : '#000000') : 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              HEDGER
            </span>
          </Link>

          {/* Center Navigation Links (Clean & Tightened Spacing) */}
          <nav
            className="nav-links-list"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
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
                    color: isLanding
                      ? (isActive ? (isDark ? '#ffffff' : '#000000') : (isDark ? 'rgba(255, 255, 255, 0.75)' : '#333333'))
                      : (isActive ? 'var(--text)' : 'var(--text-muted)'),
                    fontWeight: isActive ? 600 : 500,
                    padding: '0 10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    borderRadius: '6px',
                    backgroundColor: isLanding && isActive ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)') : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: Expanded Circular Search, Market Selection Option at Right, Profile / Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, position: 'relative' }}>
            {/* Global Spotlight Search Bar (Circular Borders, Twice Length) */}
            <button
              onClick={onOpenSearch}
              className="nav-search-bar"
              style={{
                height: '38px',
                minHeight: '38px',
                width: '280px',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '9999px',
                backgroundColor: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') : 'var(--bg-subtle, #F9F9FB)',
                border: isLanding ? (isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)') : '1px solid var(--border, #E5E5EA)',
                color: isLanding ? (isDark ? '#ffffff' : '#18181B') : 'inherit',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title="Spotlight Search (⌘K)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }} aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="nav-search-label" style={{ fontSize: '12px', color: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.65)' : '#71717A') : 'var(--text-muted)', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Search instruments, models...
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: isLanding ? (isDark ? '#ffffff' : '#52525B') : 'var(--text-muted)',
                  backgroundColor: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.06)') : 'var(--card-bg, #FFFFFF)',
                  border: isLanding ? (isDark ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.12)') : '1px solid var(--border)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                ⌘K
              </span>
            </button>

            {/* Market Selection Option at Right Side of Search Bar */}
            <div
              ref={marketMenuRef}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              <button
                type="button"
                onClick={() => setIsMarketOpen((prev) => !prev)}
                style={{
                  height: '36px',
                  minHeight: '36px',
                  padding: '0 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  border: isLanding
                    ? (isDark
                        ? (isMarketOpen ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.18)')
                        : (isMarketOpen ? '1px solid rgba(0, 0, 0, 0.3)' : '1px solid rgba(0, 0, 0, 0.12)'))
                    : (isMarketOpen ? '1px solid var(--primary)' : '1px solid var(--border)'),
                  backgroundColor: isLanding
                    ? (isDark
                        ? (isMarketOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)')
                        : (isMarketOpen ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)'))
                    : (isMarketOpen ? 'var(--card)' : 'var(--bg-subtle, var(--secondary))'),
                  color: isLanding ? (isDark ? '#ffffff' : '#18181B') : 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  transition: 'all 0.15s ease'
                }}
                aria-label={`Active market: ${marketConfig.name}. Click to change market.`}
                aria-expanded={isMarketOpen}
              >
                <span style={{ fontWeight: 600, color: isLanding ? (isDark ? '#ffffff' : '#18181B') : 'var(--foreground)' }}>{marketConfig.shortName}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: marketConfig.isOpen ? '#22c55e' : (isDark ? '#71717a' : 'var(--text-muted)')
                  }}
                  title={marketConfig.status}
                />
                <span style={{ fontSize: '10px', color: isLanding ? (isDark ? 'rgba(255, 255, 255, 0.6)' : '#71717A') : 'var(--text-muted)', marginLeft: '2px' }}>▾</span>
              </button>

              {/* Click-triggered dropdown showing financial market scopes with live benchmark data */}
              {isMarketOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    paddingTop: '6px',
                    zIndex: 99999
                  }}
                >
                  <div
                    style={{
                      width: '300px',
                      backgroundColor: isLanding ? '#09090b' : 'var(--card)',
                      border: isLanding ? '1px solid #27272a' : '1px solid var(--border)',
                      borderRadius: '12px',
                      boxShadow: isLanding ? '0 24px 60px rgba(0, 0, 0, 0.95)' : '0 16px 40px rgba(0, 0, 0, 0.24)',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ paddingBottom: '6px', borderBottom: isLanding ? '1px solid #27272a' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isLanding ? '#ffffff' : 'var(--foreground)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Market Region
                      </div>
                      <span style={{ fontSize: '10px', color: isLanding ? '#a1a1aa' : 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {allMarkets.length} Scopes
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {allMarkets.map((m) => {
                        const isSelected = m.id === activeMarket;
                        const regionParam = m.id === 'in' ? 'india' : m.id === 'us' ? 'us' : m.id === 'eu' ? 'europe' : m.id === 'asia' ? 'asia' : 'all';
                        return (
                          <div
                            key={m.id}
                            data-testid={`market-option-${m.id}`}
                            onClick={() => {
                              setActiveMarket(m.id);
                              setIsMarketOpen(false);
                              if (location.pathname === '/markets') {
                                navigate(`/markets?region=${encodeURIComponent(m.name)}`);
                              } else if (location.pathname === '/screener') {
                                navigate(`/screener?region=${encodeURIComponent(regionParam)}`);
                              } else if (location.pathname === '/compare') {
                                const pair = getDefaultComparisonPair(m.id);
                                navigate(`/compare?a=${encodeURIComponent(pair.a)}&b=${encodeURIComponent(pair.b)}`);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? (isLanding ? '#18181b' : 'var(--secondary)') : 'transparent',
                              border: isSelected ? (isLanding ? '1px solid #3f3f46' : '1px solid var(--border)') : '1px solid transparent',
                              transition: 'background-color 0.12s ease'
                            }}
                            className={isLanding ? 'hover:bg-[#18181b]' : 'hover:bg-[var(--secondary)]'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: isLanding ? '#18181b' : 'var(--secondary)', color: isLanding ? '#ffffff' : 'var(--foreground)', border: isLanding ? '1px solid #27272a' : '1px solid var(--border)' }}>{m.code}</span>
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, color: isLanding ? '#ffffff' : 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{m.name}</span>
                                  {isSelected && (
                                    <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600 }}>Active</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '10px', color: isLanding ? '#71717a' : 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {m.primaryIndex}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: '11px', fontWeight: 600, color: isLanding ? '#ffffff' : 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>
                                {m.primaryIndexValue}
                              </div>
                              <div
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 500,
                                  color: m.isPositive ? '#22c55e' : '#ef4444',
                                  fontVariantNumeric: 'tabular-nums'
                                }}
                              >
                                {m.primaryIndexChange}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        paddingTop: '6px',
                        borderTop: isLanding ? '1px solid #27272a' : '1px solid var(--border)',
                        fontSize: '10px',
                        color: isLanding ? '#a1a1aa' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>Active: <strong style={{ color: isLanding ? '#ffffff' : 'var(--foreground)' }}>{marketConfig.name}</strong></span>
                      <Link
                        to="/markets"
                        onClick={() => setIsMarketOpen(false)}
                        style={{ color: isLanding ? '#ffffff' : 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        All Markets →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Unauthenticated Actions or Authenticated Profile Menu */}
            {!isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('signin')}
                  style={{
                    height: '36px',
                    minHeight: '36px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: isLanding ? (isDark ? '#ffffff' : '#18181b') : 'var(--text)',
                    border: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.15s ease'
                  }}
                  title="Sign In to Hedger"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('signup')}
                  className="nav-cta-btn btn btn-primary"
                  style={{
                    height: '36px',
                    minHeight: '36px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    backgroundColor: isDark ? '#ffffff' : '#000000',
                    color: isDark ? '#000000' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
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
              </div>
            ) : (
              /* Circular Profile Icon with User Initials: hover reveals quick menu, clicking opens full profile page */
              <div
                style={{ position: 'relative' }}
                ref={profileMenuRef}
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
              >
              <button
                type="button"
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
                onClick={() => {
                  setProfileMenuOpen(false);
                  setIsProfileHovered(false);
                  navigate('/profile');
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  minHeight: '36px',
                  minWidth: '36px',
                  borderRadius: '50%',
                  padding: 0,
                  border: isLanding
                    ? (isDark ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(0, 0, 0, 0.12)')
                    : ((profileMenuOpen || isProfileHovered) ? '2px solid var(--primary)' : '1px solid var(--border)'),
                  backgroundColor: isLanding
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : (isProfileHovered ? 'var(--card-bg, #FFFFFF)' : 'var(--secondary)'),
                  color: isLanding ? (isDark ? '#ffffff' : '#18181B') : 'var(--foreground)',
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
                  boxShadow: isLanding && (profileMenuOpen || isProfileHovered)
                    ? '0 0 0 2px rgba(255, 255, 255, 0.3)'
                    : ((profileMenuOpen || isProfileHovered) ? '0 0 0 2px var(--border)' : 'none')
                }}
                title={`Account & Settings (${userInitials}) · Click to open Profile`}
                aria-label={`Profile and Settings Menu for ${displayName}. Click to open profile.`}
                aria-expanded={profileMenuOpen || isProfileHovered}
              >
                {userInitials}
              </button>

              {/* Profile & Settings Dropdown Popover */}
              {(profileMenuOpen || isProfileHovered) && (
                <div
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    paddingTop: '6px',
                    zIndex: 99999
                  }}
                >
                  <div
                    style={{
                      width: '280px',
                      backgroundColor: isLanding ? (isDark ? '#09090b' : '#ffffff') : 'var(--card-bg, #FFFFFF)',
                      border: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border, #E5E5EA)',
                      borderRadius: '12px',
                      boxShadow: isLanding ? (isDark ? '0 24px 60px rgba(0, 0, 0, 0.95)' : '0 16px 40px rgba(0, 0, 0, 0.15)') : '0 16px 40px rgba(0, 0, 0, 0.20)',
                      padding: '16px',
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
                      borderBottom: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border)'
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
                      {(user?.plan || 'pro').toUpperCase()}
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
                  <div style={{ borderTop: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border)', paddingTop: '12px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isLanding ? (isDark ? '#a1a1aa' : '#71717a') : 'var(--text-muted)',
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
                        backgroundColor: isLanding ? (isDark ? '#18181b' : '#f4f4f5') : 'var(--bg-hover, #F2F2F5)',
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
                          backgroundColor: theme === 'light' ? (isLanding ? (isDark ? '#27272a' : '#ffffff') : 'var(--card-bg, #FFFFFF)') : 'transparent',
                          color: theme === 'light' ? (isLanding ? (isDark ? '#ffffff' : '#000000') : 'var(--text)') : (isLanding ? (isDark ? '#a1a1aa' : '#71717a') : 'var(--text-muted)'),
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
                          backgroundColor: theme === 'dark' ? (isLanding ? (isDark ? '#27272a' : '#ffffff') : 'var(--card-bg, #FFFFFF)') : 'transparent',
                          color: theme === 'dark' ? (isLanding ? (isDark ? '#ffffff' : '#000000') : 'var(--text)') : (isLanding ? (isDark ? '#a1a1aa' : '#71717a') : 'var(--text-muted)'),
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
                          backgroundColor: theme === 'system' ? (isLanding ? (isDark ? '#27272a' : '#ffffff') : 'var(--card-bg, #FFFFFF)') : 'transparent',
                          color: theme === 'system' ? (isLanding ? (isDark ? '#ffffff' : '#000000') : 'var(--text)') : (isLanding ? (isDark ? '#a1a1aa' : '#71717a') : 'var(--text-muted)'),
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
                        color: isLanding ? (isDark ? '#ffffff' : '#18181b') : 'var(--text)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      className={isLanding ? (isDark ? "hover:bg-[#18181b] transition-colors" : "hover:bg-[#f4f4f5] transition-colors") : "hover:bg-[var(--bg-hover,#F2F2F5)] transition-colors"}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Terminal Preferences</span>
                    </button>
                  </div>

                  {/* Sign Out / Sign In */}
                  <div style={{ borderTop: isLanding ? (isDark ? '1px solid #27272a' : '1px solid #e4e4e7') : '1px solid var(--border)', paddingTop: '10px' }}>
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
                          style={{
                            flex: 1,
                            height: '44px',
                            minHeight: '44px',
                            fontSize: '12px',
                            backgroundColor: isLanding ? '#18181b' : undefined,
                            borderColor: isLanding ? '#27272a' : undefined,
                            color: isLanding ? '#ffffff' : undefined
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => handleOpenAuth('signup')}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            height: '44px',
                            minHeight: '44px',
                            fontSize: '12px',
                            backgroundColor: isLanding ? '#ffffff' : undefined,
                            color: isLanding ? '#000000' : undefined,
                            fontWeight: 600
                          }}
                        >
                          Sign Up
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
            )}
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
