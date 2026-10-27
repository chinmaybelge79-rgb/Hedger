/**
 * Feature flags for Hedger
 * 
 * PREDICTION_ENABLED and VALUATION_STATUS_ENABLED default to true in development/test
 * and can be toggled via environment variables.
 */
export const PREDICTION_ENABLED: boolean =
  typeof window !== 'undefined' && window.__PREDICTION_ENABLED__ !== undefined
    ? Boolean(window.__PREDICTION_ENABLED__)
    : import.meta.env?.VITE_PREDICTION_ENABLED !== 'false';

export const VALUATION_STATUS_ENABLED: boolean =
  typeof window !== 'undefined' && window.__VALUATION_STATUS_ENABLED__ !== undefined
    ? Boolean(window.__VALUATION_STATUS_ENABLED__)
    : import.meta.env?.VITE_VALUATION_STATUS_ENABLED !== 'false';

