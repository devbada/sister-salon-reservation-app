import { ReactNode, useState } from 'react';
import { CollapsibleSidebar } from '../navigation/CollapsibleSidebar';

interface TabletLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function TabletLayout({ children, currentPage, onNavigate }: TabletLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* 접이식 사이드바 */}
      <CollapsibleSidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 메인 콘텐츠 */}
      <main className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-48' : 'ml-16'}`}>
        {children}
      </main>
    </div>
  );
}
