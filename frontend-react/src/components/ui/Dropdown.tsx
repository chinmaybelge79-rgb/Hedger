import { useState, useRef, useEffect } from 'react';
import { type HTMLAttributes, createPortal } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  header?: boolean;
}

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactElement;
  items: DropdownItem[];
  onSelect?: (value: string, item: DropdownItem) => void;
  position?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'left' | 'right';
  width?: number | 'trigger';
  closeOnSelect?: boolean;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  position = 'bottom',
  align = 'left',
  width = 'trigger',
  closeOnSelect = true,
  className,
  ...props
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => setOpen(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (contentRef.current?.contains(e.target as Node)) return;
      close();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider || item.header) return;
    onSelect?.(item.value, item);
    if (closeOnSelect) close();
  };

  if (!open) return <>{trigger}</>;

  const positionStyles = {
    bottom: 'top-full mt-1.5',
    top: 'bottom-full mb-1.5',
    left: 'right-full mr-1.5',
    right: 'left-full ml-1.5',
  };

  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
  };

  const dropdownContent = (
    <div
      ref={contentRef}
      className={cn(
        'fixed z-[30] w-[260px] bg-paper border border-hairline rounded-card overflow-hidden shadow-cmd animate-fadeIn',
        positionStyles[position],
        alignStyles[align],
        className
      )}
      role="menu"
      {...props}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="border-t border-hairline my-1" role="separator" />;
        }
        if (item.header) {
          return (
            <div
              key={`header-${index}`}
              className="px-3.5 py-2.5 border-b border-hairline text-[10px] tracking-wider uppercase text-ash font-medium bg-fog"
              role="heading"
            >
              {item.label}
            </div>
          );
        }
        return (
          <button
            key={item.value}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => handleItemClick(item)}
            className={cn(
              'w-full text-left px-3.5 py-2.5 text-[13px] bg-paper border-none border-b border-hairline cursor-pointer transition-colors duration-fast flex items-center gap-3',
              item.disabled && 'opacity-50 cursor-not-allowed',
              item.danger && 'text-trend-down',
              'hover:bg-fog focus:bg-fog focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
            )}
          >
            {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="relative inline-block">
        {React.cloneElement(trigger, {
          ref: triggerRef,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            toggle();
            trigger.props?.onClick?.(e);
          },
          'aria-haspopup': 'true',
          'aria-expanded': open,
        })}
        {createPortal(dropdownContent, document.body)}
      </div>
    </>
  );
}