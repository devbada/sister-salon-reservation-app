import { ReactNode } from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { DesktopLayout } from './DesktopLayout';
import { TabletLayout } from './TabletLayout';
import { MobileLayout } from './MobileLayout';

interface ResponsiveContainerProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function ResponsiveContainer({ children, currentPage, onNavigate }: ResponsiveContainerProps) {
  const deviceType = useDeviceType();

  switch (deviceType) {
    case 'mobile':
      return (
        <MobileLayout currentPage={currentPage} onNavigate={onNavigate}>
          {children}
        </MobileLayout>
      );
    case 'tablet':
      return (
        <TabletLayout currentPage={currentPage} onNavigate={onNavigate}>
          {children}
        </TabletLayout>
      );
    default:
      return (
        <DesktopLayout currentPage={currentPage} onNavigate={onNavigate}>
          {children}
        </DesktopLayout>
      );
  }
}
