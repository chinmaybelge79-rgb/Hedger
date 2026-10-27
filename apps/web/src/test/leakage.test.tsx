import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage.js';
import { MarketsPage } from '../pages/MarketsPage.js';
import { CompanyPage } from '../pages/CompanyPage.js';
import { ScreenerPage } from '../pages/ScreenerPage.js';
import { SavedPage } from '../pages/SavedPage.js';
import { DesignPage } from '../pages/DesignPage.js';
import { ComparePage } from '../pages/ComparePage.js';
import { SearchModal } from '../components/SearchModal.js';
import { MarketProvider } from '../context/MarketContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { AuthProvider } from '../context/AuthContext.js';

const LEAKAGE_PATTERNS = [
  /\bnull\b/i,
  /\bundefined\b/i,
  /\bNaN\b/,
  /\bInfinity\b/,
  /\[object Object\]/,
  /Invalid Date/
];

function assertNoLeakage(container: HTMLElement, routeName: string) {
  const text = container.textContent || '';
  for (const pattern of LEAKAGE_PATTERNS) {
    const match = text.match(pattern);
    expect(
      match,
      `Leakage found in route "${routeName}" text: matched ${pattern} -> "${match?.[0]}"`
    ).toBeNull();
  }

  // Check title attributes
  const elementsWithTitle = container.querySelectorAll('[title]');
  elementsWithTitle.forEach((el) => {
    const titleVal = el.getAttribute('title') || '';
    for (const pattern of LEAKAGE_PATTERNS) {
      const match = titleVal.match(pattern);
      expect(
        match,
        `Leakage found in route "${routeName}" title attribute: matched ${pattern}`
      ).toBeNull();
    }
  });

  // Check aria-label attributes
  const elementsWithAria = container.querySelectorAll('[aria-label]');
  elementsWithAria.forEach((el) => {
    const ariaVal = el.getAttribute('aria-label') || '';
    for (const pattern of LEAKAGE_PATTERNS) {
      const match = ariaVal.match(pattern);
      expect(
        match,
        `Leakage found in route "${routeName}" aria-label attribute: matched ${pattern}`
      ).toBeNull();
    }
  });
}

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <MarketProvider>
        {children}
      </MarketProvider>
    </AuthProvider>
  </ThemeProvider>
);

describe('M0 Leakage Tests — Zero null/undefined/NaN/Infinity across all routes', () => {
  it('Route: / (Landing Page) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/']}>
          <LandingPage onOpenSearch={() => {}} />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/');
  });

  it('Route: /markets (Markets Page) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/markets']}>
          <MarketsPage />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/markets');
  });

  it('Route: /company/:symbol (Company Dossier Overview) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/company/RELIANCE.NS']}>
          <Routes>
            <Route path="/company/:symbol" element={<CompanyPage />} />
          </Routes>
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/company/RELIANCE.NS');
  });

  it('Route: /models (Company Dossier Valuation Tab) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/models']}>
          <CompanyPage initialTab="valuation" />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/models');
  });

  it('Route: /screener (Stock Screener) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/screener']}>
          <ScreenerPage />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/screener');
  });

  it('Route: /saved (Saved Models) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/saved']}>
          <SavedPage />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/saved');
  });

  it('Route: /compare (Comparison Page) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/compare?a=TCS.NS&b=INFY.NS']}>
          <ComparePage />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/compare');
  });

  it('Route: /design (Design Catalog) has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter initialEntries={['/design']}>
          <DesignPage />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, '/design');
  });

  it('Modal: SearchModal has zero leakage', () => {
    const { container } = render(
      <TestWrapper>
        <MemoryRouter>
          <SearchModal isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      </TestWrapper>
    );
    assertNoLeakage(container, 'SearchModal');
  });
});