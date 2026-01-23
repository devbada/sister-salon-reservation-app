import { Calendar, Users, Clock, BarChart3, Settings, Scissors, UserRoundSearch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'reservations', icon: Calendar, label: '예약 관리' },
  { id: 'customers', icon: UserRoundSearch, label: '고객' },
  { id: 'designers', icon: Users, label: '디자이너' },
  { id: 'business-hours', icon: Clock, label: '영업시간' },
  { id: 'statistics', icon: BarChart3, label: '통계' },
  { id: 'settings', icon: Settings, label: '설정' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 glass px-5 pb-5 z-40 flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold logo-text">
          Sisters Salon
        </h1>
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
              className={`nav-item w-full ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
