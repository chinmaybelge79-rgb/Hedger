import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface KbdProps extends HTMLAttributes<HTMLSpanElement> {}

export function Kbd({ className, children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center font-sans text-[11px] text-ash border border-hairline rounded-[3px] px-1.5 py-0.5 leading-none bg-fog',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}