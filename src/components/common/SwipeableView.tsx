import { ReactNode, useEffect, useRef, useState } from 'react';

// Stack to track SwipeableView instances
// The topmost (last) one handles gestures
const instanceStack: number[] = [];
let instanceCounter = 0;

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
  const [isAnimating, setIsAnimating] = useState(false);
  const instanceIdRef = useRef<number | null>(null);

  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isTrackingRef = useRef(false);

  // Register this instance on mount, remove on unmount
  useEffect(() => {
    instanceCounter++;
    const myId = instanceCounter;
    instanceIdRef.current = myId;
    instanceStack.push(myId);

    return () => {
      // Remove this instance from the stack
      const index = instanceStack.indexOf(myId);
      if (index !== -1) {
        instanceStack.splice(index, 1);
      }
    };
  }, []);

  useEffect(() => {
    if (disabled) return;

    const screenWidth = window.innerWidth;
    const edgeWidth = 30;
    const threshold = 0.3;

    const isActiveInstance = () => {
      // This instance is active if it's the last one in the stack
      return instanceStack.length > 0 && instanceStack[instanceStack.length - 1] === instanceIdRef.current;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isActiveInstance()) return;
      if (isAnimating) return;

      const touch = e.touches[0];
      const startX = touch.clientX;

      if (startX <= edgeWidth) {
        isTrackingRef.current = true;
        startXRef.current = startX;
        currentXRef.current = startX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActiveInstance()) return;
      if (!isTrackingRef.current || isAnimating) return;

      const touch = e.touches[0];
      const currentX = touch.clientX;
      const deltaX = currentX - startXRef.current;

      if (deltaX > 0) {
        currentXRef.current = currentX;
        setTranslateX(deltaX);
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!isActiveInstance()) return;
      if (!isTrackingRef.current || isAnimating) return;

      const deltaX = currentXRef.current - startXRef.current;
      const progress = deltaX / screenWidth;

      isTrackingRef.current = false;
      setIsAnimating(true);

      if (progress >= threshold) {
        setTranslateX(screenWidth);
        setTimeout(() => {
          onBack();
          setTranslateX(0);
          setIsAnimating(false);
        }, 250);
      } else {
        setTranslateX(0);
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, onBack, isAnimating]);

  return (
    <div
      style={{
        transform: translateX > 0 ? `translateX(${translateX}px)` : 'none',
        transition: isAnimating ? 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)' : 'none',
      }}
    >
      {children}
    </div>
  );
}
