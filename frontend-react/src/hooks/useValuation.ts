import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import type {
  WaccResponse,
  DcfResponse,
  DcfInput,
  ReverseDcfResponse,
  ReverseDcfInput,
  CompsResponse,
  CompsInput,
  SensitivityResponse,
  SensitivityInput,
  ScenarioResponse,
  ScenarioInput,
  MonteCarloResponse,
  MonteCarloInput,
  RiskResponse,
  ConfidenceResponse,
  ValuationSummary,
} from '../api/types';

export function useWacc(ticker: string | null) {
  return useQuery({
    queryKey: ['valuation', 'wacc', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: WaccResponse }>(API_ENDPOINTS.valuation.wacc(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useDcf(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: DcfInput) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: DcfResponse }>(API_ENDPOINTS.valuation.dcf(ticker), input);
      return response.data!;
    },
  });
}

export function useReverseDcf(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: ReverseDcfInput) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: ReverseDcfResponse }>(API_ENDPOINTS.valuation.reverseDcf(ticker), input);
      return response.data!;
    },
  });
}

export function useComps(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: CompsInput = {}) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: CompsResponse }>(API_ENDPOINTS.valuation.comps(ticker), input);
      return response.data!;
    },
  });
}

export function useSotp(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.valuation.sotp(ticker), input);
      return response.data!;
    },
  });
}

export function useDdm(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.valuation.ddm(ticker), input);
      return response.data!;
    },
  });
}

export function useResidualIncome(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.valuation.residualIncome(ticker), input);
      return response.data!;
    },
  });
}

export function useEva(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.valuation.eva(ticker), input);
      return response.data!;
    },
  });
}

export function useValuationSummary(ticker: string | null) {
  return useQuery({
    queryKey: ['valuation', 'summary', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: any }>(API_ENDPOINTS.valuation.summary(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSensitivity(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.analytics.sensitivity(ticker), input);
      return response.data!;
    },
  });
}

export function useScenarios(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.analytics.scenarios(ticker), input);
      return response.data!;
    },
  });
}

export function useMonteCarlo(ticker: string | null) {
  return useMutation({
    mutationFn: async (input: any) => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.post<{ data: any }>(API_ENDPOINTS.analytics.monteCarlo(ticker), input);
      return response.data!;
    },
  });
}

export function useRisk(ticker: string | null) {
  return useQuery({
    queryKey: ['analytics', 'risk', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: RiskResponse }>(API_ENDPOINTS.analytics.risk(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useConfidence(ticker: string | null) {
  return useQuery({
    queryKey: ['analytics', 'confidence', ticker],
    queryFn: async () => {
      if (!ticker) throw new Error('No ticker provided');
      const response = await api.get<{ data: ConfidenceResponse }>(API_ENDPOINTS.analytics.confidence(ticker));
      return response.data!;
    },
    enabled: !!ticker,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}