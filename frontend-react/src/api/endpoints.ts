export const API_ENDPOINTS = {
  health: '/health',
  healthReady: '/health/ready',
  healthLive: '/health/live',

  search: '/search',
  searchByTicker: (ticker: string) => `/search/${ticker}`,

  companies: (ticker: string) => `/companies/${ticker}`,
  companyPriceHistory: (ticker: string) => `/companies/${ticker}/price-history`,

  market: (ticker: string) => `/market/${ticker}`,
  marketQuote: (ticker: string) => `/market/${ticker}/quote`,

  financials: (ticker: string) => `/financials/${ticker}`,

  valuation: {
    wacc: (ticker: string) => `/valuation/${ticker}/wacc`,
    dcf: (ticker: string) => `/valuation/${ticker}/dcf`,
    reverseDcf: (ticker: string) => `/valuation/${ticker}/reverse-dcf`,
    comps: (ticker: string) => `/valuation/${ticker}/comps`,
    sotp: (ticker: string) => `/valuation/${ticker}/sotp`,
    ddm: (ticker: string) => `/valuation/${ticker}/ddm`,
    residualIncome: (ticker: string) => `/valuation/${ticker}/residual-income`,
    eva: (ticker: string) => `/valuation/${ticker}/eva`,
    summary: (ticker: string) => `/valuation/${ticker}/summary`,
  },

  analytics: {
    sensitivity: (ticker: string) => `/valuation/${ticker}/dcf/sensitivity`,
    scenarios: (ticker: string) => `/valuation/${ticker}/scenarios`,
    monteCarlo: (ticker: string) => `/valuation/${ticker}/monte-carlo`,
    risk: (ticker: string) => `/valuation/${ticker}/risk`,
    confidence: (ticker: string) => `/valuation/${ticker}/confidence`,
  },
} as const;