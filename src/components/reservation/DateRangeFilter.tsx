import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'last_3_months' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onDateRangeChange: (range: DateRange | null, preset: DateRangePreset) => void;
  currentPreset: DateRangePreset;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'this_week', label: '이번 주' },
  { value: 'this_month', label: '이번 달' },
  { value: 'last_3_months', label: '최근 3개월' },
  { value: 'custom', label: '직접 선택' },
];

export function DateRangeFilter({
  selectedDate,
  onDateChange,
  onDateRangeChange,
  currentPreset,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(selectedDate);
  const [customTo, setCustomTo] = useState(selectedDate);

  const getPresetDateRange = (preset: DateRangePreset): DateRange | null => {
    const today = new Date();

    switch (preset) {
      case 'today':
        return null; // Use single date mode
      case 'this_week': {
        const start = startOfWeek(today, { locale: ko });
        const end = endOfWeek(today, { locale: ko });
        return {
          from: format(start, 'yyyy-MM-dd'),
          to: format(end, 'yyyy-MM-dd'),
        };
      }
      case 'this_month': {
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return {
          from: format(start, 'yyyy-MM-dd'),
          to: format(end, 'yyyy-MM-dd'),
        };
      }
      case 'last_3_months': {
        const start = startOfMonth(subMonths(today, 2));
        const end = endOfMonth(today);
        return {
          from: format(start, 'yyyy-MM-dd'),
          to: format(end, 'yyyy-MM-dd'),
        };
      }
      case 'custom':
        return {
          from: customFrom,
          to: customTo,
        };
      default:
        return null;
    }
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      onDateChange(today);
      onDateRangeChange(null, preset);
    } else if (preset === 'custom') {
      // Keep dropdown open for custom selection
      onDateRangeChange({ from: customFrom, to: customTo }, preset);
    } else {
      const range = getPresetDateRange(preset);
      onDateRangeChange(range, preset);
    }

    if (preset !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleCustomRangeApply = () => {
    onDateRangeChange({ from: customFrom, to: customTo }, 'custom');
    setIsOpen(false);
  };

  const getCurrentLabel = () => {
    const preset = presets.find(p => p.value === currentPreset);
    if (!preset) return '오늘';

    if (currentPreset === 'today') {
      return format(new Date(selectedDate), 'M월 d일 (EEE)', { locale: ko });
    }

    if (currentPreset === 'custom') {
      return `${format(new Date(customFrom), 'M/d')} - ${format(new Date(customTo), 'M/d')}`;
    }

    return preset.label;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-white/10
                   rounded-xl border border-gray-200/50 dark:border-gray-700/50
                   hover:bg-white/70 dark:hover:bg-white/20 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getCurrentLabel()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 z-50 w-72
                          bg-white dark:bg-gray-800 rounded-xl shadow-xl
                          border border-gray-200 dark:border-gray-700
                          overflow-hidden">
            {/* Presets */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-1">
                {presets.filter(p => p.value !== 'custom').map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetChange(preset.value)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors
                      ${currentPreset === preset.value
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Date (for today mode) */}
            {currentPreset === 'today' && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  날짜 선택
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    onDateChange(e.target.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                             dark:border-gray-600 bg-white dark:bg-gray-700
                             text-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Custom Range */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  기간 직접 선택
                </span>
                {currentPreset === 'custom' && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">선택됨</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200
                             dark:border-gray-600 bg-white dark:bg-gray-700
                             text-gray-900 dark:text-white"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-gray-200
                             dark:border-gray-600 bg-white dark:bg-gray-700
                             text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleCustomRangeApply}
                className="w-full mt-2 px-3 py-2 text-sm font-medium text-white
                           bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
