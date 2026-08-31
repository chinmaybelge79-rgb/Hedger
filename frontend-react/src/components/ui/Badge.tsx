import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'default' | 'sm';
}

export function Badge({ className, variant = 'default', size = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-fog text-ink border border-hairline',
    success: 'bg-trend-up/10 text-trend-up border-trend-up/20',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    danger: 'bg-trend-down/10 text-trend-down border-trend-down/20',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
    outline: 'bg-transparent text-ink border border-hairline',
  };

  const sizeStyles = {
    default: 'px-2.5 py-0.5 text-[11px]',
    sm: 'px-2 py-0 text-[10px]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[1px]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface CheckBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  checked?: boolean;
}

export function CheckBadge({ className, checked = true, ...props }: CheckBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'w-[14px] h-[14px] border border-ink rounded-[1px] text-[10px] leading-none',
        className
      )}
      {...props}
    >
      {checked && '✓'}
    </span>
  );
}

export interface DashBadgeProps extends HTMLAttributes<HTMLSpanElement> {}

export function DashBadge({ className, ...props }: DashBadgeProps) {
  return (
    <span className={cn('text-ash', className)} {...props}>
      —
    </span>
  );
}