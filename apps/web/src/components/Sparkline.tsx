import React from 'react';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 72,
  height = 22,
  isPositive,
  strokeWidth = 1.5,
  className = ''
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width: `${width}px`, height: `${height}px` }} className={className} />;
  }

  const validData = data.filter((v) => typeof v === 'number' && !isNaN(v));
  if (validData.length < 2) {
    return <div style={{ width: `${width}px`, height: `${height}px` }} className={className} />;
  }

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min === 0 ? 1 : max - min;

  // Determine positive/negative if not explicitly provided
  const positive = isPositive !== undefined ? isPositive : validData[validData.length - 1] >= validData[0];
  const strokeColor = positive ? '#107C41' : '#B3261E';

  const padding = 2;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const points = validData.map((val, idx) => {
    const x = padding + (idx / (validData.length - 1)) * drawWidth;
    const y = height - padding - ((val - min) / range) * drawHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`sparkline-svg ${className}`}
      style={{ overflow: 'visible', display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};