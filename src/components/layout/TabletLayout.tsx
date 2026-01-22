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
    <div className="fixed inset-0 flex bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <main
        className={`flex-1 px-6 pb-6 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'ml-52' : 'ml-[72px]'
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <div className="max-w-4xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
