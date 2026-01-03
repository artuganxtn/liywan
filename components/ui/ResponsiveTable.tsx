import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  accessor?: (item: T) => any;
  mobileHidden?: boolean;
  mobilePriority?: number; // Lower number = higher priority on mobile
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  mobileCardRender?: (item: T) => React.ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  // Separate columns by mobile visibility
  const mobileColumns = columns
    .filter(col => !col.mobileHidden)
    .sort((a, b) => (a.mobilePriority || 999) - (b.mobilePriority || 999))
    .slice(0, 3); // Show max 3 columns on mobile

  const desktopColumns = columns;

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {mobileCardRender ? (
              mobileCardRender(item)
            ) : (
              <Card
                className={`p-4 ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                <div className="space-y-3">
                  {mobileColumns.map((column) => {
                    const value = column.accessor
                      ? column.accessor(item)
                      : (item as any)[column.key];
                    const content = column.render
                      ? column.render(item, index)
                      : value;

                    return (
                      <div key={column.key} className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
                          {column.header}:
                        </span>
                        <span className="text-sm text-gray-900 text-right flex-1 min-w-0 break-words">
                          {content || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              {desktopColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <motion.tr
                key={keyExtractor(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {desktopColumns.map((column) => {
                  const value = column.accessor
                    ? column.accessor(item)
                    : (item as any)[column.key];
                  const content = column.render
                    ? column.render(item, index)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {content || '-'}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

