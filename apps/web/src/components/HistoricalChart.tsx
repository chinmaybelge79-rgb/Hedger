import React, { useState, useMemo } from 'react';
import type { HistoricalBar } from '@hedger/types';
import { formatPrice, formatDate } from '@hedger/format';
import { SegmentedControl } from '@hedger/ui';

export interface HistoricalChartProps {
  bars: HistoricalBar[];
  currency?: string;
  onPeriodChange?: (period: string) => void;
  currentPeriod?: string;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  bars,
  currency = 'INR',
  onPeriodChange,
  currentPeriod = '1y'
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { minPrice, maxPrice, validBars } = useMemo(() => {
    const valid = bars.filter((b) => b.close > 0);
    if (valid.length === 0) return { minPrice: 0, maxPrice: 100, validBars: [] };
    let min = Infinity;
    let max = -Infinity;
    for (const b of valid) {
      if (b.close < min) min = b.close;
      if (b.close > max) max = b.close;
    }
    const padding = (max - min) * 0.05 || 10;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      validBars: valid
    };
  }, [bars]);

  const activeBar = hoverIndex !== null && validBars[hoverIndex] ? validBars[hoverIndex] : validBars[validBars.length - 1];

  const svgWidth = 720;
  const svgHeight = 260;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    if (validBars.length < 2) return '';
    return validBars
      .map((bar, idx) => {
        const x = padLeft + (idx / (validBars.length - 1)) * chartWidth;
        const normY = (bar.close - minPrice) / (maxPrice - minPrice || 1);
        const y = padTop + chartHeight - normY * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [validBars, minPrice, maxPrice, chartWidth, chartHeight]);

  // Horizontal hairline grid levels (3 levels)
  const gridLevels = [0.25, 0.5, 0.75].map((lvl) => {
    const val = minPrice + lvl * (maxPrice - minPrice);
    const y = padTop + chartHeight - lvl * chartHeight;
    return { val, y };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (validBars.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normX = Math.max(0, Math.min(1, (clientX - padLeft) / chartWidth));
    const idx = Math.round(normX * (validBars.length - 1));
    setHoverIndex(idx);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Chart Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          {activeBar && (
            <>
              <span className="text-lg font-semibold text-[var(--text)] tnum">
                {formatPrice({ amount: activeBar.close, currency })}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {formatDate(activeBar.date)}
              </span>
            </>
          )}
        </div>

        {onPeriodChange && (
          <SegmentedControl
            options={[
              { label: '1M', value: '1mo' },
              { label: '6M', value: '6mo' },
              { label: '1Y', value: '1y' },
              { label: '5Y', value: '5y' }
            ]}
            value={currentPeriod}
            onChange={onPeriodChange}
          />
        )}
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-hidden border border-[var(--border)] rounded-md bg-white p-2">
        {validBars.length > 1 ? (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Hairlines */}
            {gridLevels.map((lvl, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={lvl.y}
                  x2={svgWidth - padRight}
                  y2={lvl.y}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={lvl.y + 3}
                  textAnchor="end"
                  className="fill-[var(--text-faint)] text-[9px] font-mono tnum"
                >
                  {formatPrice({ amount: lvl.val, currency })}
                </text>
              </g>
            ))}

            {/* Price Polyline */}
            <polyline
              fill="none"
              stroke="var(--text)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Interactive Crosshair */}
            {hoverIndex !== null && validBars[hoverIndex] && (
              (() => {
                const idx = hoverIndex;
                const bar = validBars[idx]!;
                const x = padLeft + (idx / (validBars.length - 1)) * chartWidth;
                const normY = (bar.close - minPrice) / (maxPrice - minPrice || 1);
                const y = padTop + chartHeight - normY * chartHeight;
                return (
                  <g>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + chartHeight}
                      stroke="var(--border-strong)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="var(--accent)"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })()
            )}
          </svg>
        ) : (
          <div className="py-20 text-center text-xs text-[var(--text-muted)]">
            Historical chart data loading or unavailable.
          </div>
        )}
      </div>
    </div>
  );
};
