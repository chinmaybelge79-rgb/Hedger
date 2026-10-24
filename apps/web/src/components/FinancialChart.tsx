import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  AreaSeries,
  HistogramSeries,
  CandlestickSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time
} from 'lightweight-charts';
import type { HistoricalBar } from '@hedger/types';
import { formatPrice, formatDate } from '@hedger/format';

export interface FinancialChartProps {
  bars: HistoricalBar[];
  currency?: string;
  onPeriodChange?: (period: string) => void;
  currentPeriod?: string;
}

export const FinancialChart: React.FC<FinancialChartProps> = ({
  bars,
  currency = 'INR',
  onPeriodChange,
  currentPeriod = '1y'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');
  const [showSma, setShowSma] = useState<boolean>(true);
  const [crosshairData, setCrosshairData] = useState<{
    time: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    change?: number;
    changePercent?: number;
  } | null>(null);

  const validBars = React.useMemo(() => {
    return bars
      .filter((b) => b && b.close > 0 && b.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bars]);

  const latestBar = validBars[validBars.length - 1];
  const firstBar = validBars[0];
  const totalChange = latestBar && firstBar ? latestBar.close - firstBar.close : 0;
  const totalChangePercent = firstBar && firstBar.close > 0 ? totalChange / firstBar.close : 0;
  const isPositive = totalChange >= 0;

  useEffect(() => {
    if (!chartContainerRef.current || validBars.length === 0) return;

    // Clear any previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = 400;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#6E6E73',
        fontSize: 11,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif'
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#F0F0F3', style: 1 }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#6E6E73',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1D1D1F'
        },
        horzLine: {
          color: '#6E6E73',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1D1D1F'
        }
      },
      rightPriceScale: {
        borderColor: '#E5E5EA',
        scaleMargins: {
          top: 0.08,
          bottom: 0.22 // Leave room for volume histogram
        },
        alignLabels: true
      },
      timeScale: {
        borderColor: '#E5E5EA',
        fixLeftEdge: true,
        fixRightEdge: true,
        timeVisible: true
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    chartRef.current = chart;

    // 1. Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#E5E5EA',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume'
    });

    const volumeData: HistogramData[] = validBars.map((b) => ({
      time: b.date as Time,
      value: b.volume || 0,
      color: b.close >= (b.open || b.close) ? '#EBF5F0' : '#FDF0F0'
    }));
    volumeSeries.setData(volumeData);

    // 2. Add Main Price Series (Area or Candlestick)
    if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isPositive ? 'rgba(16, 124, 65, 0.16)' : 'rgba(211, 47, 47, 0.16)',
        bottomColor: isPositive ? 'rgba(16, 124, 65, 0.00)' : 'rgba(211, 47, 47, 0.00)',
        lineColor: isPositive ? '#107C41' : '#D32F2F',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#FFFFFF',
        crosshairMarkerBackgroundColor: isPositive ? '#107C41' : '#D32F2F'
      });

      const lineData: LineData[] = validBars.map((b) => ({
        time: b.date as Time,
        value: b.close
      }));
      areaSeries.setData(lineData);
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#107C41',
        downColor: '#D32F2F',
        borderVisible: false,
        wickUpColor: '#107C41',
        wickDownColor: '#D32F2F'
      });

      const candleData: CandlestickData[] = validBars.map((b) => ({
        time: b.date as Time,
        open: b.open || b.close,
        high: b.high || b.close,
        low: b.low || b.close,
        close: b.close
      }));
      candleSeries.setData(candleData);
    }

    // 3. Optional Technical Indicator: SMA 20 Overlay (Koyfin Precision)
    if (showSma && validBars.length >= 20) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#6E6E73',
        lineWidth: 1,
        crosshairMarkerVisible: false,
        title: 'SMA 20'
      });

      const smaData: LineData[] = [];
      for (let i = 19; i < validBars.length; i++) {
        let sum = 0;
        for (let j = i - 19; j <= i; j++) {
          sum += validBars[j].close;
        }
        smaData.push({
          time: validBars[i].date as Time,
          value: parseFloat((sum / 20).toFixed(2))
        });
      }
      smaSeries.setData(smaData);
    }

    // 4. Crosshair Move Handler for Koyfin-style instant header readout
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setCrosshairData(null);
        return;
      }

      const dateStr = String(param.time);
      const match = validBars.find((b) => b.date === dateStr);
      if (match) {
        const prevIdx = validBars.indexOf(match) - 1;
        const prevClose = prevIdx >= 0 ? validBars[prevIdx]?.close ?? match.close : match.close;
        const change = match.close - prevClose;
        const changePercent = prevClose > 0 ? change / prevClose : 0;

        setCrosshairData({
          time: match.date,
          close: match.close,
          open: match.open,
          high: match.high,
          low: match.low,
          volume: match.volume,
          change,
          changePercent
        });
      }
    });

    chart.timeScale().fitContent();

    // Resize Observer for responsive recalculation
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [validBars, chartType, showSma, isPositive]);

  const activeDisplay = crosshairData || (latestBar ? {
    time: latestBar.date,
    close: latestBar.close,
    open: latestBar.open,
    high: latestBar.high,
    low: latestBar.low,
    volume: latestBar.volume,
    change: totalChange,
    changePercent: totalChangePercent
  } : null);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Chart Toolbar (Koyfin + Apple Minimalist) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E5E5EA]">
        {/* Dynamic Price & OHLC Readout */}
        <div className="flex flex-wrap items-baseline gap-4">
          {activeDisplay && (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tnum tracking-tight">
                  {formatPrice({ amount: activeDisplay.close, currency })}
                </span>
                {activeDisplay.changePercent !== undefined && (
                  <span
                    className={`text-xs font-semibold tnum ${
                      activeDisplay.changePercent >= 0 ? 'text-[#107C41]' : 'text-[#D32F2F]'
                    }`}
                  >
                    {activeDisplay.changePercent >= 0 ? '▲ +' : '▼ '}
                    {(Math.abs(activeDisplay.changePercent) * 100).toFixed(2)}%
                  </span>
                )}
              </div>

              {/* High-precision OHLC Header row (Koyfin standard) */}
              <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-[#6E6E73]">
                {activeDisplay.open && <span>O: <strong className="text-[#1D1D1F]">{activeDisplay.open.toFixed(2)}</strong></span>}
                {activeDisplay.high && <span>H: <strong className="text-[#1D1D1F]">{activeDisplay.high.toFixed(2)}</strong></span>}
                {activeDisplay.low && <span>L: <strong className="text-[#1D1D1F]">{activeDisplay.low.toFixed(2)}</strong></span>}
                {activeDisplay.volume && <span>Vol: <strong className="text-[#1D1D1F]">{(activeDisplay.volume / 1e6).toFixed(2)}M</strong></span>}
                <span>Date: <strong className="text-[#1D1D1F]">{formatDate(activeDisplay.time)}</strong></span>
              </div>
            </>
          )}
        </div>

        {/* Chart Style, Indicators & Timeframe Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Indicator: SMA 20 Toggle */}
          <button
            onClick={() => setShowSma((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer ${
              showSma
                ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                : 'bg-white text-[#6E6E73] border-[#E5E5EA] hover:border-[#D1D1D6]'
            }`}
            title="Toggle 20-Day Simple Moving Average"
          >
            SMA 20
          </button>

          {/* Area vs Candles Toggle */}
          <div className="inline-flex rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] p-0.5">
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                chartType === 'candles'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Candles
            </button>
          </div>

          {/* Timeframe Intervals */}
          {onPeriodChange && (
            <div className="inline-flex rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] p-0.5">
              {[
                { label: '1M', value: '1mo' },
                { label: '6M', value: '6mo' },
                { label: '1Y', value: '1y' },
                { label: '5Y', value: '5y' }
              ].map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => onPeriodChange(tf.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    currentPeriod === tf.value
                      ? 'bg-white text-[#1D1D1F] shadow-2xs font-semibold'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Mount Container */}
      <div
        ref={chartContainerRef}
        className="w-full relative rounded-lg overflow-hidden bg-white"
        style={{ minHeight: '400px' }}
      >
        {validBars.length === 0 && (
          <div className="flex items-center justify-center h-80 text-xs text-[#6E6E73]">
            Loading high-performance financial chart data...
          </div>
        )}
      </div>
    </div>
  );
};