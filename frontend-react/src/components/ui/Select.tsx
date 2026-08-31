import { forwardRef, type SelectHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const selectId = useId();
    const inputId = id || selectId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-graphite mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border border-hairline rounded-input bg-paper px-3 py-2 text-sm outline-none transition-colors duration-normal',
            'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22%3E%3Cpath fill=%22%238A8A8A%22 d=%22M3 4.5l3 3 3-3%22/%3E%3C/svg%3E")] bg-[right_0.75rem_center] bg-no-repeat pr-10',
            error && 'border-trend-down focus:border-trend-down focus:ring-trend-down',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-trend-down" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-ash">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';