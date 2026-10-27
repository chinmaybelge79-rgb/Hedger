import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  calculateValuationStatus,
  calculate5YearPrediction,
  hashStringToSeed
} from './prediction.js';

describe('5-Year Prediction Engine & Valuation Status', () => {
  describe('Valuation Status Chip Engine', () => {
    it('returns Overvalued when both 5Y and peer ratios >= 1.25', () => {
      const res = calculateValuationStatus({
        currentPe: 30,
        pe5yMedian: 20, // 30/20 = 1.50 >= 1.25
        pePeerMedian: 24, // 30/24 = 1.25 >= 1.25
        peerCount: 5,
        has5yHistory: true
      });
      expect(res.status).toBe('Overvalued');
      expect(res.primaryRatio).toBeCloseTo(1.50, 2);
      expect(res.peerRatio).toBeCloseTo(1.25, 2);
    });

    it('returns Undervalued when both 5Y and peer ratios <= 0.80', () => {
      const res = calculateValuationStatus({
        currentPe: 16,
        pe5yMedian: 20, // 16/20 = 0.80 <= 0.80
        pePeerMedian: 22, // 16/22 = 0.727 <= 0.80
        peerCount: 4,
        has5yHistory: true
      });
      expect(res.status).toBe('Undervalued');
      expect(res.primaryRatio).toBeCloseTo(0.80, 2);
    });

    it('returns Fairly valued when ratios diverge or fall in the middle band', () => {
      // Divergent
      const divergent = calculateValuationStatus({
        currentPe: 26,
        pe5yMedian: 20, // 1.30 (high)
        pePeerMedian: 35, // 0.74 (low)
        peerCount: 5,
        has5yHistory: true
      });
      expect(divergent.status).toBe('Fairly valued');

      // Inside band
      const inside = calculateValuationStatus({
        currentPe: 21,
        pe5yMedian: 20, // 1.05
        pePeerMedian: 20, // 1.05
        peerCount: 5,
        has5yHistory: true
      });
      expect(inside.status).toBe('Fairly valued');
    });

    it('returns Not enough data when fewer than 3 peers or no 5Y history', () => {
      const fewPeers = calculateValuationStatus({
        currentPe: 30,
        pe5yMedian: 20,
        pePeerMedian: 20,
        peerCount: 2, // < 3
        has5yHistory: true
      });
      expect(fewPeers.status).toBe('Not enough data');

      const no5y = calculateValuationStatus({
        currentPe: 30,
        pe5yMedian: null,
        pePeerMedian: 20,
        peerCount: 5,
        has5yHistory: false
      });
      expect(no5y.status).toBe('Not enough data');
    });

    it('supports bank path using P/B', () => {
      const bank = calculateValuationStatus({
        isBank: true,
        currentPb: 1.8,
        pb5yMedian: 1.2, // 1.50
        pbPeerMedian: 1.3, // 1.38
        peerCount: 6,
        has5yHistory: true
      });
      expect(bank.status).toBe('Overvalued');
      expect(bank.metricUsed).toBe('P/B');
    });
  });

  describe('5-Year Prediction Mathematical Engine', () => {
    it('exact worked example from spec section 5.3', () => {
      const res = calculate5YearPrediction({
        symbol: 'SAMPLE',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 1440,
        baseEps: 60,
        currentPe: 24,
        baseGrowthRates: [0.12, 0.11, 0.10, 0.09, 0.08],
        longTermGrowth: 0.04,
        pe5yMedian: 20,
        pePeerMedian: 18,
        indexPercentile: 0.70,
        structuralScore: 0.50, // +0.5 pp
        sentimentScore: 0.30,  // +0.3 pp
        hypePercentile: 0.40,  // no hype compression (< 0.80)
        sharesDilutionRate: 0.0
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // P50 should be approx 1921 (1920.9)
      expect(res.p50).toBeCloseTo(1921, 0);
      // Change % should be approx +33.4%
      expect(res.changePct * 100).toBeCloseTo(33.4, 0.5);

      // Range ordering P10 < P50 < P90
      expect(res.p10).toBeLessThan(res.p50);
      expect(res.p50).toBeLessThan(res.p90);

      // Check horizon is 5 years out
      expect(res.horizonDate).toBe('Apr 2031');
    });

    it('seeded simulations are 100% deterministic and reproducible', () => {
      const run1 = calculate5YearPrediction({
        symbol: 'NVDA',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 150,
        baseEps: 3.5,
        currentPe: 42.8,
        baseGrowthRates: [0.35, 0.28, 0.20, 0.15, 0.12],
        longTermGrowth: 0.035,
        pe5yMedian: 45,
        pePeerMedian: 38,
        indexPercentile: 0.65,
        structuralScore: 1.2,
        sentimentScore: 0.4,
        hypePercentile: 0.85
      });

      const run2 = calculate5YearPrediction({
        symbol: 'NVDA',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 150,
        baseEps: 3.5,
        currentPe: 42.8,
        baseGrowthRates: [0.35, 0.28, 0.20, 0.15, 0.12],
        longTermGrowth: 0.035,
        pe5yMedian: 45,
        pePeerMedian: 38,
        indexPercentile: 0.65,
        structuralScore: 1.2,
        sentimentScore: 0.4,
        hypePercentile: 0.85
      });

      expect(run1.ok).toBe(true);
      expect(run2.ok).toBe(true);
      if (!run1.ok || !run2.ok) return;

      expect(run1.p10).toEqual(run2.p10);
      expect(run1.p50).toEqual(run2.p50);
      expect(run1.p90).toEqual(run2.p90);
      expect(run1.changePct).toEqual(run2.changePct);
    });

    it('structural score monotonicity: higher structural score increases P50', () => {
      const baseArgs = {
        symbol: 'TEST',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 100,
        baseEps: 5,
        currentPe: 20,
        baseGrowthRates: [0.10, 0.09, 0.08, 0.07, 0.06],
        longTermGrowth: 0.03,
        pe5yMedian: 20,
        pePeerMedian: 20,
        indexPercentile: 0.50,
        sentimentScore: 0,
        hypePercentile: 0.50
      };

      const lower = calculate5YearPrediction({ ...baseArgs, structuralScore: -1.0 });
      const higher = calculate5YearPrediction({ ...baseArgs, structuralScore: +1.0 });

      expect(lower.ok).toBe(true);
      expect(higher.ok).toBe(true);
      if (!lower.ok || !higher.ok) return;

      expect(higher.p50).toBeGreaterThan(lower.p50);
    });

    it('hype percentile penalty: hype > 0.80 compresses exit multiple and does not increase P50', () => {
      const baseArgs = {
        symbol: 'HYPE',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 100,
        baseEps: 5,
        currentPe: 20,
        baseGrowthRates: [0.10, 0.09, 0.08, 0.07, 0.06],
        longTermGrowth: 0.03,
        pe5yMedian: 20,
        pePeerMedian: 20,
        indexPercentile: 0.50,
        structuralScore: 0,
        sentimentScore: 0
      };

      const normal = calculate5YearPrediction({ ...baseArgs, hypePercentile: 0.70 });
      const hyped = calculate5YearPrediction({ ...baseArgs, hypePercentile: 0.95 });

      expect(normal.ok).toBe(true);
      expect(hyped.ok).toBe(true);
      if (!normal.ok || !hyped.ok) return;

      expect(hyped.p50).toBeLessThan(normal.p50);
    });

    it('refuses negative or zero earnings gracefully', () => {
      const neg = calculate5YearPrediction({
        symbol: 'UNPROFITABLE',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 50,
        baseEps: -1.5,
        currentPe: -33,
        baseGrowthRates: [0.20, 0.15, 0.10, 0.05, 0.03],
        longTermGrowth: 0.03
      });

      expect(neg.ok).toBe(false);
      if (neg.ok) return;
      expect(neg.code).toBe('NEGATIVE_EARNINGS');
      expect(neg.message).toContain('positive');
    });

    it('missing factor data records no_data state with 0 effect and does not crash', () => {
      const res = calculate5YearPrediction({
        symbol: 'PARTIAL',
        asOf: '2026-10-26',
        currency: 'USD',
        currentPrice: 100,
        baseEps: 5,
        currentPe: 20,
        baseGrowthRates: [0.10, 0.08, 0.06, 0.05, 0.04],
        longTermGrowth: 0.03
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;
      const newsFactor = res.factors.find((f) => f.key === 'news');
      expect(newsFactor).toBeDefined();
      expect(newsFactor?.state).toBe('no_data');
      expect(newsFactor?.effect).toBe('0.00 pp/yr');
    });

    it('bank path works with BVPS and P/B', () => {
      const bank = calculate5YearPrediction({
        symbol: 'HDFC',
        asOf: '2026-04-19',
        currency: 'INR',
        isBank: true,
        currentPrice: 1600,
        baseBvps: 600,
        currentPb: 2.67,
        pb5yMedian: 2.8,
        pbPeerMedian: 2.4,
        returnOnEquity: 0.16,
        retentionRatio: 0.80,
        longTermGrowth: 0.06,
        indexPercentile: 0.50
      });

      expect(bank.ok).toBe(true);
      if (!bank.ok) return;
      expect(bank.p50).toBeGreaterThan(0);
      expect(bank.p10).toBeLessThan(bank.p50);
      expect(bank.p50).toBeLessThan(bank.p90);
    });

    it('strictly avoids banned marketing and advice words', () => {
      const bannedWords = [
        'target price',
        'forecast',
        'will reach',
        'guaranteed',
        'buy',
        'sell',
        'hold',
        'should',
        'recommend',
        'upside',
        'downside',
        'intrinsic value'
      ];

      const res = calculate5YearPrediction({
        symbol: 'AUDIT',
        asOf: '2026-04-19',
        currency: 'USD',
        currentPrice: 100,
        baseEps: 5,
        currentPe: 20,
        baseGrowthRates: [0.10, 0.08, 0.06, 0.04, 0.03],
        longTermGrowth: 0.03
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const fullText = JSON.stringify(res).toLowerCase();
      for (const banned of bannedWords) {
        expect(fullText.includes(banned), `Found banned phrase "${banned}" in prediction output`).toBe(false);
      }
    });
  });
});
