import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type { CompanyProfile, MarketData, FinancialsResponse, PricePoint } from '../api/types';

export function useCompanySearch() {
  const searchCompanies = async (query: string): Promise<Array<{ symbol: string; name: string; exch: string }>> => {
    if (!query.trim()) return [];
    const response = await api.get<{ results: Array<{ symbol: string; name: string; exchange: string; type: string; currency: string }> }>(
      `${API_ENDPOINTS.search}?q=${encodeURIComponent(query)}`
    );
    return response.data?.results.map(r => ({ sym: r.symbol, name: r.name, exch: r.exchange })) || [];
  };

  const getCompanyByTicker = async (ticker: string) => {
    const response = await api.get<{ results: Array<{ symbol: string; name: string; exchange: string; type: string; currency: string }> }>(
      API_ENDPOINTS.searchByTicker(ticker)
    );
    return response.data?.results[0] || null;
  };

  return { searchCompanies, getCompanyByTicker };
}

export function useCompanyProfile(ticker: string | null) {
  return useQuery({
    queryKey: ['company', 'profile', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: CompanyProfile }>(API_ENDPOINTS.companies(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCompanyPriceHistory(ticker: string | null, years = 7) {
  return useQuery({
    queryKey: ['company', 'price-history', ticker, years],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: PricePoint[] }>(
        `${API_ENDPOINTS.companyPriceHistory(ticker)}?years=${years}`
      );
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMarketData(ticker: string | null) {
  return useQuery({
    queryKey: ['market', 'data', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: MarketData }>(API_ENDPOINTS.market(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}

export function useLatestPrice(ticker: string | null) {
  return useQuery({
    queryKey: ['market', 'quote', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: { price: number; change: number; changePercent: number } }>(
        API_ENDPOINTS.marketQuote(ticker)
      );
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useFinancials(ticker: string | null, period: 'annual' | 'quarterly' = 'annual', limit = 10) {
  return useQuery({
    queryKey: ['financials', ticker, period, limit],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: FinancialsResponse }>(
        `${API_ENDPOINTS.financials(ticker)}?period=${period}&limit=${limit}`
      );
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}