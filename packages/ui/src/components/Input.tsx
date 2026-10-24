import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`w-full min-h-[44px] h-[44px] box-border rounded-md border px-3.5 text-sm bg-[var(--input-bg)] text-[var(--foreground)] transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent ${
          error ? 'border-[var(--down)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`min-h-[44px] h-[44px] box-border rounded-md border px-3.5 text-sm bg-[var(--input-bg)] text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent ${
          error ? 'border-[var(--down)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
