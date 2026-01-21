interface CollapsibleSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'reservations', icon: 'Cal', label: '예약 관리' },
  { id: 'designers', icon: 'Des', label: '디자이너' },
  { id: 'business-hours', icon: 'Hrs', label: '영업시간' },
  { id: 'statistics', icon: 'Sta', label: '통계' },
  { id: 'settings', icon: 'Set', label: '설정' },
];

export function CollapsibleSidebar({ currentPage, onNavigate, isOpen, onToggle }: CollapsibleSidebarProps) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full glass p-4 z-40 transition-all duration-300 ${
        isOpen ? 'w-48' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        {isOpen && (
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sisters
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/20"
        >
          {isOpen ? '<' : '>'}
        </button>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
              currentPage === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-white/20'
            }`}
            title={item.label}
          >
            <span className="font-bold">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
