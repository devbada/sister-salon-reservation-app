import { useMemo } from 'react';
import { useDeviceType } from './useDeviceType';

interface ResponsiveValues<T> {
  mobile?: T;
  tablet?: T;
  desktop: T;
}

export function useResponsive<T>(values: ResponsiveValues<T>): T {
  const deviceType = useDeviceType();

  return useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return values.mobile ?? values.tablet ?? values.desktop;
      case 'tablet':
        return values.tablet ?? values.desktop;
      default:
        return values.desktop;
    }
  }, [deviceType, values.mobile, values.tablet, values.desktop]);
}

export function useIsMobile(): boolean {
  return useDeviceType() === 'mobile';
}

export function useIsTablet(): boolean {
  return useDeviceType() === 'tablet';
}

export function useIsDesktop(): boolean {
  return useDeviceType() === 'desktop';
}
