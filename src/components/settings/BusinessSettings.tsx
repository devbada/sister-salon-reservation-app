import { useState } from 'react';
import { ChevronRight, Clock, CalendarOff } from 'lucide-react';
import { BusinessHours } from '../business-hours/BusinessHours';
import { HolidayManagement } from './HolidayManagement';
import { useSwipeBack } from '../../hooks/useSwipeBack';

type BusinessSubPage = 'menu' | 'hours' | 'holidays';

interface MenuItem {
  id: BusinessSubPage;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'hours',
    icon: <Clock className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    title: '영업시간',
    subtitle: '요일별 영업시간 설정',
  },
  {
    id: 'holidays',
    icon: <CalendarOff className="w-5 h-5" />,
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
    title: '휴일 관리',
    subtitle: '휴무일 및 특별 휴일 설정',
  },
];

export function BusinessSettings() {
  const [subPage, setSubPage] = useState<BusinessSubPage>('menu');

  const renderSubPage = () => {
    switch (subPage) {
      case 'hours':
        return <BusinessHours />;
      case 'holidays':
        return <HolidayManagement />;
      default:
        return null;
    }
  };

  const handleBack = () => setSubPage('menu');

  const { handlers, style, isActive } = useSwipeBack({
    onBack: handleBack,
    disabled: subPage === 'menu',
  });

  if (subPage !== 'menu') {
    const currentItem = menuItems.find((item) => item.id === subPage);
    return (
      <div
        {...handlers}
        style={style}
        className={`space-y-4 ${isActive ? '' : 'transition-transform duration-300'}`}
      >
        {/* Sub Header */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">영업 설정</span>
        </button>

        {/* Sub Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2.5 rounded-xl ${currentItem?.iconBg}`}>
            {currentItem?.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {currentItem?.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentItem?.subtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        {renderSubPage()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setSubPage(item.id)}
          className="w-full card p-4 flex items-center justify-between
                     hover:bg-white/80 dark:hover:bg-gray-800/80
                     active:scale-[0.99] transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
              {item.icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      ))}
    </div>
  );
}
