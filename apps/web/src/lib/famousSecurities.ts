export interface FamousSecurity {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector: string;
  country: string;
}

export const FAMOUS_SECURITIES: FamousSecurity[] = [
  // A
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Consumer Cyclical', country: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Communication Services', country: 'US' },
  { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'EURONEXT', currency: 'EUR', sector: 'Technology', country: 'Europe' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'AWL.NS', name: 'AWL Agri Business Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },
  { symbol: 'AARTIIND.NS', name: 'Aarti Industries Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },

  // B
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', currency: 'USD', sector: 'Financial Services', country: 'US' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', exchange: 'NSE', currency: 'INR', sector: 'Communication Services', country: 'India' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'BP.L', name: 'BP plc', exchange: 'LSE', currency: 'GBP', sector: 'Energy', country: 'Europe' },
  { symbol: 'BABA', name: 'Alibaba Group Holding Limited', exchange: 'NYSE', currency: 'USD', sector: 'Consumer Cyclical', country: 'Global' },

  // C
  { symbol: 'CROPSTER.BO', name: 'Cropster Agro Limited', exchange: 'BSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'CIPLA.NS', name: 'Cipla Limited', exchange: 'NSE', currency: 'INR', sector: 'Healthcare', country: 'India' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', exchange: 'NSE', currency: 'INR', sector: 'Energy', country: 'India' },
  { symbol: 'COROMANDEL.NS', name: 'Coromandel International Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },
  { symbol: 'CRM', name: 'Salesforce, Inc.', exchange: 'NYSE', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },

  // D
  { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories Limited", exchange: 'NSE', currency: 'INR', sector: 'Healthcare', country: 'India' },
  { symbol: 'DIVISLAB.NS', name: "Divi's Laboratories Limited", exchange: 'NSE', currency: 'INR', sector: 'Healthcare', country: 'India' },
  { symbol: 'DABUR.NS', name: 'Dabur India Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },

  // E
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },

  // G
  { symbol: 'GODREJAGRO.NS', name: 'Godrej Agrovet Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'GAIL.NS', name: 'GAIL (India) Limited', exchange: 'NSE', currency: 'INR', sector: 'Utilities', country: 'India' },

  // H
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', exchange: 'NSE', currency: 'INR', sector: 'Technology', country: 'India' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },

  // I
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', currency: 'INR', sector: 'Technology', country: 'India' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'ITC.NS', name: 'ITC Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'IOC.NS', name: 'Indian Oil Corporation Limited', exchange: 'NSE', currency: 'INR', sector: 'Energy', country: 'India' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'IBM', name: 'International Business Machines', exchange: 'NYSE', currency: 'USD', sector: 'Technology', country: 'US' },

  // J
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', currency: 'USD', sector: 'Financial Services', country: 'US' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },

  // K
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'KRBL.NS', name: 'KRBL Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },

  // L
  { symbol: 'LTIM.NS', name: 'LTIMindtree Limited', exchange: 'NSE', currency: 'INR', sector: 'Technology', country: 'India' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', exchange: 'NSE', currency: 'INR', sector: 'Industrials', country: 'India' },

  // M
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Communication Services', country: 'US' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },

  // N
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD', sector: 'Technology', country: 'US' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Communication Services', country: 'US' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', exchange: 'NSE', currency: 'INR', sector: 'Utilities', country: 'India' },

  // O
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', exchange: 'NSE', currency: 'INR', sector: 'Energy', country: 'India' },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', currency: 'USD', sector: 'Technology', country: 'US' },

  // P
  { symbol: 'PATANJALI.NS', name: 'Patanjali Foods Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Defensive', country: 'India' },
  { symbol: 'PIIND.NS', name: 'PI Industries Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India', exchange: 'NSE', currency: 'INR', sector: 'Utilities', country: 'India' },

  // R
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', exchange: 'NSE', currency: 'INR', sector: 'Energy', country: 'India' },

  // S
  { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE', currency: 'INR', sector: 'Financial Services', country: 'India' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', exchange: 'NSE', currency: 'INR', sector: 'Healthcare', country: 'India' },
  { symbol: 'SAP', name: 'SAP SE', exchange: 'XETRA', currency: 'EUR', sector: 'Technology', country: 'Europe' },
  { symbol: 'SHEL.L', name: 'Shell plc', exchange: 'LSE', currency: 'GBP', sector: 'Energy', country: 'Europe' },
  { symbol: 'SONY', name: 'Sony Group Corporation', exchange: 'NYSE', currency: 'USD', sector: 'Consumer Cyclical', country: 'Japan' },

  // T
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', currency: 'USD', sector: 'Consumer Cyclical', country: 'US' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Co.', exchange: 'NYSE', currency: 'USD', sector: 'Technology', country: 'Global' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', currency: 'INR', sector: 'Technology', country: 'India' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },
  { symbol: 'TATACHEM.NS', name: 'Tata Chemicals Limited', exchange: 'NSE', currency: 'INR', sector: 'Basic Materials', country: 'India' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', exchange: 'NSE', currency: 'INR', sector: 'Consumer Cyclical', country: 'India' },
  { symbol: '7203.T', name: 'Toyota Motor Corporation', exchange: 'TSE', currency: 'JPY', sector: 'Consumer Cyclical', country: 'Japan' },

  // W
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', exchange: 'NSE', currency: 'INR', sector: 'Technology', country: 'India' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', currency: 'USD', sector: 'Consumer Defensive', country: 'US' }
];

/**
 * Returns suggestions matching the user query.
 * If query is a single character (e.g. 'A'), prioritizes all famous securities starting with that character!
 */
export function getFamousSecuritySuggestions(query: string, limit = 8): FamousSecurity[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const qLower = trimmed.toLowerCase();
  const qUpper = trimmed.toUpperCase();

  // Tier 1: Symbol starts with query (e.g. 'A' -> AAPL, AMZN, ASML, AMD, ADBE, AWL.NS, AXISBANK.NS)
  const tier1 = FAMOUS_SECURITIES.filter((s) => s.symbol.toUpperCase().startsWith(qUpper));

  // Tier 2: Company name starts with query or word in company name starts with query (e.g. 'A' -> Alphabet)
  const tier2 = FAMOUS_SECURITIES.filter(
    (s) =>
      !tier1.includes(s) &&
      (s.name.toLowerCase().startsWith(qLower) ||
        s.name
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.startsWith(qLower)))
  );

  // Tier 3: Symbol contains query or name contains query
  const tier3 = FAMOUS_SECURITIES.filter(
    (s) =>
      !tier1.includes(s) &&
      !tier2.includes(s) &&
      (s.symbol.toLowerCase().includes(qLower) || s.name.toLowerCase().includes(qLower))
  );

  return [...tier1, ...tier2, ...tier3].slice(0, limit);
}
