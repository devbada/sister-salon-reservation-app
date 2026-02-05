import { useState } from 'react';
import { ChevronRight, Lock, Database, Clock, BarChart3, Monitor, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { utilApi } from '../../lib/tauri';

export type SettingsCategory = 'security' | 'data' | 'business' | 'statistics' | 'display' | 'appInfo';

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
    id: 'display',
    icon: <Monitor className="w-5 h-5" />,
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400',
    title: '디스플레이',
    subtitle: '글씨 크기, 버튼 크기, 고대비',
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetAll = async () => {
    setResetting(true);
    try {
      await utilApi.resetAllData();
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset:', err);
      alert('초기화에 실패했습니다.');
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

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

      {/* 모두 초기화 */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full card p-4 flex items-center justify-between
                       border-red-200 dark:border-red-900/50
                       hover:bg-red-50 dark:hover:bg-red-950/30
                       active:scale-[0.99] transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-red-600 dark:text-red-400">
                  모두 초기화
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  모든 데이터를 삭제하고 처음 상태로 되돌립니다
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div className="card p-5 border-red-300 dark:border-red-800 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-semibold">정말 초기화하시겠습니까?</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              예약, 디자이너, 고객, 설정 등 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="btn btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleResetAll}
                disabled={resetting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                           bg-red-600 text-white font-medium hover:bg-red-700
                           active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '초기화 실행'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
