import { useState, useRef, useEffect } from 'react';
import { type HTMLAttributes, createPortal } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  offset?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  offset = 8,
  ...props
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-ink border-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-ink border-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-ink border-transparent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-ink border-transparent',
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') hideTooltip();
  };

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    trigger.addEventListener('mouseenter', showTooltip);
    trigger.addEventListener('mouseleave', hideTooltip);
    trigger.addEventListener('focus', showTooltip);
    trigger.addEventListener('blur', hideTooltip);
    trigger.addEventListener('keydown', handleKeyDown);

    return () => {
      trigger.removeEventListener('mouseenter', showTooltip);
      trigger.removeEventListener('mouseleave', hideTooltip);
      trigger.removeEventListener('focus', showTooltip);
      trigger.removeEventListener('blur', hideTooltip);
      trigger.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delay]);

  if (!visible) return <span ref={triggerRef} {...props}>{children}</span>;

  const tooltip = (
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[100] px-2.5 py-1.5 text-[11px] text-ash bg-ink rounded-[4px] whitespace-nowrap pointer-events-none animate-fadeIn',
        positionStyles[position]
      )}
      style={{
        transformOrigin: position === 'top' || position === 'bottom' ? 'center top' : 'center left',
      }}
      role="tooltip"
    >
      {content}
      <div
        className="absolute w-0 h-0 border-4"
        style={{
          borderColor:
            position === 'top'
              ? 'var(--ink) transparent transparent transparent'
              : position === 'bottom'
              ? 'transparent transparent var(--ink) transparent'
              : position === 'left'
              ? 'transparent transparent transparent var(--ink)'
              : 'transparent var(--ink) transparent transparent',
        }}
      />
    </div>
  );

  return (
    <>
      <span ref={triggerRef} {...props}>{children}</span>
      {createPortal(tooltip, document.body)}
    </>
  );
}