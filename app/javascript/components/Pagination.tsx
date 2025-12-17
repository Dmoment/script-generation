import React from 'react';
import { colors } from '../lib/theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  className = '',
}) => {
  // Calculate page range to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Show max 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Results info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
        <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalItems}</span> projects
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-4 py-2 text-sm font-medium rounded-md border-2 transition-all duration-200
            ${currentPage === 1
              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-white'
              : 'border-gray-300 text-gray-700 bg-white hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
            }
          `}
          style={{
            borderColor: currentPage === 1 ? '#E5E7EB' : undefined,
          }}
        >
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`
                  min-w-[40px] px-3 py-2 text-sm font-medium rounded-md border-2 transition-all duration-200
                  ${isActive
                    ? 'text-white border-pink-500'
                    : 'border-gray-300 text-gray-700 bg-white hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
                  }
                `}
                style={
                  isActive
                    ? {
                        backgroundColor: colors.primary.pink,
                        borderColor: colors.primary.pink,
                      }
                    : undefined
                }
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-4 py-2 text-sm font-medium rounded-md border-2 transition-all duration-200
            ${currentPage === totalPages
              ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-white'
              : 'border-gray-300 text-gray-700 bg-white hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50'
            }
          `}
          style={{
            borderColor: currentPage === totalPages ? '#E5E7EB' : undefined,
          }}
        >
          <span className="flex items-center gap-1">
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;

