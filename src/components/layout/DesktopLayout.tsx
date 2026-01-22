import { ReactNode } from 'react';
import { Sidebar } from '../navigation/Sidebar';

interface DesktopLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DesktopLayout({ children, currentPage, onNavigate }: DesktopLayoutProps) {
  return (
    <div className="fixed inset-0 flex bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950">
      {/* Fixed Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main Content */}
      <main
        className="flex-1 ml-56 px-8 pb-8 overflow-y-auto"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <div className="max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
