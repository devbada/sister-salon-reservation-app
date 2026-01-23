import { useState } from 'react';
import { Settings, BarChart3, ChevronRight, X } from 'lucide-react';
import { ExportSettings } from './ExportSettings';
import { BackupSettings } from './BackupSettings';
import { LockSettings } from './LockSettings';
import { StatisticsDashboard } from '../statistics/StatisticsDashboard';

interface SettingsPageProps {
  onLockSettingsChange?: () => void;
}

export function SettingsPage({ onLockSettingsChange }: SettingsPageProps) {
  const [showStatistics, setShowStatistics] = useState(false);

  if (showStatistics) {
    return (
      <div className="space-y-6">
        {/* Back Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStatistics(false)}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="heading-2">통계</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">예약 통계를 확인합니다</p>
          </div>
        </div>
        <StatisticsDashboard />
      </div>
    );
  }

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

      {/* Statistics Link */}
      <button
        onClick={() => setShowStatistics(true)}
        className="w-full card p-4 flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">통계</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">예약 통계 및 분석</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Settings Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LockSettings onSettingsChange={onLockSettingsChange} />
        <ExportSettings />
        <BackupSettings />
      </div>
    </div>
  );
}
