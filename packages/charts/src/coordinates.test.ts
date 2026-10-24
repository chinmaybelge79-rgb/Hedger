import { describe, it, expect } from 'vitest';
import {
  barIndexToX,
  xToBarIndex,
  priceToY,
  yToPrice,
  volumeToY,
  calculateVisibleBounds,
  DEFAULT_DIMENSIONS
} from './coordinates.js';
import type { HistoricalBar } from '@hedger/types';

describe('Hedger Chart Engine: Coordinate Transformations', () => {
  it('barIndexToX and xToBarIndex are exact and symmetric', () => {
    const totalBars = 100;
    const startIndex = 20;
    const endIndex = 80;

    // Check center bar
    const testIndex = 50;
    const x = barIndexToX(testIndex, startIndex, endIndex, DEFAULT_DIMENSIONS);
    const roundTripIndex = xToBarIndex(x, startIndex, endIndex, totalBars, DEFAULT_DIMENSIONS);

    expect(roundTripIndex).toBe(testIndex);
  });

  it('Zero extrapolation: skips non-trading days by indexing directly on bars', () => {
    // 5 bars covering a Friday and Monday, no invented weekend bars
    const fridayIndex = 0;
    const mondayIndex = 1;

    const xFri = barIndexToX(fridayIndex, 0, 5, DEFAULT_DIMENSIONS);
    const xMon = barIndexToX(mondayIndex, 0, 5, DEFAULT_DIMENSIONS);

    expect(xMon).toBeGreaterThan(xFri);
    expect(xMon - xFri).toBeCloseTo(barIndexToX(2, 0, 5, DEFAULT_DIMENSIONS) - xMon);
  });

  it('Linear scale: priceToY maps min/max correctly and inverts with yToPrice', () => {
    const minPrice = 100;
    const maxPrice = 200;

    const yMax = priceToY(maxPrice, minPrice, maxPrice, DEFAULT_DIMENSIONS, false);
    const yMin = priceToY(minPrice, minPrice, maxPrice, DEFAULT_DIMENSIONS, false);

    // Canvas Y 0 is at top, so maxPrice must have smaller Y than minPrice
    expect(yMax).toBe(DEFAULT_DIMENSIONS.paddingTop);
    expect(yMin).toBe(DEFAULT_DIMENSIONS.height - DEFAULT_DIMENSIONS.paddingBottom);

    // Inversion
    const midPrice = 150;
    const yMid = priceToY(midPrice, minPrice, maxPrice, DEFAULT_DIMENSIONS, false);
    const roundTrip = yToPrice(yMid, minPrice, maxPrice, DEFAULT_DIMENSIONS, false);
    expect(roundTrip).toBeCloseTo(midPrice, 4);
  });

  it('Logarithmic scale: priceToY and yToPrice are monotonic and invertible', () => {
    const minPrice = 10;
    const maxPrice = 1000;

    const y10 = priceToY(10, minPrice, maxPrice, DEFAULT_DIMENSIONS, true);
    const y100 = priceToY(100, minPrice, maxPrice, DEFAULT_DIMENSIONS, true);
    const y1000 = priceToY(1000, minPrice, maxPrice, DEFAULT_DIMENSIONS, true);

    expect(y1000).toBeLessThan(y100);
    expect(y100).toBeLessThan(y10);

    // Equal percentage ratio (10 -> 100 and 100 -> 1000) should occupy equal pixel height
    const dist1 = y10 - y100;
    const dist2 = y100 - y1000;
    expect(dist1).toBeCloseTo(dist2, 1);

    // Inversion
    const inverted = yToPrice(y100, minPrice, maxPrice, DEFAULT_DIMENSIONS, true);
    expect(inverted).toBeCloseTo(100, 1);
  });

  it('Volume histogram: stays within lower 20% of canvas height', () => {
    const maxVolume = 1000000;
    const bottomY = DEFAULT_DIMENSIONS.height - DEFAULT_DIMENSIONS.paddingBottom;
    const plotHeight = DEFAULT_DIMENSIONS.height - DEFAULT_DIMENSIONS.paddingTop - DEFAULT_DIMENSIONS.paddingBottom;
    const maxAllowedVolumeY = bottomY - plotHeight * 0.20;

    const yZero = volumeToY(0, maxVolume, DEFAULT_DIMENSIONS);
    const yFull = volumeToY(maxVolume, maxVolume, DEFAULT_DIMENSIONS);

    expect(yZero).toBe(bottomY);
    expect(yFull).toBeCloseTo(maxAllowedVolumeY, 1);
  });

  it('calculateVisibleBounds computes accurate min, max, and adds breathing room', () => {
    const sampleBars: HistoricalBar[] = [
      { date: '2026-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500 },
      { date: '2026-01-02', open: 105, high: 125, low: 102, close: 120, volume: 1500 },
      { date: '2026-01-05', open: 120, high: 122, low: 115, close: 118, volume: 800 }
    ];

    const bounds = calculateVisibleBounds(sampleBars, 0, 2);
    expect(bounds.maxVolume).toBe(1500);
    expect(bounds.minPrice).toBeLessThan(95);
    expect(bounds.maxPrice).toBeGreaterThan(125);
  });
});
