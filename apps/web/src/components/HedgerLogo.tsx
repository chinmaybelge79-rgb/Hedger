import React from 'react';
import { useTheme } from '../context/ThemeContext.js';

export interface HedgerLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  variant?: 'auto' | 'black-on-white' | 'white-on-black';
  trimmed?: boolean;
}

export const HedgerLogo: React.FC<HedgerLogoProps> = ({
  size = 28,
  width,
  height,
  className = '',
  variant = 'auto',
  trimmed = false
}) => {
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext.resolvedTheme === 'dark';
  } catch {
    // If used outside ThemeProvider, fallback to DOM inspection
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }
  }

  const effectiveVariant = variant === 'auto'
    ? (isDark ? 'white-on-black' : 'black-on-white')
    : variant;

  const bg = effectiveVariant === 'white-on-black' ? '#000000' : '#FFFFFF';
  const fg = effectiveVariant === 'white-on-black' ? '#FFFFFF' : '#000000';

  if (trimmed) {
    const actualHeight = height || size || 28;
    const actualWidth = width || Math.round(actualHeight * (178 / 244));
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="161 101 178 244"
        width={actualWidth}
        height={actualHeight}
        className={className}
        role="img"
        aria-label="Hedger"
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0
        }}
      >
        <g fill={fg}>
          {/* top-left L */}
          <path d="M161 101H185V184H267V208H161Z" />
          {/* top-right bar */}
          <rect x="315" y="101" width="24" height="107" />
          {/* bottom-left bar */}
          <rect x="161" y="238" width="24" height="107" />
          {/* bottom-right hook */}
          <path d="M232 238H339V345H315V262H232Z" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Hedger"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: `${Math.round(size * 0.22)}px`,
        flexShrink: 0
      }}
    >
      <rect
        width="500"
        height="500"
        fill={bg}
        rx="96"
      />
      <g fill={fg}>
        {/* top-left L */}
        <path d="M161 101H185V184H267V208H161Z" />
        {/* top-right bar */}
        <rect x="315" y="101" width="24" height="107" />
        {/* bottom-left bar */}
        <rect x="161" y="238" width="24" height="107" />
        {/* bottom-right hook */}
        <path d="M232 238H339V345H315V262H232Z" />
      </g>
    </svg>
  );
};
