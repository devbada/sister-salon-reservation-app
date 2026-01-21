interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'reservations', icon: 'Cal', label: '예약 관리' },
  { id: 'designers', icon: 'Des', label: '디자이너' },
  { id: 'business-hours', icon: 'Hrs', label: '영업시간' },
  { id: 'statistics', icon: 'Sta', label: '통계' },
  { id: 'settings', icon: 'Set', label: '설정' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-52 glass p-4 z-40">
      <h1 className="text-xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Sisters Salon
      </h1>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
              currentPage === item.id
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-white/20'
            }`}
          >
            <span className="font-bold">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
