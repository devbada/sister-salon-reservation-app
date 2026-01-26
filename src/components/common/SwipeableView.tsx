import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSwipeBack } from '../../hooks/useSwipeBack';

interface SwipeableViewProps {
  children: ReactNode;
  onBack: () => void;
  title?: string;
  showHeader?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SwipeableView({
  children,
  onBack,
  title,
  showHeader = true,
  disabled = false,
  className = '',
}: SwipeableViewProps) {
  const { handlers, style, overlayOpacity, isActive, progress } = useSwipeBack({
    onBack,
    disabled,
  });

  // Previous page parallax effect (-30% offset)
  const previousPageOffset = isActive ? -30 * (1 - progress) : -30;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Previous page peek (shown during swipe) */}
      {isActive && (
        <div
          className="absolute inset-0 bg-gray-100 dark:bg-gray-900"
          style={{
            transform: `translateX(${previousPageOffset}%)`,
            transition: isActive ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          <div className="p-4 pt-safe">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      )}

      {/* Shadow overlay during swipe */}
      {isActive && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-10"
          style={{
            opacity: overlayOpacity,
            transition: isActive ? 'none' : 'opacity 0.3s ease-out',
          }}
        />
      )}

      {/* Main content */}
      <div
        {...handlers}
        style={style}
        className={`relative w-full h-full bg-white dark:bg-gray-900 z-20 ${className}`}
      >
        {/* Left edge indicator during swipe */}
        {isActive && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-primary-400 to-transparent z-30"
            style={{
              opacity: Math.min(progress * 3, 1),
            }}
          />
        )}

        {/* Header with back button */}
        {showHeader && (
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-3 px-4 py-3 pt-safe">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 -ml-2 p-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">뒤로</span>
              </button>
              {title && (
                <h1 className="text-lg font-semibold flex-1 text-center pr-16">{title}</h1>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Simple back header without swipe functionality
interface BackHeaderProps {
  onBack: () => void;
  title?: string;
}

export function BackHeader({ onBack, title }: BackHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center gap-3 px-4 py-3 pt-safe">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 -ml-2 p-2 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">뒤로</span>
        </button>
        {title && (
          <h1 className="text-lg font-semibold flex-1 text-center pr-16">{title}</h1>
        )}
      </div>
    </div>
  );
}
