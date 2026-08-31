import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { Toggle } from '../ui/Toggle';
import { Avatar } from '../ui/Avatar';
import { Kbd } from '../ui/Kbd';
import { CommandPalette } from './CommandPalette';
import { Search, ChevronDown, Menu, X, Sun, Moon, BookOpen, User, Settings, LogIn, UserPlus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSearch } from '../../hooks/useSearch';

const NAV_ITEMS = [
  { path: '/models', label: 'Models' },
  { path: '/pricing', label: 'Pricing' },
];

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA'];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleDark, isReading, toggleReading } = useTheme();
  const { openCommandPalette } = useSearch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
      setProfileOpen(false);
    }
  }, [openCommandPalette]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current?.contains(e.target as Node)) return;
      setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const profileItems: DropdownItem[] = [
    { label: 'Sign in', value: 'signin', icon: <LogIn className="w-4 h-4" /> },
    { label: 'Create account', value: 'signup', icon: <UserPlus className="w-4 h-4" /> },
    { divider: true },
    { header: true, label: 'Appearance' },
    {
      label: isDark ? 'Light mode' : 'Dark mode',
      value: 'theme',
      icon: isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      onClick: () => toggleDark(),
    },
    {
      label: isReading ? 'Exit reading mode' : 'Reading mode',
      value: 'reading',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: () => toggleReading(),
    },
    { divider: true },
    { label: 'Settings', value: 'settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="nav border-b border-hairline sticky top-0 z-[20] bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="wrap nav-inner flex h-16 items-center justify-between gap-6">
        <Link to="/" className="logo flex items-center gap-2 -ml-4" aria-label="Hedger Home">
          <span className="text-[16px] font-extrabold tracking-widest text-ink">HEDGER</span>
        </Link>

        <nav className="nav-links hidden md:flex items-center gap-5" id="navLinks" role="navigation" aria-label="Main navigation">
          <div className="nav-search-bar flex items-center gap-2 border border-hairline rounded-[6px] px-3.5 py-1.5 bg-paper cursor-pointer transition-colors duration-normal flex-1 max-w-[400px]"
            onClick={() => openCommandPalette()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCommandPalette(); }}}
          >
            <Search className="w-4 h-4 text-ash flex-shrink-0" aria-hidden="true" />
            <span className="text-nav-link text-ash flex-1">Search any ticker...</span>
            <Kbd>⌘K</Kbd>
          </div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'text-nav-link uppercase tracking-wider font-semibold py-1 border-b border-transparent transition-colors duration-normal',
                location.pathname === item.path ? 'text-ink border-ink' : 'text-graphite hover:text-ink hover:border-ink'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <CommandPalette />

          <div className="hidden md:flex items-center gap-2 profile-wrap relative" ref={profileRef}>
            <Dropdown
              trigger={
                <button
                  className="profile-btn w-9 h-9 rounded-full border border-hairline bg-paper flex items-center justify-center text-ink transition-all duration-normal"
                  aria-label="Profile"
                  aria-haspopup="true"
                  aria-expanded={false}
                >
                  <User className="w-5 h-5" />
                </button>
              }
              items={profileItems}
              onSelect={() => {}}
              align="right"
            />
          </div>

          <button
            ref={hamburgerRef}
            className="hamburger md:hidden w-10 h-10 rounded-[6px] border border-hairline bg-paper flex items-center justify-center text-ink transition-colors duration-normal"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-hairline bg-paper px-6 py-4 animate-fadeIn">
          <div className="flex flex-col gap-4">
            <div className="nav-search-bar flex items-center gap-2 border border-hairline rounded-[6px] px-3.5 py-1.5 bg-paper cursor-pointer w-full"
              onClick={() => { openCommandPalette(); setMobileMenuOpen(false); }}
            >
              <Search className="w-4 h-4 text-ash flex-shrink-0" />
              <span className="text-nav-link text-ash flex-1">Search any ticker...</span>
              <Kbd>⌘K</Kbd>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'text-nav-link uppercase tracking-wider font-semibold py-2 border-b border-transparent',
                    location.pathname === item.path ? 'text-ink border-ink' : 'text-graphite'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}