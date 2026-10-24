import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none min-h-[44px] h-[44px] box-border';
  
  const sizeStyles = {
    sm: 'text-xs px-3.5 gap-2',
    md: 'text-sm px-4 gap-2'
  }[size];

  const variantStyles = {
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-2xs active:scale-[0.99]',
    secondary: 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] hover:border-[var(--border-strong)] active:scale-[0.99]',
    ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]'
  }[variant];

  return (
    <button className={`${base} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};
