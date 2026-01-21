interface BottomTabsProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const tabs = [
  { id: 'reservations', icon: 'Cal', label: '예약' },
  { id: 'designers', icon: 'Des', label: '디자이너' },
  { id: 'business-hours', icon: 'Hrs', label: '영업시간' },
  { id: 'settings', icon: 'Set', label: '설정' },
];

export function BottomTabs({ currentPage, onNavigate }: BottomTabsProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-50 safe-area-bottom">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors min-w-[60px] ${
              currentPage === tab.id ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <span className="text-lg font-bold">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
