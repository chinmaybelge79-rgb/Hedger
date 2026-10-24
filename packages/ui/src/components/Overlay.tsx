import React, { useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-[11px] font-normal text-[var(--popover-foreground)] bg-[var(--popover)] border border-[var(--border)] rounded shadow-sm whitespace-nowrap z-50 pointer-events-none"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[var(--popover)]" />
        </div>
      )}
    </div>
  );
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg'
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog box (Spec: Padding 32, internal gaps 16-24) */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-xl bg-[var(--popover)] text-[var(--popover-foreground)] p-8 border border-[var(--border-strong)] shadow-lg z-10 flex flex-col gap-5`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h3 className="text-base font-semibold text-[var(--text)]">{title}</h3>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] text-xl leading-none cursor-pointer rounded-md hover:bg-[var(--bg-hover)]"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
};
