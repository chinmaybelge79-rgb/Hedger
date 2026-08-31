import { type HTMLAttributes, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  className,
  ...props
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      contentRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
      if (e.key === 'Tab') {
        const focusableElements = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape]);

  if (!open) return null;

  const sizeStyles = {
    sm: 'max-w-[360px]',
    default: 'max-w-[560px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[960px]',
    full: 'max-w-[92vw]',
  };

  const modalContent = (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'w-full bg-paper border border-hairline rounded-dialog shadow-cmd overflow-hidden animate-cmdSlideIn',
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || description) && (
          <div className="px-4 py-3 border-b border-hairline flex items-start justify-between gap-3">
            <div>
              {title && <h2 id="modal-title" className="text-base font-semibold text-ink">{title}</h2>}
              {description && <p id="modal-description" className="text-sm text-ash mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-md text-ash hover:text-ink hover:bg-fog transition-colors duration-fast"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-graphite mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="btn-secondary"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'danger' ? 'btn-primary bg-trend-up border-trend-up hover:bg-trend-up/90' : 'btn-primary'}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}