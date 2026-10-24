import React from 'react';
import { formatPrice } from '@hedger/format';

export interface ValuationRangeItem {
  label: string;
  low: number;
  base?: number;
  high: number;
}

export interface ValuationVisualizerProps {
  currentPrice: number;
  currency: string;
  ranges: ValuationRangeItem[];
}

export const ValuationVisualizer: React.FC<ValuationVisualizerProps> = ({
  currentPrice,
  currency,
  ranges
}) => {
  const allValues = [
    currentPrice,
    ...ranges.flatMap((r) => [r.low, r.base, r.high].filter((v): v is number => v !== undefined && v > 0))
  ];

  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const totalSpan = maxVal - minVal || 1;

  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - minVal) / totalSpan) * 100));
  };

  const currentPricePct = getPercent(currentPrice);

  return (
    <div className="w-full flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">
            Intrinsic Valuation Ranges (Football-Field Analysis)
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Cross-method intrinsic value distribution vs. Current Market Price
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
          <span className="font-mono text-[var(--foreground)]">
            Current Price: {formatPrice({ amount: currentPrice, currency })}
          </span>
        </div>
      </div>

      <div className="relative flex flex-col gap-5 pt-2 pb-6">
        {/* Current Price Vertical Hairline Benchmark */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
          style={{ left: `${currentPricePct}%` }}
        >
          <div className="w-0.5 h-full bg-[var(--primary)]" />
          <span className="absolute -bottom-5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] whitespace-nowrap shadow-2xs">
            {formatPrice({ amount: currentPrice, currency })}
          </span>
        </div>

        {/* Range Bars */}
        {ranges.map((item, idx) => {
          const leftPct = getPercent(item.low);
          const rightPct = getPercent(item.high);
          const widthPct = Math.max(2, rightPct - leftPct);
          const basePct = item.base ? getPercent(item.base) : null;
          const isUndervalued = (item.base ?? item.low) > currentPrice;

          return (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {formatPrice({ amount: item.low, currency })} — {formatPrice({ amount: item.high, currency })}
                </span>
              </div>

              {/* Floating Range Track */}
              <div className="relative w-full h-7 bg-[var(--secondary)] rounded-md overflow-hidden border border-[var(--border)]">
                <div
                  className={`absolute top-1 bottom-1 rounded transition-all ${
                    isUndervalued ? 'bg-[var(--positive)]/10 border border-[var(--positive)]' : 'bg-[var(--negative)]/10 border border-[var(--negative)]'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`
                  }}
                >
                  {/* Base Point Marker */}
                  {basePct !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[var(--primary)] rounded-full"
                      style={{
                        left: `${Math.max(0, Math.min(100, ((basePct - leftPct) / widthPct) * 100))}%`
                      }}
                      title={`Base Value: ${formatPrice({ amount: item.base, currency })}`}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
