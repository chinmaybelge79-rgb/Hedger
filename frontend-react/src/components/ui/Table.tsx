import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = true, hoverable = false, compact = false, children, ...props }, ref) => (
    <div className="table-wrap overflow-x-auto -webkit-overflow-scrolling-touch">
      <table
        ref={ref}
        className={cn('w-full border-collapse min-w-[560px]', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);

Table.displayName = 'Table';

export const Thead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <thead ref={ref} className={cn('', className)} {...props}>{children}</thead>
  )
);

Thead.displayName = 'Thead';

export const Tbody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn('', className)} {...props}>{children}</tbody>
  )
);

Tbody.displayName = 'Tbody';

export const Tr = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement> & { striped?: boolean }>(
  ({ className, striped, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-hairline last:border-b-0', striped && 'even:bg-fog', className)}
      {...props}
    >
      {children}
    </tr>
  )
);

Tr.displayName = 'Tr';

export const Th = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }>(
  ({ className, numeric, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'text-table-th text-ash font-medium text-left px-4 py-2.5 border-b border-hairline whitespace-nowrap',
        numeric && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
);

Th.displayName = 'Th';

export const Td = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }>(
  ({ className, numeric, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-2 text-table-td border-b border-hairline whitespace-nowrap',
        numeric && 'text-right tabular-nums tracking-normal',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);

Td.displayName = 'Td';

export interface TableWrapperProps extends HTMLAttributes<HTMLDivElement> {
  stickyHeader?: boolean;
}

export const TableWrapper = forwardRef<HTMLDivElement, TableWrapperProps>(
  ({ className, stickyHeader = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('table-wrap overflow-x-auto -webkit-overflow-scrolling-touch', stickyHeader && 'sticky top-0', className)}
      {...props}
    >
      {children}
    </div>
  )
);

TableWrapper.displayName = 'TableWrapper';