import { ReactNode } from 'react';
import { BottomTabs } from '../navigation/BottomTabs';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function MobileLayout({ children, currentPage, onNavigate }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* 헤더 */}
      <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between safe-area-top">
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Sisters Salon
        </h1>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {children}
      </main>

      {/* 바텀 탭 */}
      <BottomTabs currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
}
