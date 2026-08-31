import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'default', hoverable = false, children, ...props }, ref) => {
    const variantStyles = {
      default: 'border border-hairline rounded-card bg-paper',
      bordered: 'border border-hairline rounded-card bg-paper',
      elevated: 'border border-hairline rounded-card bg-paper shadow-cmd',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      default: 'p-4',
      lg: 'p-6',
    };

    const hoverStyles = hoverable ? 'transition-colors duration-normal hover:border-ash' : '';

    return (
      <div
        ref={ref}
        className={cn(variantStyles[variant], paddingStyles[padding], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-3 border-b border-hairline flex items-center justify-between gap-3', className)}
        {...props}
      >
        <div>
          {title && <h3 className="text-card-title text-graphite">{title}</h3>}
          {subtitle && <p className="text-xs text-ash mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3 border-t border-hairline bg-fog flex items-center justify-end gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';