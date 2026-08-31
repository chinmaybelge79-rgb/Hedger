import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ModelsPage } from './pages/ModelsPage';
import { PricingPage } from './pages/PricingPage';
import { TickerPage } from './pages/TickerPage';
import { FinancialsPage } from './pages/FinancialsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { useTheme } from './hooks/useTheme';
import { useEffect } from 'react';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const { isDark, isReading } = useTheme();

  useEffect(() => {
    if (isDark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');

    if (isReading) document.body.classList.add('reading-mode');
    else document.body.classList.remove('reading-mode');
  }, [isDark, isReading]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="models" element={<ModelsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="ticker/:ticker" element={<TickerPage />} />
            <Route path="financials/:ticker" element={<FinancialsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;