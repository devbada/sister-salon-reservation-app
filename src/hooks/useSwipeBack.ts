import { useState, useCallback } from 'react';

interface SwipeState {
  isActive: boolean;
  startX: number;
  currentX: number;
  startTime: number;
}

interface UseSwipeBackOptions {
  onBack: () => void;
  threshold?: number; // Percentage of screen width (0-1)
  edgeWidth?: number; // Edge detection zone in pixels
  velocityThreshold?: number; // px/s
  disabled?: boolean;
}

interface UseSwipeBackReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  style: React.CSSProperties;
  overlayOpacity: number;
  isActive: boolean;
  progress: number; // 0-1
}

export function useSwipeBack({
  onBack,
  threshold = 0.4,
  edgeWidth = 25,
  velocityThreshold = 500,
  disabled = false,
}: UseSwipeBackOptions): UseSwipeBackReturn {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
  });

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      const startX = touch.clientX;

      // Only start if touch begins at left edge
      if (startX <= edgeWidth) {
        setSwipeState({
          isActive: true,
          startX,
          currentX: startX,
          startTime: Date.now(),
        });
      }
    },
    [disabled, edgeWidth]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.isActive || disabled) return;

      const touch = e.touches[0];
      const currentX = touch.clientX;

      // Only allow swiping to the right
      if (currentX >= swipeState.startX) {
        setSwipeState((prev) => ({
          ...prev,
          currentX,
        }));
      }
    },
    [swipeState.isActive, swipeState.startX, disabled]
  );

  const handleTouchEnd = useCallback(
    () => {
      if (!swipeState.isActive || disabled) return;

      const deltaX = swipeState.currentX - swipeState.startX;
      const deltaTime = Date.now() - swipeState.startTime;
      const velocity = deltaX / (deltaTime / 1000); // px/s
      const progress = deltaX / screenWidth;

      // Trigger back if threshold met or velocity is high enough
      const shouldGoBack = progress >= threshold || velocity >= velocityThreshold;

      if (shouldGoBack) {
        // Animate to completion before calling onBack
        setSwipeState((prev) => ({
          ...prev,
          currentX: screenWidth + prev.startX,
        }));

        // Small delay for animation
        setTimeout(() => {
          onBack();
          setSwipeState({
            isActive: false,
            startX: 0,
            currentX: 0,
            startTime: 0,
          });
        }, 200);
      } else {
        // Snap back
        setSwipeState({
          isActive: false,
          startX: 0,
          currentX: 0,
          startTime: 0,
        });
      }
    },
    [swipeState, screenWidth, threshold, velocityThreshold, onBack, disabled]
  );

  const deltaX = swipeState.isActive ? swipeState.currentX - swipeState.startX : 0;
  const progress = Math.min(deltaX / screenWidth, 1);
  const overlayOpacity = swipeState.isActive ? 0.5 * (1 - progress) : 0;

  const style: React.CSSProperties = {
    transform: swipeState.isActive ? `translateX(${deltaX}px)` : 'translateX(0)',
    transition: swipeState.isActive ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    style,
    overlayOpacity,
    isActive: swipeState.isActive,
    progress,
  };
}
