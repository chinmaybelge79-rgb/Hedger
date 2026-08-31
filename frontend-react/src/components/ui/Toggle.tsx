import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'default' | 'sm';
  disabled?: boolean;
  'aria-label'?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onChange, size = 'default', disabled = false, 'aria-label': ariaLabel, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    const sizeStyles = {
      default: 'w-[40px] h-[22px]',
      sm: 'w-[32px] h-[18px]',
    };

    const knobSize = size === 'default' ? 'w-[18px] h-[18px]' : 'w-[14px] h-[14px]';
    const knobTranslate = size === 'default' ? 'translate-x-[20px]' : 'translate-x-[16px]';

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center rounded-full border-none cursor-pointer transition-colors duration-slow',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-trend-up' : 'bg-hairline',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] rounded-full bg-paper shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-transform duration-slow',
            checked && knobTranslate,
            knobSize
          )}
          aria-hidden="true"
        />
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';