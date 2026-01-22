import { ReactNode } from 'react';
import { Scissors } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function MobileLayout({ children, currentPage, onNavigate }: MobileLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-950">
      {/* Header */}
      <header
        className="flex-shrink-0 glass border-b border-white/10"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 36px)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold logo-text leading-tight">
                Sisters Salon
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Reservation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
        <div className="animate-fade-in max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 glass border-t border-white/10 pb-8">
        <div className="flex justify-around items-center h-14 px-2 max-w-lg mx-auto">
          {[
            { id: 'reservations', icon: 'calendar', label: '예약' },
            { id: 'designers', icon: 'users', label: '디자이너' },
            { id: 'business-hours', icon: 'clock', label: '영업시간' },
            { id: 'settings', icon: 'settings', label: '설정' },
          ].map((tab) => {
            const isActive = currentPage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`bottom-tab ${isActive ? 'bottom-tab-active' : ''}`}
              >
                <TabIcon name={tab.icon} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Simple icon component
function TabIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactElement> = {
    calendar: (
      <svg className="bottom-tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    users: (
      <svg className="bottom-tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    clock: (
      <svg className="bottom-tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    settings: (
      <svg className="bottom-tab-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  };
  return icons[name] || null;
}
