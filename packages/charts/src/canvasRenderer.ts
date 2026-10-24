/**
 * Hedger Native Canvas 2D Chart Renderer
 * 60 FPS, Zero External Dependencies, High-DPI Crisp Rendering
 */

import type { HistoricalBar } from '@hedger/types';
import { formatPrice, formatDate } from '@hedger/format';
import {
  barIndexToX,
  priceToY,
  volumeToY,
  type ChartDimensions,
  type ViewportBounds
} from './coordinates.js';

export interface ChartEvent {
  date: string;
  type: 'E' | 'D' | 'S'; // Earnings, Dividend, Split
  label: string;
  details: string;
}

export interface ValuationOverlayProps {
  baseCase: number;
  bearCase?: number;
  bullCase?: number;
  currency?: string;
  visible: boolean;
}

export interface RenderOptions {
  dimensions: ChartDimensions;
  bounds: ViewportBounds;
  chartType: 'mountain' | 'candles';
  isLogScale: boolean;
  currency: string;
  showVolume: boolean;
  events?: ChartEvent[];
  valuation?: ValuationOverlayProps;
  crosshairBarIndex?: number | null;
  crosshairY?: number | null;
  theme?: 'light' | 'dark';
}

export interface ChartThemeColors {
  canvasBg: string;
  gridlines: string;
  axisLabels: string;
  priceLine: string;
  areaGradientTop: string;
  areaGradientBottom: string;
  positive: string;
  negative: string;
  volumeUp: string;
  volumeDown: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  crosshair: string;
  crosshairDot: string;
}

export const CHART_THEMES: Record<'light' | 'dark', ChartThemeColors> = {
  light: {
    canvasBg: '#FFFFFF',
    gridlines: '#F0F0F2',
    axisLabels: '#666666',
    priceLine: '#171717',
    areaGradientTop: 'rgba(23, 23, 23, 0.08)',
    areaGradientBottom: 'rgba(23, 23, 23, 0.00)',
    positive: '#15803D',
    negative: '#B91C1C',
    volumeUp: 'rgba(21, 128, 61, 0.22)',
    volumeDown: 'rgba(185, 28, 28, 0.22)',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E5E5E5',
    tooltipText: '#171717',
    crosshair: '#A1A1AA',
    crosshairDot: '#171717'
  },
  dark: {
    canvasBg: '#141414',
    gridlines: '#292929',
    axisLabels: '#A1A1AA',
    priceLine: '#E5E7EB',
    areaGradientTop: 'rgba(229, 231, 235, 0.12)',
    areaGradientBottom: 'rgba(229, 231, 235, 0.00)',
    positive: '#16A34A',
    negative: '#DC2626',
    volumeUp: 'rgba(22, 163, 74, 0.25)',
    volumeDown: 'rgba(220, 38, 38, 0.25)',
    tooltipBg: '#1A1A1A',
    tooltipBorder: '#333333',
    tooltipText: '#F5F5F5',
    crosshair: '#52525B',
    crosshairDot: '#F5F5F5'
  }
};

/**
 * Smart date formatting for the X-axis to keep labels calm, legible and uncrowded.
 */
function formatAxisDate(dateStr: string, barSpan: number): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';

    if (barSpan > 250) {
      // Multi-year (3Y, 5Y, ALL): 'Oct 2024'
      return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    } else if (barSpan > 45) {
      // Medium range (6M, 1Y): '15 Oct 25'
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
    } else {
      // Short range (1M): '15 Oct'
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch {
    return '—';
  }
}

export function renderChart(
  ctx: CanvasRenderingContext2D,
  bars: HistoricalBar[],
  opts: RenderOptions
) {
  const { dimensions, bounds, chartType, isLogScale, currency, showVolume, events, valuation, crosshairBarIndex, crosshairY, theme = 'light' } = opts;
  const { width, height, paddingTop, paddingRight, paddingBottom, paddingLeft } = dimensions;

  const palette = CHART_THEMES[theme] || CHART_THEMES.light;

  // Clear and paint canvas background
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.canvasBg;
  ctx.fillRect(0, 0, width, height);

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const start = bounds.startIndex;
  const end = bounds.endIndex;
  const barSpan = Math.max(1, end - start);

  // 1. Draw Grid Lines (Horizontal Price Lines)
  ctx.save();
  ctx.strokeStyle = palette.gridlines;
  ctx.lineWidth = 1;
  ctx.fillStyle = palette.axisLabels;
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const gridLevels = 5;
  for (let i = 0; i <= gridLevels; i++) {
    const fraction = i / gridLevels;
    const y = paddingTop + plotHeight * fraction;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, Math.round(y) + 0.5);
    ctx.lineTo(width - paddingRight, Math.round(y) + 0.5);
    ctx.stroke();

    // Price label
    const rawPrice = isLogScale
      ? Math.exp(Math.log(bounds.maxPrice) - fraction * (Math.log(bounds.maxPrice) - Math.log(bounds.minPrice)))
      : bounds.maxPrice - fraction * (bounds.maxPrice - bounds.minPrice);

    // Clean price representation: round prices >= 100 to whole numbers to prevent noisy decimals
    const displayPrice = rawPrice >= 100 ? Math.round(rawPrice) : rawPrice;

    ctx.fillText(
      formatPrice({ amount: displayPrice, currency }),
      width - paddingRight + 6,
      y
    );
  }
  ctx.restore();

  // 2. Valuation Range Shaded Band & Base Line Overlay (if enabled)
  if (valuation && valuation.visible && valuation.baseCase > 0) {
    ctx.save();
    const baseY = priceToY(valuation.baseCase, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

    if (valuation.bearCase && valuation.bullCase) {
      const bearY = priceToY(valuation.bearCase, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);
      const bullY = priceToY(valuation.bullCase, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

      // Shaded band
      ctx.fillStyle = theme === 'dark' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(21, 128, 61, 0.05)';
      ctx.fillRect(paddingLeft, Math.min(bearY, bullY), plotWidth, Math.abs(bearY - bullY));

      // Range border lines
      ctx.strokeStyle = theme === 'dark' ? 'rgba(22, 163, 74, 0.30)' : 'rgba(21, 128, 61, 0.25)';
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, Math.round(bearY) + 0.5);
      ctx.lineTo(width - paddingRight, Math.round(bearY) + 0.5);
      ctx.moveTo(paddingLeft, Math.round(bullY) + 0.5);
      ctx.lineTo(width - paddingRight, Math.round(bullY) + 0.5);
      ctx.stroke();
    }

    // Intrinsic value reference line: Green if intrinsic is above market price, Red if below
    const currentPrice = bars.length > 0 ? bars[bars.length - 1].close : valuation.baseCase;
    const isIntrinsicAbove = valuation.baseCase >= currentPrice;
    const lineColor = isIntrinsicAbove ? palette.positive : palette.negative;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, Math.round(baseY) + 0.5);
    ctx.lineTo(width - paddingRight, Math.round(baseY) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 3. Draw Volume Histogram (Lower 18% of canvas)
  if (showVolume && bounds.maxVolume > 0 && bars.length > 0) {
    ctx.save();
    const bottomY = height - paddingBottom;
    const dividerY = bottomY - plotHeight * 0.18;

    // Subtle volume separator line
    ctx.strokeStyle = palette.gridlines;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, Math.round(dividerY) + 0.5);
    ctx.lineTo(width - paddingRight, Math.round(dividerY) + 0.5);
    ctx.stroke();

    const barStep = plotWidth / barSpan;
    // Bound volume bar width strictly between 1px and 16px to prevent blowout
    const barWidth = Math.max(1, Math.min(16, barStep * 0.70));

    for (let i = start; i <= end; i++) {
      const b = bars[i];
      if (!b) continue;

      const x = barIndexToX(i, start, end, dimensions);
      const y = volumeToY(b.volume, bounds.maxVolume, dimensions);
      const barH = bottomY - y;

      const isUp = b.close >= b.open;
      ctx.fillStyle = isUp ? palette.volumeUp : palette.volumeDown;
      ctx.fillRect(x - barWidth / 2, y, barWidth, barH);
    }
    ctx.restore();
  }

  // 4. Draw Main Series: Mountain (Area) or Candlesticks
  if (chartType === 'mountain') {
    ctx.save();
    const bottomY = height - paddingBottom;

    if (start === end) {
      // Single bar graceful fallback: draw clean baseline and accent dot
      const b = bars[start];
      if (b) {
        const x = barIndexToX(start, start, end, dimensions);
        const y = priceToY(b.close, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

        ctx.strokeStyle = palette.priceLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, Math.round(y) + 0.5);
        ctx.lineTo(width - paddingRight, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = palette.priceLine;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Area Gradient Fill
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, bottomY);
      gradient.addColorStop(0, palette.areaGradientTop);
      gradient.addColorStop(1, palette.areaGradientBottom);

      ctx.beginPath();
      let firstX = paddingLeft;
      let lastX = paddingLeft;

      for (let i = start; i <= end; i++) {
        const b = bars[i];
        if (!b) continue;
        const x = barIndexToX(i, start, end, dimensions);
        const y = priceToY(b.close, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

        if (i === start) {
          firstX = x;
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        lastX = x;
      }

      // Close area path
      ctx.lineTo(lastX, bottomY);
      ctx.lineTo(firstX, bottomY);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Sharp crisp Line Stroke
      ctx.beginPath();
      for (let i = start; i <= end; i++) {
        const b = bars[i];
        if (!b) continue;
        const x = barIndexToX(i, start, end, dimensions);
        const y = priceToY(b.close, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

        if (i === start) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = palette.priceLine;
      ctx.lineWidth = 1.75;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Candlesticks Series
    ctx.save();
    const barStep = plotWidth / barSpan;
    const candleWidth = Math.max(1.5, Math.min(20, barStep * 0.72));

    for (let i = start; i <= end; i++) {
      const b = bars[i];
      if (!b) continue;

      const x = barIndexToX(i, start, end, dimensions);
      const openY = priceToY(b.open, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);
      const closeY = priceToY(b.close, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);
      const highY = priceToY(b.high, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);
      const lowY = priceToY(b.low, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);

      const isUp = b.close >= b.open;
      const color = isUp ? palette.positive : palette.negative;

      // 1px Hairline Wick from low to high
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, Math.round(highY));
      ctx.lineTo(Math.round(x) + 0.5, Math.round(lowY));
      ctx.stroke();

      // Body Rect
      const topY = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x - candleWidth / 2),
        Math.round(topY),
        Math.max(1, Math.round(candleWidth)),
        Math.max(1.5, Math.round(bodyHeight))
      );
    }
    ctx.restore();
  }

  // 5. Draw Events Overlay (E, D, S)
  if (events && events.length > 0 && bars.length > 0) {
    ctx.save();
    const dateToIndex = new Map<string, number>();
    for (let i = start; i <= end; i++) {
      if (bars[i]) {
        dateToIndex.set(bars[i].date.slice(0, 10), i);
      }
    }

    for (const ev of events) {
      const barIdx = dateToIndex.get(ev.date.slice(0, 10));
      if (barIdx !== undefined) {
        const x = barIndexToX(barIdx, start, end, dimensions);
        const y = height - paddingBottom - 8;

        // Badge pill
        ctx.fillStyle = palette.priceLine;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.canvasBg;
        ctx.font = 'bold 9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ev.type, x, y);
      }
    }
    ctx.restore();
  }

  // 6. Draw X-Axis Date Labels
  if (bars.length > 0) {
    ctx.save();
    ctx.fillStyle = palette.axisLabels;
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'top';

    const numTicks = Math.min(5, Math.max(2, Math.floor(plotWidth / 140)));
    const step = (end - start) / numTicks;

    for (let t = 0; t <= numTicks; t++) {
      const barIndex = Math.min(end, Math.round(start + t * step));
      const b = bars[barIndex];
      if (b) {
        const x = barIndexToX(barIndex, start, end, dimensions);
        if (t === 0) {
          ctx.textAlign = 'left';
        } else if (t === numTicks) {
          ctx.textAlign = 'right';
        } else {
          ctx.textAlign = 'center';
        }
        ctx.fillText(formatAxisDate(b.date, barSpan), x, height - paddingBottom + 8);
      }
    }
    ctx.restore();
  }

  // 7. Draw Crosshair & Snapped Hover Details
  if (
    crosshairBarIndex !== null &&
    crosshairBarIndex !== undefined &&
    crosshairBarIndex >= start &&
    crosshairBarIndex <= end
  ) {
    const b = bars[crosshairBarIndex];
    if (b) {
      const x = barIndexToX(crosshairBarIndex, start, end, dimensions);
      const closeY = priceToY(b.close, bounds.minPrice, bounds.maxPrice, dimensions, isLogScale);
      const activeY = crosshairY !== null && crosshairY !== undefined ? crosshairY : closeY;

      ctx.save();
      // Vertical hairline
      ctx.strokeStyle = palette.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, paddingTop);
      ctx.lineTo(Math.round(x) + 0.5, height - paddingBottom);
      ctx.stroke();

      // Horizontal hairline
      ctx.beginPath();
      ctx.moveTo(paddingLeft, Math.round(activeY) + 0.5);
      ctx.lineTo(width - paddingRight, Math.round(activeY) + 0.5);
      ctx.stroke();

      // Point indicator
      ctx.fillStyle = palette.crosshairDot;
      ctx.beginPath();
      ctx.arc(x, closeY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Right axis price badge
      const activePrice = isLogScale
        ? Math.exp(Math.log(bounds.minPrice) + (1 - (activeY - paddingTop) / plotHeight) * (Math.log(bounds.maxPrice) - Math.log(bounds.minPrice)))
        : bounds.minPrice + (1 - (activeY - paddingTop) / plotHeight) * (bounds.maxPrice - bounds.minPrice);

      const displayActivePrice = activePrice >= 100 ? Math.round(activePrice) : activePrice;

      ctx.fillStyle = palette.tooltipBg;
      ctx.fillRect(width - paddingRight, activeY - 9, paddingRight - 4, 18);
      ctx.strokeStyle = palette.tooltipBorder;
      ctx.strokeRect(width - paddingRight, activeY - 9, paddingRight - 4, 18);
      ctx.fillStyle = palette.tooltipText;
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatPrice({ amount: displayActivePrice, currency }), width - paddingRight + 4, activeY);

      // Bottom axis date badge
      const dateText = formatDate(b.date);
      const dateWidth = ctx.measureText(dateText).width + 12;
      ctx.fillStyle = palette.tooltipBg;
      ctx.fillRect(x - dateWidth / 2, height - paddingBottom + 4, dateWidth, 18);
      ctx.strokeStyle = palette.tooltipBorder;
      ctx.strokeRect(x - dateWidth / 2, height - paddingBottom + 4, dateWidth, 18);
      ctx.fillStyle = palette.tooltipText;
      ctx.textAlign = 'center';
      ctx.fillText(dateText, x, height - paddingBottom + 13);

      ctx.restore();
    }
  }
}
