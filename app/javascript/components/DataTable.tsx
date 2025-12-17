import React, { useState, useMemo } from 'react';
import { colors } from '../lib/theme';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (item: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onRowSelect?: (id: string | number, selected: boolean) => void;
  selectedIds?: Set<string | number>;
  bulkActions?: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  getRowId,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  onRowSelect,
  selectedIds = new Set(),
  bulkActions,
  maxHeight = '600px',
  className = '',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Check if all rows are selected
  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  const hasCheckbox = !!onRowSelect;
  const totalColumns = hasCheckbox ? columns.length + 1 : columns.length;
  const checkboxColSpan = 1;
  const dataColSpan = hasCheckbox ? (12 - checkboxColSpan) / columns.length : 12 / columns.length;

  const handleSelectAll = (checked: boolean) => {
    if (onRowSelect) {
      data.forEach((item) => {
        onRowSelect(getRowId(item), checked);
      });
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle dates
      if (aValue instanceof Date || (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))) {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Handle strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'asc' ? (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      );
    }
    return (
      <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
        <svg className="w-3 h-3 -mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 border-2 border-black bg-white px-6 py-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="h-6 w-6 animate-spin border-4 border-black border-t-transparent rounded-full"></div>
        <span className="font-mono text-sm uppercase font-bold">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Column Headers */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: colors.primary.pink }}>
        <div className="grid grid-cols-12 gap-4 px-6 py-3 items-center border-b-2 border-black">
          {/* Checkbox Column */}
          {hasCheckbox && (
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 border-2 border-white rounded cursor-pointer focus:ring-2 focus:ring-white focus:ring-offset-1"
                style={{ accentColor: 'white' }}
              />
            </div>
          )}
          
          {/* Column Headers */}
          {columns.map((column) => {
            const colSpan = Math.floor(dataColSpan);
            return (
              <div
                key={column.key}
                className={`col-span-${colSpan}`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.sortable !== false ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="text-sm font-semibold text-white hover:text-white transition-colors flex items-center gap-1.5 group"
                  >
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-white">{column.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200" style={{ maxHeight, overflowY: 'auto' }}>
        {sortedData.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          sortedData.map((item) => {
            const rowId = getRowId(item);
            const isSelected = selectedIds.has(rowId);
            
            return (
              <div
                key={rowId}
                className={`group bg-white hover:bg-gray-50 transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-pink-50' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                  {/* Checkbox */}
                  {hasCheckbox && (
                    <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onRowSelect!(rowId, e.target.checked)}
                        className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
                        style={{ accentColor: colors.primary.pink }}
                      />
                    </div>
                  )}
                  
                  {/* Data Cells */}
                  {columns.map((column) => {
                    const colSpan = Math.floor(dataColSpan);
                    return (
                      <div
                        key={column.key}
                        className={`col-span-${colSpan}`}
                        style={column.width ? { width: column.width } : {}}
                      >
                        {column.render ? column.render(item) : <span className="text-sm text-gray-900">{item[column.key] || '—'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Actions Bar */}
      {bulkActions && selectedIds.size > 0 && (
        <div className="border-t border-gray-300 bg-gray-50 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          {bulkActions}
        </div>
      )}
    </div>
  );
}

export default DataTable;
