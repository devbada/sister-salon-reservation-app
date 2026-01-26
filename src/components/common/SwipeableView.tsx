import { ReactNode, useEffect, useRef, useState } from 'react';

interface SwipeableViewProps {
  children: ReactNode;
  onBack: () => void;
  disabled?: boolean;
}

export function SwipeableView({
  children,
  onBack,
  disabled = false,
}: SwipeableViewProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const screenWidth = window.innerWidth;
    const edgeWidth = 40; // 40px from left edge
    const threshold = 0.25; // 25% of screen width

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startX = touch.clientX;

      // Start tracking if touch is near left edge
      if (startX <= edgeWidth) {
        isTrackingRef.current = true;
        startXRef.current = startX;
        currentXRef.current = startX;
        setIsActive(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current) return;

      const touch = e.touches[0];
      const currentX = touch.clientX;
      const deltaX = currentX - startXRef.current;

      // Only allow rightward swipe
      if (deltaX > 0) {
        currentXRef.current = currentX;
        setTranslateX(deltaX);

        // Prevent scrolling while swiping
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isTrackingRef.current) return;

      const deltaX = currentXRef.current - startXRef.current;
      const progress = deltaX / screenWidth;

      if (progress >= threshold) {
        // Animate out and go back
        setTranslateX(screenWidth);
        setTimeout(() => {
          onBack();
          setTranslateX(0);
          setIsActive(false);
        }, 150);
      } else {
        // Snap back
        setTranslateX(0);
        setIsActive(false);
      }

      isTrackingRef.current = false;
    };

    // Add touch listeners to document to capture all touches
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, onBack]);

  const progress = translateX / (typeof window !== 'undefined' ? window.innerWidth : 375);

  return (
    <>
      {/* Dark overlay */}
      {isActive && (
        <div
          className="fixed inset-0 bg-black z-40 pointer-events-none"
          style={{ opacity: 0.3 * (1 - progress) }}
        />
      )}

      {/* Content wrapper */}
      <div
        className="relative"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isActive ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {/* Left edge visual indicator */}
        {isActive && (
          <div
            className="fixed left-0 top-0 bottom-0 w-1 bg-primary-500 z-50"
            style={{
              opacity: Math.min(progress * 3, 1),
              transform: `translateX(${translateX}px)`,
            }}
          />
        )}

        {children}
      </div>
    </>
  );
}
