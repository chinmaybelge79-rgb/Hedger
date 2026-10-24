import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  subtle?: boolean;
}

export const Card: React.FC<CardProps> = ({ subtle, className = '', children, ...props }) => {
  return (
    <div
      className={`rounded-lg border border-[#E5E5EA] ${
        subtle ? 'bg-[#FAFAFC]' : 'bg-white'
      } p-6 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface DeltaProps {
  value: number | null | undefined;
  formatted?: string;
  className?: string;
}

export const Delta: React.FC<DeltaProps> = ({ value, formatted, className = '' }) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className={`text-[#6E6E73] font-mono ${className}`}>—</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const arrow = isPositive ? '▲' : isNegative ? '▼' : '';
  const textClass = isPositive
    ? 'text-[#107C41]'
    : isNegative
    ? 'text-[#B3261E]'
    : 'text-[#6E6E73]';

  const defaultFormatted = `${arrow} ${Math.abs(value * 100).toFixed(2)}%`;

  return (
    <span className={`inline-flex items-center gap-1 font-medium tnum ${textClass} ${className}`}>
      <span className="text-[10px]">{arrow}</span>
      <span>{formatted ? formatted.replace(/^[▲▼\+\-]/, '').trim() : defaultFormatted}</span>
    </span>
  );
};

export interface BadgeProps {
  variant?: 'neutral' | 'up' | 'down';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = ''
}) => {
  const styles = {
    neutral: 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]',
    up: 'bg-[#F4FBF7] text-[#107C41] border-[#B7E4C7]',
    down: 'bg-[#FDF3F3] text-[#B3261E] border-[#F8C8C8]'
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${styles} ${className}`}
    >
      {children}
    </span>
  );
};

export interface FreshnessBadgeProps {
  type: 'LIVE' | 'DELAYED' | 'EOD' | 'ANNUAL' | 'QUARTERLY' | 'CALCULATED' | 'SAMPLE';
  detail?: string;
  source?: string;
  asOf?: string;
  className?: string;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({
  type,
  detail,
  source,
  asOf,
  className = ''
}) => {
  const labelMap = {
    LIVE: 'LIVE',
    DELAYED: detail ? `DELAYED ${detail}` : 'DELAYED 15m',
    EOD: detail ? `EOD · ${detail}` : 'END OF DAY',
    ANNUAL: detail ? `ANNUAL · ${detail}` : 'ANNUAL',
    QUARTERLY: detail ? `QUARTERLY · ${detail}` : 'QUARTERLY',
    CALCULATED: 'CALCULATED',
    SAMPLE: 'SAMPLE'
  };

  const title = `Source: ${source || 'Exchange'} · As of: ${asOf || 'Recent'}`;

  return (
    <span
      title={title}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border bg-[#F9F9FB] border-[#E5E5EA] text-[#6E6E73] tracking-wide cursor-help select-none ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[#6E6E73]" />
      {labelMap[type]}
    </span>
  );
};

export interface StatProps {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, delta, meta, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-normal text-[#6E6E73] tracking-normal">{label}</span>
      <div className="flex items-baseline gap-2.5">
        <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--foreground)] tnum">
          {value}
        </span>
        {delta && <div className="text-xs">{delta}</div>}
      </div>
      {meta && <div className="text-[11px] text-[#6E6E73]">{meta}</div>}
    </div>
  );
};
