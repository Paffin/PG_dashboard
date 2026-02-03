import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Copy, Check } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { exportCSV, exportJSON, copyToClipboard, toCSV, formatDateForFilename } from '../../lib/export';

interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  maxWidth?: string;
  truncate?: boolean;
}

interface DataTableProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string | number;
  /** Enable export buttons */
  exportable?: boolean;
  /** Base filename for exports (without extension) */
  exportFilename?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends object>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey,
  exportable = false,
  exportFilename = 'export',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copied, setCopied] = useState(false);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    if (sortColumn === column.key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortColumn];
      const bVal = (b as Record<string, unknown>)[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection]);

  // Get export columns (exclude render-only columns like 'actions')
  const exportColumns = useMemo(() => {
    return columns
      .filter(col => col.key !== 'actions')
      .map(col => ({ key: col.key as keyof T, header: col.header }));
  }, [columns]);

  const handleExportCSV = () => {
    const filename = `${exportFilename}_${formatDateForFilename()}`;
    exportCSV(sortedData as Record<string, unknown>[], filename, exportColumns as { key: string; header: string }[]);
  };

  const handleExportJSON = () => {
    const filename = `${exportFilename}_${formatDateForFilename()}`;
    exportJSON(sortedData, filename);
  };

  const handleCopy = async () => {
    const csv = toCSV(sortedData as Record<string, unknown>[], exportColumns as { key: string; header: string }[]);
    const success = await copyToClipboard(csv);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return <Skeleton variant="table-row" count={5} />;
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--text-tertiary)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Export toolbar */}
      {exportable && data.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleCopy}
            className="btn btn-ghost btn-sm text-[var(--text-secondary)]"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--success)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-ghost btn-sm text-[var(--text-secondary)]"
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="btn btn-ghost btn-sm text-[var(--text-secondary)]"
            title="Export as JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column)}
                  style={{ width: column.width }}
                  className={`
                    ${alignClasses[column.align || 'left']}
                    ${column.sortable ? 'cursor-pointer hover:bg-[var(--bg-overlay)] select-none' : ''}
                  `}
                >
                  <div className={`
                    flex items-center gap-1.5
                    ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}
                  `}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-[var(--text-muted)]">
                        {sortColumn === column.key && sortDirection === 'asc' && (
                          <ChevronUp className="w-3.5 h-3.5" />
                        )}
                        {sortColumn === column.key && sortDirection === 'desc' && (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        {(sortColumn !== column.key || !sortDirection) && (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row) : idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{ maxWidth: column.maxWidth }}
                    className={`
                      ${alignClasses[column.align || 'left']}
                      ${column.truncate ? 'truncate' : ''}
                    `}
                  >
                    {column.render
                      ? column.render((row as Record<string, unknown>)[column.key], row)
                      : String((row as Record<string, unknown>)[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
