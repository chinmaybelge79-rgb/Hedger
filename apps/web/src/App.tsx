import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { MarketProvider } from './context/MarketContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { SearchModal } from './components/SearchModal.js';
import { AiChatbotDrawer } from './components/AiChatbotDrawer.js';
import { LandingPage } from './pages/LandingPage.js';
import { MarketsPage } from './pages/MarketsPage.js';
import { CompanyPage } from './pages/CompanyPage.js';
import { InvestmentThesisPage } from './pages/InvestmentThesisPage.js';
import { ScreenerPage } from './pages/ScreenerPage.js';
import { SavedPage } from './pages/SavedPage.js';
import { DesignPage } from './pages/DesignPage.js';
import { ComparePage } from './pages/ComparePage.js';
import { ModelWorkbenchPage } from './pages/ModelWorkbenchPage.js';
import { ModelsDirectoryPage } from './pages/ModelsDirectoryPage.js';
import { PricingPage } from './pages/PricingPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { ProvenancePage } from './pages/ProvenancePage.js';
import { ApiDocsPage } from './pages/ApiDocsPage.js';
import { TermsPage } from './pages/TermsPage.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { CapitalStructurePage } from './pages/CapitalStructurePage.js';
import { MethodologySupportPage } from './pages/MethodologySupportPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { ApplicationLockGate } from './components/ApplicationLockGate.js';

const AppShell: React.FC<{ searchOpen: boolean; setSearchOpen: (open: boolean) => void }> = ({
  searchOpen,
  setSearchOpen
}) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isLanding ? (isDark ? '#000000' : '#FFFFFF') : 'var(--bg)',
        color: isLanding ? (isDark ? '#FFFFFF' : '#171717') : 'var(--text)',
        transition: 'background-color 0.15s ease, color 0.15s ease'
      }}
    >
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main style={{ flex: '1 1 auto' }}>
        <Routes>
          <Route path="/" element={<LandingPage onOpenSearch={() => setSearchOpen(true)} />} />
          <Route path="/markets" element={<ApplicationLockGate><MarketsPage /></ApplicationLockGate>} />
          <Route path="/company/:symbol" element={<ApplicationLockGate><CompanyPage /></ApplicationLockGate>} />
          <Route path="/company/:symbol/thesis" element={<ApplicationLockGate><InvestmentThesisPage /></ApplicationLockGate>} />
          <Route path="/thesis/:symbol" element={<ApplicationLockGate><InvestmentThesisPage /></ApplicationLockGate>} />
          <Route path="/compare" element={<ApplicationLockGate><ComparePage /></ApplicationLockGate>} />
          <Route path="/models" element={<ApplicationLockGate><ModelsDirectoryPage /></ApplicationLockGate>} />
          <Route path="/models/:model/:symbol" element={<ApplicationLockGate><ModelWorkbenchPage /></ApplicationLockGate>} />
          <Route path="/screener" element={<ApplicationLockGate><ScreenerPage /></ApplicationLockGate>} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/provenance" element={<ProvenancePage />} />
          <Route path="/data-provenance" element={<ProvenancePage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/api" element={<ApiDocsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms-of-service" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/models/capital-structure" element={<ApplicationLockGate><CapitalStructurePage /></ApplicationLockGate>} />
          <Route path="/support" element={<ApplicationLockGate><MethodologySupportPage /></ApplicationLockGate>} />
          <Route path="/methodology-support" element={<ApplicationLockGate><MethodologySupportPage /></ApplicationLockGate>} />
          <Route path="/methodology" element={<ApplicationLockGate><ModelsDirectoryPage /></ApplicationLockGate>} />
          <Route path="/profile" element={<ApplicationLockGate><ProfilePage /></ApplicationLockGate>} />
          <Route path="/saved" element={<ApplicationLockGate><ProfilePage initialTab="saved" /></ApplicationLockGate>} />
          <Route path="/signin" element={<AuthPage initialMode="signin" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          <Route path="/auth" element={<AuthPage initialMode="signin" />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/design" element={<DesignPage />} />
          {/* Catch-all redirect to home */}
          <Route path="*" element={<LandingPage onOpenSearch={() => setSearchOpen(true)} />} />
        </Routes>
      </main>
      <Footer />
      <AiChatbotDrawer />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

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
        <MarketProvider>
          <BrowserRouter>
            <AppShell searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
          </BrowserRouter>
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
