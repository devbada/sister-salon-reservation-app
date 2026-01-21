import { ReactNode } from 'react';
import { Sidebar } from '../navigation/Sidebar';

interface DesktopLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DesktopLayout({ children, currentPage, onNavigate }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* 고정 사이드바 */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-52 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
