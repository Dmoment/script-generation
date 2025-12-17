import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colors } from '../lib/theme';
import { useProjectTypesQuery } from '../queries/projectTypes/useProjectTypesQuery';
import { useCreateProjectTypeMutation } from '../queries/projectTypes/useCreateProjectTypeMutation';

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Type to search or create...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [displayValue, setDisplayValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search term for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch project types from API
  const { data: projectTypes = [], isLoading, isError } = useProjectTypesQuery(
    isOpen ? debouncedSearchTerm : undefined
  );

  // Create project type mutation
  const createMutation = useCreateProjectTypeMutation();

  // Convert API response to options format
  const options = projectTypes.map(pt => ({
    value: pt.name,
    label: pt.name,
    id: pt.id,
  }));

  const selectedOption = options.find(opt => opt.value === value);

  // Check if we should show "create new" option
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const showCreateOption = 
    normalizedSearch.length > 0 && 
    !options.some(opt => opt.label.toLowerCase() === normalizedSearch);

  // Update display value when value prop changes
  useEffect(() => {
    if (!isOpen) {
      setDisplayValue(value);
    }
  }, [value, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        setDisplayValue(value);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = options.length + (showCreateOption ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < totalItems - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            if (highlightedIndex < options.length) {
              handleSelect(options[highlightedIndex].value);
            } else if (showCreateOption) {
              handleCreateNew();
            }
          } else if (normalizedSearch.length > 0 && showCreateOption) {
            // If no item highlighted but search term exists, create new
            handleCreateNew();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          setDisplayValue(value);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, showCreateOption, highlightedIndex, normalizedSearch, value]);

  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
    setDisplayValue(selectedValue);
  }, [onChange]);

  const handleCreateNew = useCallback(async () => {
    const newValue = searchTerm.trim();
    if (!newValue) return;

    try {
      // Create the new project type via API
      await createMutation.mutateAsync({ name: newValue });
      // Select the newly created type
      handleSelect(newValue);
    } catch (error) {
      console.error('Failed to create project type:', error);
      // Still allow selection even if creation fails (might already exist)
      handleSelect(newValue);
    }
  }, [searchTerm, createMutation, handleSelect]);

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
    inputRef.current?.select();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setDisplayValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setSearchTerm('');
      inputRef.current?.select();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input/Button */}
      <div
        onClick={handleInputClick}
        className="w-full px-4 py-3 border-2 border-black bg-white font-mono text-sm focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 cursor-text transition-all duration-200 flex items-center justify-between group"
        style={{
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="flex-1 flex items-center gap-2">
          {!isOpen && selectedOption && (
            <div 
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.status.green }}
            >
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
          />
          {isOpen && isLoading && (
            <svg className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Helper text */}
      {!isOpen && (
        <p className="mt-1 text-[10px] text-gray-500 font-mono">
          Click to search or type to create new
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border-2 border-black max-h-60 overflow-auto"
          style={{
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {isLoading && options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 font-mono text-center">
              Searching...
            </div>
          ) : isError ? (
            <div className="px-4 py-3 text-sm text-red-500 font-mono text-center">
              Error loading options
            </div>
          ) : options.length === 0 && !showCreateOption ? (
            <div className="px-4 py-3 text-sm text-gray-500 font-mono text-center">
              {searchTerm ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            <>
              {options.map((option, index) => (
                <button
                  key={option.id || option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-sm font-mono transition-all duration-150 ${
                    value === option.value
                      ? 'text-white'
                      : 'text-black'
                  }`}
                  style={
                    value === option.value
                      ? {
                          backgroundColor: colors.primary.pink,
                          fontWeight: 'bold',
                        }
                      : highlightedIndex === index
                      ? {
                          backgroundColor: 'rgba(242, 85, 110, 0.1)', // Light pink hover
                        }
                      : {}
                  }
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{option.label}</span>
                    {value === option.value && (
                      <div 
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={createMutation.isPending}
                  className={`w-full text-left px-4 py-3 text-sm font-mono transition-all duration-150 border-t-2 border-gray-200 ${createMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                  style={{
                    color: colors.primary.pink,
                    fontWeight: 'bold',
                    backgroundColor: highlightedIndex === options.length 
                      ? 'rgba(242, 85, 110, 0.1)' // Light pink hover
                      : 'transparent',
                  }}
                  onMouseEnter={() => setHighlightedIndex(options.length)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                >
                  <div className="flex items-center gap-3">
                    {createMutation.isPending ? (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 animate-spin text-white" fill="none" viewBox="0 0 24 24" style={{ color: colors.primary.pink }}>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div 
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary.pink }}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                    <span>{createMutation.isPending ? 'Creating...' : `Create "${searchTerm.trim()}"`}</span>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
