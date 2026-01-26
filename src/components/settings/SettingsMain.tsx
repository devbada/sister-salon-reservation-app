import { ChevronRight, Lock, Database, Clock, BarChart3, Info } from 'lucide-react';

export type SettingsCategory = 'security' | 'data' | 'business' | 'statistics' | 'appInfo';

interface CategoryItem {
  id: SettingsCategory;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

const categories: CategoryItem[] = [
  {
    id: 'security',
    icon: <Lock className="w-5 h-5" />,
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    title: '보안',
    subtitle: '앱 잠금, PIN 설정',
  },
  {
    id: 'data',
    icon: <Database className="w-5 h-5" />,
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    title: '데이터 관리',
    subtitle: '백업, 내보내기',
  },
  {
    id: 'business',
    icon: <Clock className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
    title: '영업 설정',
    subtitle: '영업시간, 휴일',
  },
  {
    id: 'statistics',
    icon: <BarChart3 className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    title: '통계',
    subtitle: '예약 통계 및 분석',
  },
  {
    id: 'appInfo',
    icon: <Info className="w-5 h-5" />,
    iconBg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    title: '앱 정보',
    subtitle: '버전, 문의',
  },
];

interface SettingsMainProps {
  onSelectCategory: (category: SettingsCategory) => void;
}

export function SettingsMain({ onSelectCategory }: SettingsMainProps) {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className="w-full card p-4 flex items-center justify-between
                     hover:bg-white/80 dark:hover:bg-gray-800/80
                     active:scale-[0.99] transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${category.iconBg}`}>
              {category.icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {category.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {category.subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      ))}
    </div>
  );
}
