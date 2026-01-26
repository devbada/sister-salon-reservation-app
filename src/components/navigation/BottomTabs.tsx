import { useRef, useCallback } from 'react';
import { Calendar, Users, Settings, UserRoundSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BottomTabsProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onResetTab?: (page: string) => void;
}

interface TabItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'reservations', icon: Calendar, label: '예약' },
  { id: 'customers', icon: UserRoundSearch, label: '고객' },
  { id: 'designers', icon: Users, label: '디자이너' },
  { id: 'settings', icon: Settings, label: '설정' },
];

const DOUBLE_TAP_DELAY = 300; // ms

export function BottomTabs({ currentPage, onNavigate, onResetTab }: BottomTabsProps) {
  const lastTapRef = useRef<{ tab: string; time: number } | null>(null);

  const handleTabClick = useCallback((tabId: string) => {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap && lastTap.tab === tabId && now - lastTap.time < DOUBLE_TAP_DELAY) {
      // Double tap detected on the same tab
      if (currentPage === tabId && onResetTab) {
        onResetTab(tabId);
      }
      lastTapRef.current = null;
    } else {
      // Single tap
      lastTapRef.current = { tab: tabId, time: now };

      if (currentPage !== tabId) {
        onNavigate(tabId);
      }
    }
  }, [currentPage, onNavigate, onResetTab]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentPage === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`bottom-tab ${isActive ? 'bottom-tab-active' : ''}`}
            >
              <Icon className="bottom-tab-icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
