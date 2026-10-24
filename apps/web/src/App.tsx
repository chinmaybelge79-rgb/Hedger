import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { SearchModal } from './components/SearchModal.js';
import { LandingPage } from './pages/LandingPage.js';
import { MarketsPage } from './pages/MarketsPage.js';
import { CompanyPage } from './pages/CompanyPage.js';
import { ScreenerPage } from './pages/ScreenerPage.js';
import { SavedPage } from './pages/SavedPage.js';
import { DesignPage } from './pages/DesignPage.js';
import { ComparePage } from './pages/ComparePage.js';
import { ModelWorkbenchPage } from './pages/ModelWorkbenchPage.js';
import { PricingPage } from './pages/PricingPage.js';
import { ProfilePage } from './pages/ProfilePage.js';

export const App: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
          >
            <Navbar onOpenSearch={() => setSearchOpen(true)} />
            <main style={{ flex: '1 1 auto' }}>
              <Routes>
                <Route path="/" element={<LandingPage onOpenSearch={() => setSearchOpen(true)} />} />
                <Route path="/markets" element={<MarketsPage />} />
                <Route path="/company/:symbol" element={<CompanyPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/models/:model/:symbol" element={<ModelWorkbenchPage />} />
                <Route path="/models" element={<ModelWorkbenchPage />} />
                <Route path="/screener" element={<ScreenerPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/saved" element={<ProfilePage initialTab="saved" />} />
                <Route path="/design" element={<DesignPage />} />
                {/* Catch-all redirect to home */}
                <Route path="*" element={<LandingPage onOpenSearch={() => setSearchOpen(true)} />} />
              </Routes>
            </main>
            <Footer />
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
