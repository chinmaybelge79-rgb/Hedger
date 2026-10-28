/**
 * Hedger Native Chart Engine: Mathematical Coordinate System
 * Implements strict trading-day indexing (no calendar weekend/holiday extrapolation)
 * and dual Linear / Logarithmic scaling.
 */

import type { HistoricalBar } from '@hedger/types';

export interface ViewportBounds {
  startIndex: number;
  endIndex: number;
  minPrice: number;
  maxPrice: number;
  maxVolume: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export const DEFAULT_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 400,
  paddingTop: 16,
  paddingRight: 76, // Generous padding for Y-axis price labels
  paddingBottom: 32, // For X-axis date labels
  paddingLeft: 16
};

/**
 * Maps a trading day array index [0..N-1] to pixel X coordinate.
 * Uses exact trading-day index space to prevent calendar gaps across weekends/holidays.
 */
export function barIndexToX(
  index: number,
  startIndex: number,
  endIndex: number,
  dimensions: ChartDimensions
): number {
  const plotWidth = dimensions.width - dimensions.paddingLeft - dimensions.paddingRight;
  const count = Math.max(1, endIndex - startIndex);
  const step = plotWidth / count;
  return dimensions.paddingLeft + (index - startIndex) * step + step / 2;
}

/**
 * Inverts pixel X coordinate to nearest trading day array index.
 */
export function xToBarIndex(
  x: number,
  startIndex: number,
  endIndex: number,
  totalBars: number,
  dimensions: ChartDimensions
): number {
  const plotWidth = dimensions.width - dimensions.paddingLeft - dimensions.paddingRight;
  const count = Math.max(1, endIndex - startIndex);
  const step = plotWidth / count;
  const relX = x - dimensions.paddingLeft;
  const rawIndex = startIndex + Math.floor(relX / step);
  return Math.max(0, Math.min(totalBars - 1, rawIndex));
}

/**
 * Maps price to pixel Y coordinate with Linear or Logarithmic scale.
 */
export function priceToY(
  price: number,
  minPrice: number,
  maxPrice: number,
  dimensions: ChartDimensions,
  isLogScale: boolean = false
): number {
  const plotHeight = dimensions.height - dimensions.paddingTop - dimensions.paddingBottom;

  if (minPrice >= maxPrice || price <= 0) {
    return dimensions.paddingTop + plotHeight / 2;
  }

  if (isLogScale) {
    const logMin = Math.log(Math.max(0.001, minPrice));
    const logMax = Math.log(Math.max(0.001, maxPrice));
    const logPrice = Math.log(Math.max(0.001, price));
    const fraction = (logPrice - logMin) / (logMax - logMin);
    return dimensions.paddingTop + plotHeight * (1 - fraction);
  }

  const fraction = (price - minPrice) / (maxPrice - minPrice);
  return dimensions.paddingTop + plotHeight * (1 - fraction);
}

/**
 * Inverts pixel Y coordinate to price value.
 */
export function yToPrice(
  y: number,
  minPrice: number,
  maxPrice: number,
  dimensions: ChartDimensions,
  isLogScale: boolean = false
): number {
  const plotHeight = dimensions.height - dimensions.paddingTop - dimensions.paddingBottom;
  const fraction = 1 - (y - dimensions.paddingTop) / plotHeight;

  if (isLogScale) {
    const logMin = Math.log(Math.max(0.001, minPrice));
    const logMax = Math.log(Math.max(0.001, maxPrice));
    const logPrice = logMin + fraction * (logMax - logMin);
    return Math.exp(logPrice);
  }

  return minPrice + fraction * (maxPrice - minPrice);
}

/**
 * Volume Histogram Y mapping on lower 20% of canvas.
 */
export function volumeToY(
  volume: number,
  maxVolume: number,
  dimensions: ChartDimensions
): number {
  const plotHeight = dimensions.height - dimensions.paddingTop - dimensions.paddingBottom;
  const volumeHeight = plotHeight * 0.20;
  const bottomY = dimensions.height - dimensions.paddingBottom;

  if (maxVolume <= 0 || volume <= 0) {
    return bottomY;
  }

  const fraction = Math.min(1, volume / maxVolume);
  return bottomY - fraction * volumeHeight;
}

/**
 * Computes price and volume min/max bounds for the visible index window.
 */
export function calculateVisibleBounds(
  bars: HistoricalBar[],
  startIndex: number,
  endIndex: number
): ViewportBounds {
  if (!bars || bars.length === 0) {
    return { startIndex: 0, endIndex: 0, minPrice: 0, maxPrice: 100, maxVolume: 0 };
  }

  const start = Math.max(0, Math.min(bars.length - 1, startIndex));
  const end = Math.max(start, Math.min(bars.length - 1, endIndex));

  let minP = Infinity;
  let maxP = -Infinity;
  let maxV = 0;

  for (let i = start; i <= end; i++) {
    const b = bars[i];
    if (b.low < minP && b.low > 0) minP = b.low;
    if (b.high > maxP) maxP = b.high;
    if (b.volume > maxV) maxV = b.volume;
  }

  if (!Number.isFinite(minP) || !Number.isFinite(maxP)) {
    minP = 100;
    maxP = 200;
  }

  // Add 4% vertical breathing room
  const margin = (maxP - minP) * 0.04 || 1;

  return {
    startIndex: start,
    endIndex: end,
    minPrice: Math.max(0.01, minP - margin),
    maxPrice: maxP + margin,
    maxVolume: maxV || 1
  };
}
