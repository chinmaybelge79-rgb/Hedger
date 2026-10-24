import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className = '' }) => {
  return (
    <nav className={`flex border-b border-[var(--border)] space-x-6 sm:space-x-8 ${className}`} aria-label="Tabs">
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] h-[44px] flex items-center text-[13px] font-medium border-b-2 transition-all cursor-pointer select-none -mb-px px-1 ${
              isActive
                ? 'border-[var(--primary)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};

export interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Segmented Control
 * Spec: 3 px track padding, 4 px between items, item padding 6x14
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div
      className={`segmented-control inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--secondary)] ${className}`}
      style={{ padding: '3px', gap: '4px' }}
      role="group"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`segmented-item rounded-md font-medium transition-all cursor-pointer select-none ${
              isSelected
                ? 'active bg-[var(--card)] text-[var(--foreground)] shadow-2xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
            style={{ padding: '6px 14px' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <kbd
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border border-[#D1D1D6] bg-white text-[#6E6E73] ${className}`}
    >
      {children}
    </kbd>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse rounded bg-[#E5E5EA] ${className}`} />
  );
};

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] ${className}`}
    >
      {icon && <div className="mb-3 text-[var(--text-muted)]">{icon}</div>}
      <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">{title}</h4>
      {description && <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4 leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-2xs ${className}`}
    >
      <div className="w-8 h-8 rounded-full bg-[#FDF3F3] text-[#B3261E] flex items-center justify-center mb-3 text-sm font-semibold">
        !
      </div>
      <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-medium px-3.5 h-[44px] min-h-[44px] rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)] cursor-pointer inline-flex items-center"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Koyfin DataTable
 * Spec: Table cells padding 13x16; header 12x16; row separators 1px #F2F2F5
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  className = ''
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Financial Data Table"
      className={`table-container ${className}`}
    >
      <table className="koyfin-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{ padding: '12px 16px' }}
                className={
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={keyExtractor(row, rowIdx)} style={{ borderBottom: '1px solid #F2F2F5' }}>
              {columns.map((col, colIdx) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right tnum'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';
                let cellContent: React.ReactNode = null;
                if (col.cell) {
                  cellContent = col.cell(row);
                } else if (col.accessorKey) {
                  const val = row[col.accessorKey];
                  cellContent = val !== undefined && val !== null ? String(val) : '—';
                }
                return (
                  <td key={colIdx} style={{ padding: '13px 16px' }} className={alignClass}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
