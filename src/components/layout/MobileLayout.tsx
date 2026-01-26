import { ReactNode } from 'react';
import { Scissors } from 'lucide-react';
import { BottomTabs } from '../navigation/BottomTabs';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onResetTab?: (page: string) => void;
}

export function MobileLayout({ children, currentPage, onNavigate, onResetTab }: MobileLayoutProps) {
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

      {/* Main Content - add bottom padding for nav */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 pb-24">
        <div className="animate-fade-in max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomTabs
        currentPage={currentPage}
        onNavigate={onNavigate}
        onResetTab={onResetTab}
      />
    </div>
  );
}

