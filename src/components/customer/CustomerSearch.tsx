import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, Phone, Loader2, X } from 'lucide-react';
import { customerApi } from '../../lib/tauri';
import type { Customer } from '../../types';

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  onClear?: () => void;
  selectedCustomer?: Customer | null;
  placeholder?: string;
  className?: string;
}

export function CustomerSearch({
  onSelect,
  onClear,
  selectedCustomer,
  placeholder = '고객 이름 또는 전화번호로 검색...',
  className = '',
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const searchCustomers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await customerApi.search(searchQuery);
      setResults(data);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchCustomers(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchCustomers]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onClear?.();
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleFocus = () => {
    if (query.trim() && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow click events on results
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  // Display selected customer
  if (selectedCustomer) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 ${className}`}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{selectedCustomer.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {selectedCustomer.phone || '전화번호 없음'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600 dark:text-primary-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} onBlur={handleBlur}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 py-1 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              {isLoading ? '검색 중...' : '검색 결과가 없습니다'}
            </li>
          ) : (
            results.map((customer, index) => (
              <li
                key={customer.id}
                onClick={() => handleSelect(customer)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{customer.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {customer.phone && (
                      <>
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{customer.phone}</span>
                      </>
                    )}
                    {customer.totalVisits > 0 && (
                      <span className="ml-2">· {customer.totalVisits}회 방문</span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
