import { Calendar, Users, Clock, BarChart3, Settings, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CollapsibleSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'reservations', icon: Calendar, label: '예약 관리' },
  { id: 'designers', icon: Users, label: '디자이너' },
  { id: 'business-hours', icon: Clock, label: '영업시간' },
  { id: 'statistics', icon: BarChart3, label: '통계' },
  { id: 'settings', icon: Settings, label: '설정' },
];

export function CollapsibleSidebar({ currentPage, onNavigate, isOpen, onToggle }: CollapsibleSidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full glass px-4 pb-4 z-40 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-52' : 'w-[72px]'
      }`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      {/* Header */}
      <div className={`flex items-center mb-6 ${isOpen ? 'justify-between px-1' : 'justify-center'}`}>
        {isOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md flex-shrink-0">
              <Scissors className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold logo-text leading-tight">
                Sisters Salon
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Reservation
              </p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
            <Scissors className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full ${isActive ? 'nav-item-active' : ''} ${
                !isOpen ? 'justify-center px-3' : ''
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className={`pt-4 border-t border-white/10 ${isOpen ? '' : 'flex justify-center'}`}>
        <button
          onClick={onToggle}
          className="btn btn-ghost btn-sm w-full"
          aria-label={isOpen ? '사이드바 접기' : '사이드바 펼치기'}
        >
          {isOpen ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>접기</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
