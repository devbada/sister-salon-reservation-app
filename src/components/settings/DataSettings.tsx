import { useState } from 'react';
import { ChevronRight, Cloud, FileSpreadsheet, Upload, ArrowLeft } from 'lucide-react';
import { BackupSettings } from './BackupSettings';
import { ExportSettings } from './ExportSettings';

type DataSubPage = 'menu' | 'backup' | 'export' | 'import';

interface MenuItem {
  id: DataSubPage;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'backup',
    icon: <Cloud className="w-5 h-5" />,
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    title: '백업',
    subtitle: '로컬 및 iCloud 백업, 복원',
  },
  {
    id: 'export',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    title: '내보내기',
    subtitle: 'Excel, CSV 파일로 내보내기',
  },
  {
    id: 'import',
    icon: <Upload className="w-5 h-5" />,
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
    title: '가져오기',
    subtitle: '외부 데이터 가져오기',
    disabled: true,
    badge: '준비중',
  },
];

export function DataSettings() {
  const [subPage, setSubPage] = useState<DataSubPage>('menu');

  const renderSubPage = () => {
    switch (subPage) {
      case 'backup':
        return <BackupSettings />;
      case 'export':
        return <ExportSettings />;
      case 'import':
        return (
          <div className="card p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              가져오기 기능
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              이 기능은 추후 업데이트에서 지원될 예정입니다.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (subPage !== 'menu') {
    const currentItem = menuItems.find((item) => item.id === subPage);
    return (
      <div className="space-y-4">
        {/* Sub Header */}
        <button
          onClick={() => setSubPage('menu')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">데이터 관리</span>
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
          onClick={() => !item.disabled && setSubPage(item.id)}
          disabled={item.disabled}
          className={`w-full card p-4 flex items-center justify-between
                     transition-all duration-150
                     ${item.disabled
                       ? 'opacity-60 cursor-not-allowed'
                       : 'hover:bg-white/80 dark:hover:bg-gray-800/80 active:scale-[0.99]'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
              {item.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full
                                   bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 ${item.disabled ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
        </button>
      ))}
    </div>
  );
}
