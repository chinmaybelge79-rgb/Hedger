import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import type { HistoricalBar } from '@hedger/types';
import { formatPrice, formatDelta, formatCompact, formatDate } from '@hedger/format';
import {
  calculateVisibleBounds,
  xToBarIndex,
  type ChartDimensions,
  DEFAULT_DIMENSIONS
} from './coordinates.js';
import {
  renderChart,
  type ChartEvent,
  type ValuationOverlayProps
} from './canvasRenderer.js';

export interface HedgerChartProps {
  bars: HistoricalBar[];
  currency?: string;
  defaultPeriod?: string;
  onPeriodChange?: (period: string) => void;
  valuation?: ValuationOverlayProps;
  events?: ChartEvent[];
  height?: number;
  loading?: boolean;
  compact?: boolean;
  theme?: 'light' | 'dark';
}

export const HedgerChart: React.FC<HedgerChartProps> = ({
  bars,
  currency = 'INR',
  defaultPeriod = '5y',
  onPeriodChange,
  valuation,
  events,
  height = 420,
  loading = false,
  compact = false,
  theme: propTheme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic Theme Detection & Live Reactivity
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    if (propTheme) return propTheme;
    if (typeof document !== 'undefined') {
      const dt = document.documentElement.getAttribute('data-theme');
      if (dt === 'dark' || document.documentElement.classList.contains('dark')) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (propTheme) {
      setCurrentTheme(propTheme);
      return;
    }
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      const dt = document.documentElement.getAttribute('data-theme');
      const isDark = dt === 'dark' || document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    return () => observer.disconnect();
  }, [propTheme]);

  // Chart configuration state
  const [period, setPeriod] = useState<string>(() => {
    const p = (defaultPeriod || '1y').toLowerCase();
    return p === 'all' || p === 'max' ? '5y' : p;
  });
  const [chartType, setChartType] = useState<'mountain' | 'candles'>('mountain');
  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showValuation, setShowValuation] = useState<boolean>(!!valuation?.visible);
  const [showEvents, setShowEvents] = useState<boolean>(true);

  // Sync internal period with prop if updated from outside (clamp max to 5y)
  useEffect(() => {
    if (defaultPeriod) {
      const p = defaultPeriod.toLowerCase();
      setPeriod(p === 'all' || p === 'max' ? '5y' : p);
    }
  }, [defaultPeriod]);

  // Viewport zoom & pan range [startIndex .. endIndex]
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // Crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    ...DEFAULT_DIMENSIONS,
    width: 800,
    height
  });

  // Sort and sanitize valid bars
  const sortedBars = useMemo(() => {
    if (!bars || bars.length === 0) return [];
    return [...bars]
      .filter((b) => b && b.close > 0 && b.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bars]);

  // Filter bars according to timeframe period (1M, 6M, 1Y, 3Y, 5Y) - max 5 years
  const filteredBars = useMemo(() => {
    if (sortedBars.length === 0) return [];

    const latest = new Date(sortedBars[sortedBars.length - 1].date);
    const cutoff = new Date(latest);

    if (period === '1m' || period === '1mo') cutoff.setMonth(cutoff.getMonth() - 1);
    else if (period === '6m' || period === '6mo') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (period === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    else if (period === '3y') cutoff.setFullYear(cutoff.getFullYear() - 3);
    else cutoff.setFullYear(cutoff.getFullYear() - 5); // 5Y is max

    const filtered = sortedBars.filter((b) => new Date(b.date) >= cutoff);
    return filtered.length > 5 ? filtered : sortedBars;
  }, [sortedBars, period]);

  // Reset viewport range when bars or period change
  useEffect(() => {
    if (filteredBars.length > 0) {
      setRange({ start: 0, end: filteredBars.length - 1 });
    }
  }, [filteredBars]);

  // ResizeObserver for responsive canvas width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setDimensions((prev) => ({
          ...prev,
          width: Math.floor(entry.contentRect.width),
          height
        }));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  // Render loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredBars.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const bounds = calculateVisibleBounds(filteredBars, range.start, range.end);

    renderChart(ctx, filteredBars, {
      dimensions,
      bounds,
      chartType,
      isLogScale,
      currency,
      showVolume,
      events: showEvents ? events : [],
      valuation: valuation ? { ...valuation, visible: showValuation } : undefined,
      crosshairBarIndex: hoverIndex,
      crosshairY: hoverY,
      theme: currentTheme
    });

    ctx.restore();
  }, [
    dimensions,
    filteredBars,
    range,
    chartType,
    isLogScale,
    currency,
    showVolume,
    showValuation,
    showEvents,
    events,
    valuation,
    hoverIndex,
    hoverY,
    currentTheme
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pan interaction
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartRange = useRef({ start: 0, end: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartRange.current = { ...range };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || filteredBars.length === 0) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.current) {
      const deltaX = e.clientX - dragStartX.current;
      const plotWidth = dimensions.width - dimensions.paddingLeft - dimensions.paddingRight;
      const count = Math.max(1, dragStartRange.current.end - dragStartRange.current.start);
      const barsDelta = Math.round((-deltaX / plotWidth) * count);

      let newStart = dragStartRange.current.start + barsDelta;
      let newEnd = dragStartRange.current.end + barsDelta;

      if (newStart < 0) {
        newEnd -= newStart;
        newStart = 0;
      }
      if (newEnd >= filteredBars.length) {
        newStart -= (newEnd - filteredBars.length + 1);
        newEnd = filteredBars.length - 1;
        newStart = Math.max(0, newStart);
      }

      setRange({ start: newStart, end: newEnd });
    } else {
      // Crosshair tracking
      const snappedIndex = xToBarIndex(
        mouseX,
        range.start,
        range.end,
        filteredBars.length,
        dimensions
      );
      setHoverIndex(snappedIndex);
      setHoverY(mouseY);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setHoverIndex(null);
    setHoverY(null);
  };

  // Zoom interaction via wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Enforce an institutional minimum bar threshold (at least 20 bars)
    // to strictly prevent over-zooming that would distort bars or collide with axis numbers/letters.
    const MIN_ZOOM_BARS = Math.min(filteredBars.length, 20);
    if (filteredBars.length <= MIN_ZOOM_BARS) return;

    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    const count = range.end - range.start;
    const newCount = Math.max(MIN_ZOOM_BARS, Math.min(filteredBars.length, Math.round(count * zoomFactor)));

    const rect = canvasRef.current?.getBoundingClientRect();
    const mouseX = rect ? e.clientX - rect.left : dimensions.width / 2;
    const plotWidth = dimensions.width - dimensions.paddingLeft - dimensions.paddingRight;
    const fraction = Math.max(0, Math.min(1, (mouseX - dimensions.paddingLeft) / plotWidth));

    let newStart = Math.max(0, Math.round(range.start + (count - newCount) * fraction));
    let newEnd = Math.min(filteredBars.length - 1, newStart + newCount);

    if (newEnd - newStart < newCount && newStart > 0) {
      newStart = Math.max(0, newEnd - newCount);
    }

    setRange({ start: newStart, end: newEnd });
  };

  // Double click resets view
  const handleDoubleClick = () => {
    setRange({ start: 0, end: filteredBars.length - 1 });
  };

  // Current bar under crosshair or latest bar
  const activeBar = hoverIndex !== null && filteredBars[hoverIndex]
    ? filteredBars[hoverIndex]
    : filteredBars[filteredBars.length - 1];

  const prevBar = hoverIndex !== null && hoverIndex > 0
    ? filteredBars[hoverIndex - 1]
    : filteredBars.length > 1
    ? filteredBars[filteredBars.length - 2]
    : null;

  const barChange = activeBar && prevBar ? activeBar.close - prevBar.close : 0;
  const barChangePct = prevBar && prevBar.close > 0 ? barChange / prevBar.close : 0;
  const isUp = barChange >= 0;

  const timeframes = compact
    ? ['1m', '6m', '1y', '5y']
    : ['1m', '6m', '1y', '3y', '5y'];

  return (
    <div ref={containerRef} style={{ width: '100%', userSelect: 'none', backgroundColor: 'transparent', borderRadius: '10px' }}>
      {/* Top Controls Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        {/* Timeframe Segmented Control */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--secondary)',
            padding: '3px',
            borderRadius: '7px',
            border: '1px solid var(--border)',
            gap: '2px'
          }}
        >
          {timeframes.map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  onPeriodChange?.(p);
                }}
                style={{
                  height: '28px',
                  padding: '0 10px',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--primary-foreground)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.12)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease'
                }}
              >
                {p.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Chart View Toggles & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Mountain vs Candle Segmented Control */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--secondary)',
              padding: '3px',
              borderRadius: '7px',
              border: '1px solid var(--border)',
              gap: '2px'
            }}
          >
            <button
              onClick={() => setChartType('mountain')}
              style={{
                height: '28px',
                padding: '0 9px',
                fontSize: '11px',
                fontWeight: chartType === 'mountain' ? 600 : 500,
                borderRadius: '5px',
                border: 'none',
                backgroundColor: chartType === 'mountain' ? 'var(--card)' : 'transparent',
                color: chartType === 'mountain' ? 'var(--foreground)' : 'var(--text-muted)',
                boxShadow: chartType === 'mountain' ? '0 1px 2px rgba(0, 0, 0, 0.12)' : 'none',
                cursor: 'pointer'
              }}
            >
              Mountain
            </button>
            <button
              onClick={() => setChartType('candles')}
              style={{
                height: '28px',
                padding: '0 9px',
                fontSize: '11px',
                fontWeight: chartType === 'candles' ? 600 : 500,
                borderRadius: '5px',
                border: 'none',
                backgroundColor: chartType === 'candles' ? 'var(--card)' : 'transparent',
                color: chartType === 'candles' ? 'var(--foreground)' : 'var(--text-muted)',
                boxShadow: chartType === 'candles' ? '0 1px 2px rgba(0, 0, 0, 0.12)' : 'none',
                cursor: 'pointer'
              }}
            >
              Candles
            </button>
          </div>

          {!compact && (
            <>
              {/* Linear vs Log Scale Segmented Control */}
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'var(--secondary)',
                  padding: '3px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  gap: '2px'
                }}
              >
                <button
                  onClick={() => setIsLogScale(false)}
                  style={{
                    height: '28px',
                    padding: '0 9px',
                    fontSize: '11px',
                    fontWeight: !isLogScale ? 600 : 500,
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: !isLogScale ? 'var(--card)' : 'transparent',
                    color: !isLogScale ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: !isLogScale ? '0 1px 2px rgba(0, 0, 0, 0.12)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Linear
                </button>
                <button
                  onClick={() => setIsLogScale(true)}
                  style={{
                    height: '28px',
                    padding: '0 9px',
                    fontSize: '11px',
                    fontWeight: isLogScale ? 600 : 500,
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: isLogScale ? 'var(--card)' : 'transparent',
                    color: isLogScale ? 'var(--foreground)' : 'var(--text-muted)',
                    boxShadow: isLogScale ? '0 1px 2px rgba(0, 0, 0, 0.12)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Log scale
                </button>
              </div>

              {/* Volume Toggle */}
              <button
                onClick={() => setShowVolume((prev) => !prev)}
                style={{
                  height: '28px',
                  padding: '0 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: showVolume ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: showVolume ? 'var(--primary)' : 'var(--card)',
                  color: showVolume ? 'var(--primary-foreground)' : 'var(--text-muted)',
                  fontWeight: showVolume ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                Vol
              </button>

              {/* Valuation Overlay Toggle */}
              {valuation && (
                <button
                  onClick={() => setShowValuation((prev) => !prev)}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: showValuation ? '1px solid var(--positive)' : '1px solid var(--border)',
                    backgroundColor: showValuation ? 'rgba(22, 163, 74, 0.12)' : 'var(--card)',
                    color: showValuation ? 'var(--positive)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: showValuation ? 600 : 400
                  }}
                >
                  DCF ƒ
                </button>
              )}

              {/* Events Overlay Toggle */}
              {events && events.length > 0 && (
                <button
                  onClick={() => setShowEvents((prev) => !prev)}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: showEvents ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: showEvents ? 'var(--primary)' : 'var(--card)',
                    color: showEvents ? 'var(--primary-foreground)' : 'var(--text-muted)',
                    fontWeight: showEvents ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  Events
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Crosshair / Bar Inspection HUD */}
      {activeBar ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '10px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {compact ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{formatDate(activeBar.date)}</span>
              <span>
                Close: <strong style={{ color: 'var(--foreground)' }}>{formatPrice({ amount: activeBar.close, currency })}</strong>
              </span>
              <span style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                {formatDelta(barChange, barChangePct, currency)}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{formatDate(activeBar.date)}</span>
              <span>
                Close: <strong style={{ color: 'var(--foreground)' }}>{formatPrice({ amount: activeBar.close, currency })}</strong>
              </span>
              <span>Open: {formatPrice({ amount: activeBar.open, currency })}</span>
              <span>High: {formatPrice({ amount: activeBar.high, currency })}</span>
              <span>Low: {formatPrice({ amount: activeBar.low, currency })}</span>
              {activeBar.volume > 0 && <span>Vol: {formatCompact({ amount: activeBar.volume, currency })}</span>}
              <span style={{ fontWeight: 600, color: isUp ? 'var(--positive)' : 'var(--negative)' }}>
                {formatDelta(barChange, barChangePct, currency)}
              </span>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--positive)',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              Streaming 60 FPS trajectory...
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: '24px', marginBottom: '10px' }} />
      )}

      {/* Main Canvas Element or Fallback */}
      {filteredBars.length > 0 ? (
        <div style={{ position: 'relative', width: '100%', height: `${dimensions.height}px`, overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            style={{
              display: 'block',
              maxWidth: '100%',
              cursor: isDragging.current ? 'grabbing' : 'crosshair'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: `${dimensions.height}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '6px',
            backgroundColor: 'var(--secondary)',
            borderRadius: '8px',
            border: '1px dashed var(--border)'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
            {loading ? 'Streaming 60 FPS trajectory bars...' : 'Historical price data unavailable'}
          </div>
          <div style={{ fontSize: '11px' }}>
            {loading
              ? 'Computing trading-day coordinates and valuation models'
              : 'No trading session bars returned for this timeframe'}
          </div>
        </div>
      )}
    </div>
  );
};
