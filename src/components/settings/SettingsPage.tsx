import { useState } from 'react';
import { Settings, Lock, Database, Clock, BarChart3, Info } from 'lucide-react';
import { SettingsMain, SettingsCategory } from './SettingsMain';
import { SecuritySettings } from './SecuritySettings';
import { DataSettings } from './DataSettings';
import { BusinessSettings } from './BusinessSettings';
import { AppInfoSettings } from './AppInfoSettings';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';
import { SwipeableView } from '../common/SwipeableView';

interface SettingsPageProps {
  onLockSettingsChange?: () => void;
}

interface CategoryInfo {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

const categoryInfo: Record<SettingsCategory, CategoryInfo> = {
  security: {
    icon: <Lock className="w-5 h-5" />,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    title: '보안',
    subtitle: '앱 잠금, PIN 설정',
  },
  data: {
    icon: <Database className="w-5 h-5" />,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    title: '데이터 관리',
    subtitle: '백업, 내보내기',
  },
  business: {
    icon: <Clock className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    title: '영업 설정',
    subtitle: '영업시간, 휴일',
  },
  statistics: {
    icon: <BarChart3 className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    title: '통계',
    subtitle: '예약 통계 및 분석',
  },
  appInfo: {
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    title: '앱 정보',
    subtitle: '버전, 문의',
  },
};

export function SettingsPage({ onLockSettingsChange }: SettingsPageProps) {
  const [currentCategory, setCurrentCategory] = useState<SettingsCategory | null>(null);

  const handleSelectCategory = (category: SettingsCategory) => {
    setCurrentCategory(category);
  };

  const handleBack = () => {
    setCurrentCategory(null);
  };

  const renderCategoryContent = () => {
    switch (currentCategory) {
      case 'security':
        return <SecuritySettings onLockSettingsChange={onLockSettingsChange} />;
      case 'data':
        return <DataSettings />;
      case 'business':
        return <BusinessSettings />;
      case 'statistics':
        return <StatisticsDashboard />;
      case 'appInfo':
        return <AppInfoSettings />;
      default:
        return null;
    }
  };

  // Category detail view with swipe back gesture
  if (currentCategory) {
    const info = categoryInfo[currentCategory];
    return (
      <SwipeableView onBack={handleBack} showHeader={false}>
        <div className="space-y-6 p-4 pb-safe">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400
                         hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                         active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${info.iconBg}`}>
                {info.icon}
              </div>
              <div>
                <h2 className="heading-2">{info.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{info.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="animate-fadeIn">
            {renderCategoryContent()}
          </div>
        </div>
      </SwipeableView>
    );
  }

  // Main category list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="heading-2">설정</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">앱 설정을 관리합니다</p>
        </div>
      </div>

      {/* Category List */}
      <div className="animate-fadeIn">
        <SettingsMain onSelectCategory={handleSelectCategory} />
      </div>
    </div>
  );
}
